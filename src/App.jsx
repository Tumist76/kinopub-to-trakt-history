import {
  Button,
  Card,
  CardHeader,
  FluentProvider,
  Text,
  Title1,
  makeStyles,
  tokens,
  webLightTheme,
} from 'https://esm.sh/@fluentui/react-components@9.57.0';
import { ArrowRightRegular, ArrowSyncRegular } from 'https://esm.sh/@fluentui/react-icons@2.0.279';

const useStyles = makeStyles({
  page: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: '24px',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  card: {
    width: '100%',
    maxWidth: '960px',
    padding: '32px',
    display: 'grid',
    rowGap: '20px',
    borderRadius: tokens.borderRadiusXLarge,
    boxShadow: tokens.shadow16,
    '@media (max-width: 768px)': {
      padding: '24px',
      rowGap: '16px',
    },
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
    maxWidth: '70ch',
    lineHeight: tokens.lineHeightBase400,
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '12px',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  featureCard: {
    backgroundColor: tokens.colorNeutralBackground1,
  },
  actions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
});

export default function App() {
  const styles = useStyles();

  return (
    <FluentProvider theme={webLightTheme} className={styles.page}>
      <Card className={styles.card}>
        <Title1>Kinopub → Trakt Sync</Title1>
        <Text size={400} className={styles.subtitle}>
          Синхронизируйте только полностью завершенные просмотры из Kinopub в Trakt с обязательной
          проверкой дублей перед отправкой.
        </Text>

        <div className={styles.features}>
          <Card className={styles.featureCard}>
            <CardHeader
              image={<ArrowSyncRegular fontSize={20} />}
              header={<Text weight="semibold">Только завершенные просмотры</Text>}
              description={<Text>Частичные и in-progress события автоматически пропускаются.</Text>}
            />
          </Card>
          <Card className={styles.featureCard}>
            <CardHeader
              image={<ArrowRightRegular fontSize={20} />}
              header={<Text weight="semibold">Без дублей в Trakt</Text>}
              description={<Text>Перед синхронизацией история проверяется через Trakt API.</Text>}
            />
          </Card>
        </div>

        <div className={styles.actions}>
          <Button appearance="primary" size="large" icon={<ArrowRightRegular />} as="a" href="#auth">
            Перейти к авторизации
          </Button>
          <Button appearance="secondary" size="large" as="a" href="#learn-more">
            Как это работает
          </Button>
        </div>
      </Card>
    </FluentProvider>
  );
}
