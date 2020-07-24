const AppError = require('../utils/appError');
const sendErrorDev = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // RENDER WEBSITE
    console.log('error', err);
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      message: err.message
    });
  }
};
const sendErrorProd = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    // Operational error
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } else {
      //Programmimg orUnkown Error:don't leak details to client
      // 1.Log error
      console.error(err);
      //2.Send generic error
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong!'
      });
    }
  } else {
    // RENDER
    if (err.isOperational) {
      res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        message: err.message
      });
    } else {
      //Programmimg orUnkown Error:don't leak details to client
      // 1.Log error
      console.error(err);
      //2.Send generic error
      res.status(500).render('error', {
        title: 'Something went wrong!',
        message: 'Please try again later.'
      });
    }
  }
};
const handleCastErrorDB = err => {
  const message = `Invalid ${err.path} with value ${err.value}`;
  return new AppError(404, message);
};
const handleduplicateFeildsDB = err => {
  const value = err.errmsg.match(/"(.*?)"/)[0];
  const message = `Duplicate field value:${value}. Please use another value!!`;
  return new AppError(400, message);
};
const handleValidationError = err => {
  const value = Object.values(err.errors)
    .map(obj => obj.message)
    .join('. ');
  const message = `Invalid input data.${value} `;
  return new AppError(400, message);
};
const handleJWTError = err =>
  new AppError(401, 'Invalid token. Please try again');
const handleJWTTokenExpiredError = err =>
  new AppError(401, 'Your Token has Expired');
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'fail';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err, message: err.message };
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleduplicateFeildsDB(error);
    if (error.name === 'ValidationError') error = handleValidationError(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
    if (error.name === 'TokenExpiredError')
      error = handleJWTTokenExpiredError(error);
    sendErrorProd(error, req, res);
  }
};
