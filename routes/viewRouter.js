const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');
const router = express.Router();
router.use(viewsController.alerts);
router.get(
  '/',
  // bookingontroller.createBookingCheckout,
  authController.isLoggedIn,
  viewsController.getOverView
);
router.get('/tour/:tour', authController.isLoggedIn, viewsController.getTour);
router.get('/login', viewsController.getLoginForm);
router.get('/signup', viewsController.getSignUpForm);
router.get('/me', authController.protect, viewsController.getAccount);
router.get('/my-tours', authController.protect, viewsController.getMyTours);
router.post(
  '/submit-user-data',
  authController.protect,
  viewsController.updateUser
);
module.exports = router;
