const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const fs = require('fs');
const mongoose = require('mongoose');
const Tour = require('../../models/tour-model');
const Review = require('../../models/review-model');
const User = require('../../models/user-model');
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
    // console.log('DB connection succcessful');
  });
//   Read data from file
const tour = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);
// Import data into db
const importData = async () => {
  try {
    const newtours = await Tour.create(tour);
    const newUsers = await User.create(users, { validateBeforeSave: false });
    const newReviews = await Review.create(reviews);
    // console.log('Data successfully stored');
  } catch (error) {
    // console.log(error);
  }
  process.exit();
};
const deleteAllData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    // console.log('Data successfully deleted');
  } catch (error) {
    // console.log(error);
  }
  process.exit();
};
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteAllData();
}
// console.log(process.argv);
