const Review = require('../models/review-model');
const catchAsync = require('../utils/catchAsync');
const ApiFeatures = require('../utils/apiFeatures');
const factory = require('../controllers/handlerFactory');
exports.getAllReviews = factory.getAll(Review);
exports.setTourAndUser = (req, res, next) => {
  // Allowing nested routes
  if (!req.body.user) req.body.user = req.user.id;
  if (!req.body.tour) req.body.tour = req.params.tourId;
  next();
};
exports.getReview = factory.getOne(Review);
exports.createNewReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
