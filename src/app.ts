import express, { Express } from 'express';
import { errorHandler } from './middleware/errorHandler';
import vehicleRoutes from './routes/vehicleRoutes';
import userRoutes from './routes/userRoutes';

export function createApp(): Express {
  const app = express();

  app.use(express.json());

  app.use('/vehiculos', vehicleRoutes);
  app.use('/usuarios', userRoutes);

  app.use(errorHandler);

  return app;
}
