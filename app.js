const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const express = require('express');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
// const xss = require('xss');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1. GLOBAL MIDDLEWARE

//protecting HTTP Requests
app.use(helmet());

//Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Limiting number requests per hour from the same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'To many requests from this IP. Please try again after one hour'
});
app.use('/api', limiter);

//Body Parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

//Data sanitization against NOSQL injection
app.use(mongoSanitize());

//Data sanitization against XSS
// app.use(xss());

//protect against HTTP Parameter Pollution attacks
app.use(hpp({
  whitelist: [
    'duration',
    'maxGroupSize',
    'difficulty',
    'ratingsAverage',
    'ratingsQuantity',
    'price',
    'durationWeeks',
  ]
}));

//serving static filea
app.use(express.static(`${__dirname}/public`));

//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`This ${req.originalUrl} url is not found!`, 404));
});

app.use(globalErrorHandler);
module.exports = app;
