const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');
const Review = require('../../models/reviewModel');
const User = require('../../models/userModel');

dotenv.config({ path: '../../config.env' });
const DB = process.env.DATABASE_LOCAL;
mongoose
  .connect(DB)
  .then(() => console.log('Database connected successfully!'));

const importData = async () => {
  try {
    const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
    const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));
    const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
    await Tour.create(tours);
    await Review.create(reviews);
    await User.create(users, { validateBeforeSave: false });
    console.log('Data imported successfully!');

  } catch (err) {
    console.log(err);
  }
  process.exit();
}

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await Review.deleteMany();
    await User.deleteMany();
    console.log('Data Deleted successfully!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
}

if (process.argv[2] === '--import') {
  importData();
}
else if (process.argv[2] === '--delete') {
  deleteData();
}
