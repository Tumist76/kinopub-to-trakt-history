# Kinopub (KinoAPI) API reference (full)

# KinoAPI: эндпоинты для аутентификации, истории просмотров и метаданных (movies/serials/episodes)

Документ собран по публичной документации KinoAPI и покрывает только эндпоинты, необходимые для:

- авторизация (получение токенов)
- обновление токенов
- получение истории/списка просмотренного (фильмы, сериалы, эпизоды)
- получение метаданных по фильмам/сериалам (названия, постеры, imdb и др. идентификаторы)

---

## 0) Общие правила работы с API

### Базовый URL
`https://api.service-kp.com`

### Как передавать access_token в запросах
- Для **GET** запросов токен передаётся как query-параметр: `?access_token=...`
- Для **POST** запросов документация указывает, что помимо `access_token` должны присутствовать cookie и CSRF-токен (если ваш клиент работает без cookie-jar, закладывайтесь на то, что часть POST-методов может требовать “настоящую” браузерную сессию).

Практическая рекомендация для “чистого” API-клиента:
1) держите `access_token` и добавляйте его в query,
2) если потребуется POST-метод (например, `/v1/device/notify`), используйте HTTP-клиент с поддержкой cookie-jar.

---

## 1) Аутентификация (OAuth Device Flow) и токены

> Для получения `client_id` и `client_secret` документация предлагает обращаться в поддержку.  
> Поток — OAuth Device Flow: устройство получает `user_code`, пользователь вводит его на сайте, а устройство “пуллит” токен.

### 1.1 Получение `device_code`
**POST** `/oauth2/device`

**Query-параметры**
- `grant_type` = `device_code` (обяз.)
- `client_id` (обяз.)
- `client_secret` (обяз.)

**Пример запроса**
```http
POST https://api.service-kp.com/oauth2/device?grant_type=device_code&client_id=myclient&client_secret=mysecret
```

**Ответ 200 (JSON)**
Поля:
- `code` — device_code для последующего получения access token
- `user_code` — код для пользователя
- `verification_uri` — URL, где пользователь вводит `user_code`
- `expires_in` — время жизни `code` (сек.)
- `interval` — минимальный интервал опроса (сек.)

Пример:
```json
{
  "code": "ab23lcdefg340g0jgfgji45jb",
  "user_code": "ASDFGH",
  "verification_uri": "https://kino.pub/device",
  "expires_in": 8600,
  "interval": 5
}
```

---

### 1.2 Ожидание подтверждения (polling)
Пока пользователь не подтвердил привязку, сервер возвращает ошибку `authorization_pending`.

**POST** `/oauth2/device`

**Query-параметры**
- `grant_type` = `device_token` (обяз.)
- `client_id` (обяз.)
- `client_secret` (обяз.)
- `code` — значение из шага 1.1 (обяз.)

**Пример запроса**
```http
POST https://api.service-kp.com/oauth2/device?grant_type=device_token&client_id=myclient&client_secret=mysecret&code=ab23lcdefg340g0jgfgji45jb
```

**Ответ 400 (пока не подтверждено)**
```json
{ "error": "authorization_pending" }
```

---

### 1.3 Получение `access_token` + `refresh_token`
После того как пользователь ввёл `user_code` на `verification_uri`, тот же polling-запрос начинает возвращать 200.

**POST** `/oauth2/device` (тот же, что в 1.2)

**Ответ 200 (JSON)**
Поля:
- `access_token` — токен для обращения к API
- `token_type` — ожидаемо `bearer`
- `expires_in` — срок действия access token (сек.)
- `refresh_token` — токен обновления (используется в 1.5)
- `scope` — “пока не используем” в доках

Пример:
```json
{
  "access_token": "asdfghjkl123456789",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "qwertyu12345678",
  "scope": null
}
```

---

### 1.4 (Рекомендуется) Сообщить серверу информацию об устройстве
Документация рекомендует сразу после получения `access_token` отправить уведомление об устройстве.

**POST** `/v1/device/notify`

**Query-параметры**
- `access_token` (обяз. для авторизованного запроса)

**Параметры запроса (как поля)**
- `title` — название устройства
- `hardware` — информация по железу
- `software` — информация по софту

> В документации поля перечислены как “параметры запроса”, но без явного примера, где именно они передаются (body vs query).  
> Безопасная стратегия: отправлять JSON-body **и** выставлять `Content-Type: application/json`. Если сервер ожидает form-urlencoded — переключиться.

**Пример запроса (вариант с JSON body)**
```http
POST https://api.service-kp.com/v1/device/notify?access_token=ACCESS_TOKEN
Content-Type: application/json

{
  "title": "AppleTV Hall",
  "hardware": "AppleTV/5.3",
  "software": "iOS/8.3"
}
```

**Ответ 200**
```json
{ "status": 200 }
```

---

### 1.5 Обновление `access_token` (refresh)
**POST** `/oauth2/token`

**Query-параметры**
- `grant_type` = `refresh_token` (обяз.)
- `client_id` (обяз.)
- `client_secret` (обяз.)
- `refresh_token` (обяз.)

**Важно по semantics**
- `refresh_token` валиден ~30 дней (по докам).
- После refresh **старые токены становятся недействительными** — обновляйте хранилище atomically (сначала сохранить новый `refresh_token`, затем `access_token`).

**Пример запроса**
```http
POST https://api.service-kp.com/oauth2/token?grant_type=refresh_token&client_id=myclient&client_secret=mysecret&refresh_token=qwertyu12345678
```

**Ответ 200**
```json
{
  "access_token": "NEW_ACCESS_TOKEN",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "NEW_REFRESH_TOKEN"
}
```

---

## 2) История просмотров (список просмотренного)

### 2.1 Получение истории просмотров (постранично)
**GET** `/v1/history`

**Query-параметры**
- `access_token` (обяз.)
- `page` — номер страницы (опц.)
- `perpage` — размер страницы: по умолчанию 20, максимум 50 (опц.)

**Пример запроса**
```http
GET https://api.service-kp.com/v1/history?access_token=ACCESS_TOKEN&page=1&perpage=20
```

**Ответ 200 (JSON)**
- `history[]` — элементы истории
- `pagination` — мета по пагинации

Поля элемента истории:
- `time` — “время, где остановились” (секунда/позиция)
- `counter` — сколько раз смотрели данный `media`
- `first_seen` — unixtime первого просмотра
- `last_seen` — unixtime последнего просмотра
- `item` — описание item (фильм/сериал/и т.п.)
- `media` — описание media (конкретный эпизод/видео-юнит)

Пример (структурно, как в доке):
```json
{
  "history": [
    {
      "time": 123,
      "counter": 1,
      "first_seen": 12344545,
      "last_seen": 1234556,
      "item": {},
      "media": {}
    }
  ],
  "pagination": {
    "total": 123,
    "current": 1,
    "perpage": 20,
    "total_items": 123
  }
}
```

#### Как из истории получить “список просмотренного”
- **Фильмы**: берёте `history[].item` где `type=movie` (или иной “не serial” тип по вашим потребностям), дедуплицируете по `item.id`.
- **Сериалы**: из истории также достаёте `item` с `type=serial`, дедуплицируете по `item.id` — это список сериалов, где пользователь что-то смотрел.
- **Эпизоды**: в истории обычно есть привязка к `media` (конкретная серия/видео). Для построения “списка просмотренных серий” можно:
  - либо группировать `history` по `item.id` и `media.id`,
  - либо (рекомендуется) подтянуть детализацию по сериалу через `/v1/watching?id=<serial_id>`.

---

## 3) Статус просмотров по сериалам/эпизодам (watching)

### 3.1 Информация по просмотрам для фильма/сериала
**GET** `/v1/watching`

**Query-параметры**
- `access_token` (обяз.)
- `id` — идентификатор фильма/сериала (обяз.)
- `video` — номер видео (начиная с 1). Если не указан — выводятся все видео (опц.)
- `season` — номер сезона для сериалов (начиная с 1). Если не указан — выводятся все сезоны (опц.)

**Пример запроса**
```http
GET https://api.service-kp.com/v1/watching?access_token=ACCESS_TOKEN&id=123
```

**Ответ 200 (JSON)**
Возвращается объект `item` с разной структурой в зависимости от типа:
- для сериалов: `seasons[] -> episodes[]`
- для фильмов/многосерийных фильмов и т.п.: `videos[]`

Поля, важные для “списка просмотренного”:
- `status`: `-1` не смотрели, `0` начали смотреть, `1` просмотрели
- `time`: позиция, где остановились
- `updated`: timestamp последнего просмотра

Пример (сериал):
```json
{
  "status": 200,
  "item": {
    "id": 123,
    "title": "Item title",
    "type": "serial",
    "seasons": [
      {
        "id": 432,
        "number": 1,
        "status": 0,
        "episodes": [
          {
            "id": 4567,
            "number": 1,
            "title": "Episode title",
            "duration": 1234,
            "time": 0,
            "status": 1,
            "updated": 123456782
          }
        ]
      }
    ]
  }
}
```

Пример (фильм/многосерийный фильм):
```json
{
  "status": 200,
  "item": {
    "id": 123,
    "title": "Item title",
    "type": "movie",
    "videos": [
      {
        "id": 1234,
        "number": 1,
        "title": "Video title",
        "duration": 1234,
        "time": 123,
        "status": 1,
        "updated": 123456782
      }
    ]
  }
}
```

---

### 3.2 Недосмотренные фильмы/концерты/документальные/3D
**GET** `/v1/watching/movies`

> Этот эндпоинт полезен, если нужен отдельный экран “Продолжить просмотр”, но не обязателен для “истории” (она есть в `/v1/history`).

**Query-параметры**
- `access_token` (обяз.)

**Пример запроса**
```http
GET https://api.service-kp.com/v1/watching/movies?access_token=ACCESS_TOKEN
```

**Ответ 200 (JSON)**
```json
{
  "status": 200,
  "items": [
    {
      "id": 123,
      "type": "movie",
      "subtype": "",
      "title": "Название",
      "posters": {
        "small": "http://url.to/small_poster.jpg",
        "medium": "http://url.to/medium_poster.jpg",
        "big": "http://url.to/big_poster.jpg"
      }
    }
  ]
}
```

---

### 3.3 Список сериалов с новыми/недосмотренными сериями
**GET** `/v1/watching/serials`

**Query-параметры**
- `access_token` (обяз.)
- `subscribed` — `0/1` (опц.)
  - `0`: все недосмотренные сериалы
  - `1`: только сериалы из “Буду смотреть”

**Пример запроса**
```http
GET https://api.service-kp.com/v1/watching/serials?access_token=ACCESS_TOKEN&subscribed=0
```

**Ответ 200 (JSON)**
```json
{
  "status": 200,
  "items": [
    {
      "id": 123,
      "type": "serial",
      "subtype": "",
      "title": "Название",
      "posters": {
        "small": "http://url.to/small_poster.jpg",
        "medium": "http://url.to/medium_poster.jpg",
        "big": "http://url.to/big_poster.jpg"
      },
      "total": 10,
      "watched": 5,
      "new": 5
    }
  ]
}
```

---

## 4) Метаданные по фильмам и сериалам (название, постер, imdb и др.)

В этой группе вам обычно достаточно:
- **списка** `/v1/items` (если нужна лента/каталог)  
- **поиска** `/v1/items/search` (если нужен поиск)
- **деталей** `/v1/items/<item-id>` (когда есть `item.id` из истории/просмотров)

### 4.1 Список контента
**GET** `/v1/items`

**Query-параметры (самые полезные под вашу задачу)**
- `access_token` (обяз.)
- `type` — тип контента (например, `movie`, `serial`)
- `title` — поиск по заголовку (минимум 3 символа, LIKE)
- `sort` — сортировка (по умолчанию `updated-`), поддерживает `id,year,title,created,updated,rating,views,watchers`
- (есть много доп. фильтров: `genre`, `country`, `year`, `finished`, `actor`, `director`, и т.д.)

**Пример запроса (получить сериалы)**
```http
GET https://api.service-kp.com/v1/items?access_token=ACCESS_TOKEN&type=serial&sort=updated-
```

**Ответ 200 (JSON)**
Возвращаются:
- `items[]` — элементы каталога
- `pagination` — мета по пагинации (`total`, `current`, `perpage`)

Ключевые метаданные, которые прямо видны в примере документации:
- `id`
- `title`
- `type`, `subtype`
- `year`
- `posters.small|medium|big`
- `trailer.id`, `trailer.url`
- `imdb` (например `tt...`)
- `kinopoisk` (числовой id)
- + ряд доп. полей (cast/director/voice, рейтинги и т.д.)

Пример (сокращённо):
```json
{
  "items": [
    {
      "id": 1,
      "title": "Название / Оригинальное название",
      "type": "movie",
      "subtype": "multi",
      "year": 2006,
      "cast": "Актёр 1, Актёр 2",
      "director": "Режиссёр 1, Режиссёр 2",
      "rating": 7.1,
      "imdb": "tt6432180",
      "kinopoisk": 123,
      "posters": {
        "small": "http://kino.pub/media/poster/item/small/1.jpg",
        "medium": "http://kino.pub/media/poster/item/medium/1.jpg",
        "big": "http://kino.pub/media/poster/item/big/1.jpg"
      },
      "trailer": {
        "id": "udNj459jn",
        "url": "http://www.youtube.com/watch?v=udNj459jn"
      }
    }
  ],
  "pagination": {
    "total": 1,
    "current": 1,
    "perpage": 1
  }
}
```

---

### 4.2 Поиск по контенту
**GET** `/v1/items/search`

**Query-параметры**
- `access_token` (обяз.)
- `q` — строка поиска (обяз.)
- `type` — тип контента (опц.)
- `field` — поиск только в одном поле: `title|director|cast` (опц.)
- `perpage` — кол-во результатов на страницу (по умолчанию 40)
- `sectioned` — `0/1` (по умолчанию 0). Если `1`, ответ группируется по `type`.

**Пример запроса**
```http
GET https://api.service-kp.com/v1/items/search?access_token=ACCESS_TOKEN&q=terminator&type=movie&perpage=40
```

**Ответ (без `sectioned`)**
```json
{
  "status": 200,
  "items": [],
  "pagination": {}
}
```

---

### 4.3 Детальная информация по item (фильм/сериал)
**GET** `/v1/items/<item-id>`

**Query-параметры**
- `access_token` (обяз.)
- `nolinks` — `1` чтобы исключить “ссылки на видео” и существенно уменьшить ответ (особенно актуально для больших сериалов).

**Пример запроса**
```http
GET https://api.service-kp.com/v1/items/123?access_token=ACCESS_TOKEN&nolinks=1
```

**Ответ 200 (JSON)**
Структура зависит от типа, но в целом:
- `item` — метаданные (название, постеры, идентификаторы, и т.д.)
- `videos` (для movie) или `seasons`/`episodes` (для serial) — структура медиаконтента
- также могут присутствовать поля “watched/watching” на уровне видео/эпизодов

> Для вашей задачи “метаданные” проще и дешевле брать из `item`, а “что просмотрено” — из `/v1/watching`.

---

## 5) Итог: минимальный набор эндпоинтов под вашу функциональность

### Авторизация (получение токенов)
- `POST /oauth2/device?grant_type=device_code&client_id=...&client_secret=...`
- `POST /oauth2/device?grant_type=device_token&client_id=...&client_secret=...&code=...`

### Обновление токенов
- `POST /oauth2/token?grant_type=refresh_token&client_id=...&client_secret=...&refresh_token=...`

### История / просмотренное
- `GET /v1/history?access_token=...&page=...&perpage=...`  ← базовая “история”
- `GET /v1/watching?access_token=...&id=...`              ← детализация по сериалу/эпизодам (и фильмам)
- (опционально) `GET /v1/watching/movies?access_token=...` ← “продолжить просмотр”
- (опционально) `GET /v1/watching/serials?access_token=...&subscribed=...` ← недосмотренные/новые сериалы

### Метаданные о фильмах/сериалах
- `GET /v1/items?access_token=...`                        ← каталог/список (включая imdb и постеры)
- `GET /v1/items/search?access_token=...&q=...`           ← поиск
- `GET /v1/items/<item-id>?access_token=...&nolinks=1`    ← подробности по конкретному item

### (Рекомендуется, но не строго обязательно)
- `POST /v1/device/notify?access_token=...`               ← регистрация/обновление информации об устройстве

