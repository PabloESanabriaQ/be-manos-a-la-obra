import mongoose from 'mongoose';
import 'dotenv/config';

const mongoDbConnection = () => mongoose.connect(
  process.env.DB_CONNECTION
).then(() => {
  console.log('DB connection successful');
}).catch((error) => {
  console.error('The connection failed:', error);
});

export default mongoDbConnection;
