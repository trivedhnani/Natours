const dotenv = require('dotenv');
process.on('uncaughtException', err => {
  console.log(err.name + ',' + err.message);
  console.log('Shutting down server due to uncaught exception');
  process.exit(1);
});
dotenv.config({ path: './config.env' });

const mongoose = require('mongoose');

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('DB connection succcessful');
  });

// console.log(process.env);
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
process.on('unhandledRejection', err => {
  console.log(err.name + ',' + err.message);
  console.log('Shutting Down the server');
  server.close(() => {
    process.exit(1);
  });
});
// For heroku SIGTERM
process.on('SIGTERM', () => {
  console.log('SIGTERM recived and shutting down server gracefully');
  server.close(() => {
    console.log('process terminated!');
  });
});
// console.log(x); Uncomment this to uncaught exceptions
