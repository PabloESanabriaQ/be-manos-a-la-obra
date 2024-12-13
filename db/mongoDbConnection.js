const mongoose = require("mongoose");
require('dotenv').config();

const mongoDbConnection = () => mongoose.connect(
    process.env.DB_CONNECTION
).then(() => {
  console.log('DB connection successful');
}).catch((error) => {
  console.error('The connection failed:', error);
});

module.exports = mongoDbConnection;
