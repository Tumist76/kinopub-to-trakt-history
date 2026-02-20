# Trakt API reference (full)

## 6) Требуемые Trakt эндпоинты (подробно)

> Базовый URL API: `https://api.trakt.tv`  
> Обязательные заголовки для всех запросов:
> - `Content-Type: application/json`
> - `trakt-api-key: <client_id>`
> - `trakt-api-version: 2`
> - `Authorization: Bearer <access_token>` (для 🔒 методов)

### 6.1 Authentication

#### 6.1.1 POST `/oauth/device/code` (device flow — получить коды)
**Body**
```json
{ "client_id": "<client_id>" }
```

**Response 200**
```json
{
  "device_code": "....",
  "user_code": "5055CC52",
  "verification_url": "https://trakt.tv/activate",
  "expires_in": 600,
  "interval": 5
}
```

---

#### 6.1.2 POST `/oauth/device/token` (device flow — polling токена)
**Body**
```json
{
  "code": "<device_code>",
  "client_id": "<client_id>",
  "client_secret": "<client_secret>"
}
```

**Response 200**
```json
{
  "access_token": "....",
  "token_type": "bearer",
  "expires_in": 7200,
  "refresh_token": "....",
  "scope": "public",
  "created_at": 1487889741
}
```

**Ошибки**: `400 pending`, `404 invalid`, `409 already_used`, `410 expired`, `418 denied`, `429 slow_down`.

---

#### 6.1.3 POST `/oauth/token` (refresh access_token)
**Body**
```json
{
  "refresh_token": "<refresh_token>",
  "client_id": "<client_id>",
  "client_secret": "<client_secret>",
  "redirect_uri": "<redirect_uri>",
  "grant_type": "refresh_token"
}
```

**Response 200**
```json
{
  "access_token": "....",
  "token_type": "bearer",
  "expires_in": 7200,
  "refresh_token": "....",
  "scope": "public",
  "created_at": 1487889741
}
```

> Этим же эндпоинтом обычно делают и exchange `authorization_code` (grant_type=authorization_code), но в Trakt это стандартный OAuth 2.0.

---

#### 6.1.4 POST `/oauth/revoke` (опционально: logout)
**Body**
```json
{
  "token": "<access_token>",
  "client_id": "<client_id>",
  "client_secret": "<client_secret>"
}
```

**Response 200**
```json
{}
```

---

### 6.2 ID lookup / поиск (для маппинга Kinopub -> Trakt)

#### 6.2.1 GET `/search/imdb/{id}?type=movie|show|episode`
- `{id}`: например `tt1104001`
- `type`: ограничивает тип результатов (для IMDB лучше указывать)

**Response 200 (пример movie)**
```json
[
  {
    "type": "movie",
    "score": null,
    "movie": {
      "title": "TRON: Legacy",
      "year": 2010,
      "ids": { "trakt": 12601, "slug": "tron-legacy-2010", "imdb": "tt1104001", "tmdb": 20526 }
    }
  }
]
```

---

#### 6.2.2 GET `/search/{type}?query=...` (fallback text search)
- `{type}`: `movie` или `show`
- `query`: строка поиска (title)

Использовать ТОЛЬКО если нет IMDB/TMDB/TVDB id.

---

### 6.3 Получение списка эпизодов (чтобы получить episode ids)

#### 6.3.1 GET `/shows/{id}/seasons/{season}?extended=episodes`
- `{id}`: Trakt ID или slug шоу
- `{season}`: номер сезона
- `extended=episodes`: чтобы вернулись эпизоды с `ids`

**Response 200 (сокращённый пример)**
```json
[
  {
    "number": 1,
    "episodes": [
      {
        "season": 1,
        "number": 1,
        "title": "Winter Is Coming",
        "ids": { "trakt": 36440, "tvdb": 3254641, "tmdb": 63056, "imdb": "tt1480055" }
      }
    ]
  }
]
```

---

### 6.4 Sync: чтение history (для дедупа)

#### 6.4.1 GET `/sync/last_activities`
Полезно, чтобы понимать, менялась ли история с прошлого раза (оптимизация).  
**OAuth required**.

**Response 200**: объект с `movies.watched_at`, `episodes.watched_at` и т.п.

---

#### 6.4.2 GET `/sync/history/{type}?start_at=...&end_at=...`
- `{type}`: `movies` или `episodes`
- `start_at`, `end_at`: UTC ISO 8601
- Пагинация через заголовки:
  - `X-Pagination-Page`, `X-Pagination-Page-Count`, `X-Pagination-Limit`, `X-Pagination-Item-Count`

**Response 200 (пример episodes, сокращённый)**
```json
[
  {
    "id": 1982346,
    "watched_at": "2014-03-31T09:28:53.000Z",
    "action": "watch",
    "type": "episode",
    "episode": {
      "season": 2,
      "number": 1,
      "title": "Pawnee Zoo",
      "ids": { "trakt": 251, "tvdb": 797571, "tmdb": 397629, "imdb": null }
    },
    "show": {
      "title": "Parks and Recreation",
      "year": 2009,
      "ids": { "trakt": 4, "tvdb": 84912, "tmdb": 8592, "imdb": "tt1266020", "slug": "parks-and-recreation" }
    }
  }
]
```

---

### 6.5 Sync: запись history (собственно синхронизация)

#### 6.5.1 POST `/sync/history`
Добавляет элементы в историю просмотров.  
**OAuth required**.

**Body (пример: 1 movie + 1 episode)**
```json
{
  "movies": [
    { "ids": { "imdb": "tt0372784" }, "watched_at": "2014-09-01T09:10:11.000Z" }
  ],
  "episodes": [
    { "ids": { "trakt": 1061 }, "watched_at": "2014-09-01T09:10:11.000Z" }
  ]
}
```

**Response 201**
```json
{
  "added": { "movies": 1, "episodes": 1 },
  "not_found": { "movies": [], "episodes": [] }
}
```

---

## 7) Минимальный список Trakt эндпоинтов для задачи

### OAuth
- `POST /oauth/device/code`
- `POST /oauth/device/token`
- `POST /oauth/token` (refresh)
- `POST /oauth/revoke` (опционально)
- `GET https://trakt.tv/oauth/authorize` (если используете authorization code flow)

### Маппинг
- `GET /search/imdb/{id}?type=movie|show`
- `GET /shows/{id}/seasons/{season}?extended=episodes`

### Дедуп + запись истории
- `GET /sync/history/movies`
- `GET /sync/history/episodes`
- `POST /sync/history`
- `GET /sync/last_activities` (опционально, но желательно)

---

## 8) Чек-лист “готово к прод” (для автономного агента)

1. ✅ Умеет получать Trakt tokens (device flow или auth code) **без хранения client_secret в SPA**.  
2. ✅ Refresh работает перед любым 🔒 вызовом.  
3. ✅ Из Kinopub собираются только **completed** просмотры.  
4. ✅ Episode mapping через IMDB шоу + seasons endpoint.  
5. ✅ Перед POST `/sync/history` строится remote index через GET `/sync/history/*`.  
6. ✅ Дедуп (skip duplicates) реализован строго по ключам §2.2.  
7. ✅ Обработаны rate limits и временные ошибки (ретраи).  
8. ✅ `last_success_at` сохраняется только после успешной синхронизации всех батчей.
