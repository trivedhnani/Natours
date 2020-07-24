import { login, logout, signup } from './login';
import { displayMap } from './mapbox';
import { updateData } from './updateSettings';
import { bookTour } from './stripe';
import { showAlert } from './alert';
import '@babel/polyfill';
// DOM Elements
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const signupForm = document.querySelector('.form--signup');
const logoutBtn = document.querySelector('.nav__el--logout');
const updateForm = document.querySelector('.form-user-data');
const updatePasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.querySelector('#booktour');
if (mapBox) {
  const locations = JSON.parse(
    document.getElementById('map').dataset.locations
  );
  displayMap(locations);
}
if (signupForm) {
  signupForm.addEventListener('submit', event => {
    event.preventDefault();
    const name = document.querySelector('#name').value;
    const email = document.querySelector('#email').value;
    const password = document.querySelector('#password').value;
    const confirmPassword = document.querySelector('#confirmpassword').value;
    signup(name, email, password, confirmPassword);
  });
}
if (loginForm) {
  loginForm.addEventListener('submit', event => {
    event.preventDefault();
    const email = document.querySelector('#email').value;
    const password = document.querySelector('#password').value;
    login(email, password);
  });
}
if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}
if (updateForm) {
  updateForm.addEventListener('submit', async event => {
    event.preventDefault();
    const form = new FormData();
    form.append('name', document.querySelector('#name').value);
    form.append('email', document.querySelector('#email').value);
    form.append('photo', document.querySelector('#photo').files[0]);
    await updateData(form, 'data');
  });
}
if (updatePasswordForm) {
  // console.log('password');
  updatePasswordForm.addEventListener('submit', async event => {
    event.preventDefault();
    document.querySelector('.btn--save--password').textContent = 'Updating....';
    const currentPassword = document.querySelector('#password-current').value;
    const password = document.querySelector('#password').value;
    const passwordConfirm = document.querySelector('#password-confirm').value;
    await updateData(
      { currentPassword, password, passwordConfirm },
      'password'
    );
    document.querySelector('.btn--save--password').textContent =
      'Update Password';
    document.querySelector('#password-current').value = '';
    document.querySelector('#password').value = '';
    document.querySelector('#password-confirm').value = '';
  });
}
if (bookBtn) {
  bookBtn.addEventListener('click', event => {
    event.target.textContent = 'Processing...';
    const { tourId } = event.target.dataset;
    bookTour(tourId);
  });
}
const alertMessage = document.querySelector('body').dataset.alert;
if (alertMessage) showAlert('success', alertMessage, 20);
