import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://70aeea3ce6280c0b8d5b2b9449146781@o4511132437774336.ingest.de.sentry.io/4511132444786769",
  environment: process.env.NODE_ENV,

  // Capturar el 100% de errores, ajustar si hay mucho volumen
  tracesSampleRate: 0.1,

  // No mostrar errores de Sentry en la consola del browser en dev
  debug: false,
});
