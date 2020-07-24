const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/user-model');
const Tour = require('../models/tour-model');
const Booking = require('../models/bookings-model');
const ApiFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('../controllers/handlerFactory');
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //   1)Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  // 2)Create checkout session
  const sessions = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}/my-tours?tour=${
    //   req.params.tourId
    // }&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
    cancel_url: `${req.protocol}://${req.get('host')}/`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [
          `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`
        ],
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1
      }
    ]
  });
  // 3)Create session as response
  res.status(200).json({
    status: 'success',
    sessions
  });
});
// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   const { tour, user, price } = req.query;
//   if (!tour && !user && !price) {
//     return next();
//   }
//   const booking = await Booking.create({
//     tour,
//     user,
//     price
//   });
//   res.redirect(req.originalUrl.split('?')[0]);
// });
const createBookingCheckout = async session => {
  console.log('createBoking');
  const tour = session.client_reference_id;
  const user = await User.findOne({ email: session.customer_email }).id;
  const price = session.line_items[0].amount / 100;
  const booking = await Booking.create({
    tour,
    user,
    price
  });
  return;
};
exports.webHookCheckout = async (req, res, next) => {
  console.log('Hello.........');
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET_KEY
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }
  console.log('event.type', event);
  if (event.type === 'checkout.session.completed')
    await createBookingCheckout(event.data.object);
  res.status(200).json({ received: false });
};
exports.createBooking = factory.createOne(Booking);
exports.getAll = factory.getAll(Booking);
exports.getBookingById = factory.getOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
