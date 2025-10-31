import { app } from '@/app.ts';
import { env } from '@/config/env.ts';

// Iniciar servidor
app.listen({ port: env.PORT, host: env.HOST })
  .then(() => {
    app.log.info(`🚀 Server running at http://${env.HOST}:${env.PORT}`);
    app.log.info(`📚 API Documentation available at http://${env.HOST}:${env.PORT}/docs`);
    app.log.info(`🏥 Health check available at http://${env.HOST}:${env.PORT}/health`);
  })
  .catch((err) => {
    app.log.error(err, 'Error starting server');
    process.exit(1);
  });