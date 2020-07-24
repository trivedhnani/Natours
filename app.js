const express = require('express');

const app = express();
const path = require('path');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoute');
const reviewRouter = require('./routes/reviewRouter');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');
const AppError = require('./utils/appError');
const rateLimit = require('express-rate-limit');
const gloablErrorHandler = require('./controllers/errorController');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const helmet = require('helmet');
const hpp = require('hpp');
const viewRouter = require('./routes/viewRouter');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');
// For heroku
app.enable('trust proxy');
// Middlewares
// Cross origin resourse sharing Acess-control-Allow-origin
app.use(cors());
app.options('*', cors());
// Set HTTP headers
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
// Serving static files
app.use(express.static(path.join(__dirname, `public`)));
app.use(helmet());
// Limit request from same API
const limiter = rateLimit({
  max: 200,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api', limiter);

app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }), //Body should be in raw form for stripe webhook
  bookingController.webHookCheckout
);
// Body parser, reading data from body into req.body. Body with >10kb size is not accepted
app.use(express.json({ limit: '10kb' }));
// To use java style form submissions and accessing data from the url
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
// Cookie parser. To read cookies in express;
app.use(cookieParser());

// Remove NoSQL injection and XSS
app.use(mongoSanitize());
app.use(xss());
// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'average',
      'maxGroupSize',
      'ratingsAverage',
      'ratingsQuantity',
      'price'
    ]
  })
);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Compression middleware- compresses the text responses from server to client
app.use(compression());

// Sample middlewares
app.use((req, res, next) => {
  console.log('Hello from middleware!!');
  // console.log(req.cookies);
  next();
});
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 2. Route Handlers

// 3.Routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
app.all('*', (req, res, next) => {
  const err = new AppError(404, `Can't find ${req.originalUrl} on this server`);
  next(err);
});
app.use(gloablErrorHandler);
// 4.Create server
module.exports = app;
