const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');

dotenv.config({ path: '../../config.env' });
const DB = process.env.DATABASE_LOCAL;
mongoose
  .connect(DB)
  .then(() => console.log('Database connected successfully!'));

const importData = async () => {
  try {
    const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'));
    await Tour.create(tours);
    console.log('Data imported successfully!');

  } catch (err) {
    console.log(err);
  }
  process.exit();
}

const deleteData = async () => {
  try {
    await Tour.deleteMany();
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
