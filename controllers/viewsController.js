const Tour = require('../models/tour-model');
const User = require('../models/user-model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Booking = require('../models/bookings-model');
exports.alerts = (req, res, next) => {
  const { alert } = req.query;
  if (alert === 'booking')
    res.locals.alert = `Your booking was successful! Please check your email for a confirmation,
  If your booking doesn't show up immediatley please comeback later.`;
  next();
};
exports.getOverView = catchAsync(async (req, res) => {
  // 1.Get tour data from collection
  const tours = await Tour.find();
  // 2.Build Templates
  // 3.Render the templates using the tour controller
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});
exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.tour }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });
  if (!tour) {
    return next(new AppError(400, 'There is no tour with that name'));
  }
  res.status(200).render('tour', {
    title: `${tour.name} tour`,
    tour
  });
});
exports.getLoginForm = catchAsync(async (req, res, next) => {
  res.status(200).render('login', {
    title: 'Log into your account'
  });
});
exports.getSignUpForm = catchAsync(async (req, res, next) => {
  res.status(200).render('signup', {
    title: 'Create a new account'
  });
});
exports.getAccount = catchAsync(async (req, res, next) => {
  res.status(200).render('account', {
    title: 'Your Account'
  });
});
exports.updateUser = catchAsync(async (req, res, next) => {
  // Since we used urlencoded middleware the url encoded values(names and values) will be accesible from req.body
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email
    },
    {
      new: true,
      runValidators: true
    }
  );
  res.status(200).render('account', {
    title: 'Your Account',
    user: updatedUser
  });
  // console.lo
});
exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1)Find all bookings
  const bookings = await Booking.find({ user: req.user.id });
  // 2)Find tours with the returned IDs
  const tourIds = bookings.map(el => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIds } });
  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  });
});
