import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://70aeea3ce6280c0b8d5b2b9449146781@o4511132437774336.ingest.de.sentry.io/4511132444786769",
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  debug: false,
});
