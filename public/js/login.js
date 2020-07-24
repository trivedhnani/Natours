import axios from 'axios';
import { showAlert } from './alert';
export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: { email, password }
    });
    // console.log(res);
    if ((res.data.status = 'success')) {
      showAlert('success', 'Logged in successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    //   Axios documentation
    showAlert('error', err.response.data.message);
  }
};
export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout'
    });
    if (res.data.status === 'success') {
      // this will reload  form the sever since our template is in server
      location.reload(true);
    }
  } catch (err) {
    showAlert('error', 'Error logging out!');
  }
};
export const signup = async (name, email, password, passwordConfirm) => {
  try {
    if (password !== passwordConfirm) {
      showAlert('error', 'Password and confirm password should be same');
      return;
    }
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data: { name, email, password, passwordConfirm }
    });
    if (res.data.status === 'success') {
      showAlert('success', 'signed in successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    console.log(err);
    showAlert('error', 'Error signing up!');
  }
};
