/* eslint-disable import/no-extraneous-dependencies */
const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
  console.log("UNCAUGHT EXCEPTION: 💥 Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);

});

dotenv.config({ path: './config.env' });

const app = require('./app');
// console.log(app.get('env'));
// console.log(process.env);
const DB = process.env.DATABASE_LOCAL;
mongoose
  .connect(DB)
  .then(() => console.log('Database connected successfully!'));

const port = 3000;
const server = app.listen(port, () => {
  console.log(`App Listening at port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log("UNHANDLED REJECTION: 💥 shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  })
});
