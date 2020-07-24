import axios from 'axios';
import { showAlert } from './alert';
export const bookTour = async tourId => {
  const stripe = Stripe('pk_test_IDK37aAFZkw0e4C0BfPuIInW00UjBeJywi');
  try {
    // 1)Get checkout from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    //2) Create checkout from and charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.sessions.id
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
