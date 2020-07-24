const express = require('express');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');
const router = express.Router({ mergeParams: true });
// The request to /tours/tourId/reviews is routed to this router.
// This router doesn't have access to tourId as it is parameter of tour router. And moreover
// there is no parameter defined in this route(only url handled is '/') as well. So we use merge params to gain access
// This router now can handle '/reviews' and '/tours/tourId/reviews'
router.use(authController.protect);
router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourAndUser,
    reviewController.createNewReview
  );
router
  .route('/:id')
  .get(reviewController.getReview)
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  )
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  );
module.exports = router;
