const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router();
router.use(authController.protect);
router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);
router.use(authController.restrictTo('admin', 'lead-guide'));
router
  .route('/')
  .get(bookingController.getAll)
  .post(bookingController.createBooking);
router
  .route(':/id')
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking)
  .get(bookingController.getBookingById);
module.exports = router;
