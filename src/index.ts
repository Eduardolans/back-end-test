import express from 'express';
import { errorHandler } from './interface/middleware/errorHandler';
import vehicleRoutes from './interface/routes/vehicleRoutes';
import userRoutes from './interface/routes/userRoutes';

const app = express();

app.use(express.json());

app.use('/vehiculos', vehicleRoutes);
app.use('/usuarios', userRoutes);

app.use(errorHandler);

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${PORT}`);
});
