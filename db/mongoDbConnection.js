import mongoose from 'mongoose';
import 'dotenv/config';
import logger from '../config/logger.js';

const mongoDbConnection = () => mongoose.connect(
  process.env.MONGO_URI
).then(() => {
  logger.info('Conexión a MongoDB exitosa');
}).catch((error) => {
  logger.error({ err: error }, 'Error al conectar con MongoDB');
  process.exit(1);
});

export default mongoDbConnection;
