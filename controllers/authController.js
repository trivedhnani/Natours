const { promisify } = require('util');
const User = require('../models/user-model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const jwt = require('jsonwebtoken');
const Email = require('../utils/email.util');
const crypto = require('crypto');
const signToken = id => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};
const createAndSendToken = (req, res, user, statusCode) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  // if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  // As heroku modifies the req before reaching our app the above method does not work
  if (req.secure || req.headers['x-forwarded-proto'] === 'https')
    cookieOptions.secure = true;
  user.password = undefined;
  res.cookie('jwt', token, cookieOptions);
  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(user, url).sendWelcome();
  createAndSendToken(req, res, user, 200);
});
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1.Check if user exists
  if (!email || !password) {
    return next(new AppError(400, 'Please provide email and password'));
  }
  // 2.Check if user exists and password is correct
  const user = await User.findOne({ email: email }).select('+password');
  //Since password is not going to appear in any request we explicitly set it's visibilty by usign + sign
  // const correct = user.correctPassword(password, user.password);
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError(401, 'Invalid username or Password'));
  }

  // 3. If everything is okay then send the token to the client
  createAndSendToken(req, res, user, 200);
});
exports.logout = (req, res, next) => {
  res.cookie('jwt', 'loggedOUT', {
    expiresIn: Date.now() + 1000 * 10,
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // 1.Getting token and check if it's there
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError(401, 'You are not logged in! Please login to get access')
    );
  }
  // 2.Verification of token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // 3.check if the user still exists
  const freshuser = await User.findById(decoded.id);
  if (!freshuser) {
    return next(new AppError(401, 'User belonging this token does not exist'));
  }
  // 4.check if the user changed password after token was created
  // console.log(freshuser);
  if (freshuser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(401, 'User recently changed password. Please login again!!')
    );
  }
  // Grant access to protected route
  req.user = freshuser;
  res.locals.user = freshuser;
  next();
});
// This middleware is for renderd pages,no errors!
exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      // Verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      const freshuser = await User.findById(decoded.id);
      if (!freshuser) {
        return next();
      }
      if (freshuser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      // The  user is logged in
      res.locals.user = freshuser;
      req.user = freshuser;
    }
    next();
  } catch (err) {
    next();
  }
};
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(403, 'You are not authorized to perform this action')
      );
    }
    next();
  };
};
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError(404, 'There is no user with email address'));
  }
  // 2.Generate random reset token
  const resetToken = user.createPasswordResetToken();
  user.save({ validateBeforeSave: false });
  // console.log(resetToken);
  // 3.Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot password? Submit a patch request with your new password to ${resetURL} `;
  try {
    await new Email(user, resetURL).sendReset();
    res.status(200).json({
      status: 'success',
      message: 'Reset token sent to mail'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwoordResetExpires = undefined;
    user.save({ validateBeforeSave: false });
    return next(
      new AppError(500, 'There was an error sending email. Try again later!')
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1.Get the user based on token
  const hasedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hasedToken,
    passwordResetExpires: { $gt: Date.now() } //Find the user with token and not expired
  });
  // 2.If the token has not expired and if there is a user then set new password
  if (!user) {
    return next(new AppError(400, 'The token is invalid or expired'));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;
  await user.save();
  // 3.Update the password property of user
  // 4.Log the user in and send JWT
  createAndSendToken(req, res, user, 200);
});
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1.Get the user from collection
  const currentUser = await User.findById(req.user.id).select('+password');
  if (!currentUser) {
    return next(
      new AppError(401, 'User belonging to this token does not exist')
    );
  }
  // 2.Check if POSTed password is correct
  //console.log(req.body.currentPassword);
  if (
    !(await currentUser.correctPassword(
      req.body.currentPassword,
      currentUser.password
    ))
  ) {
    return next(new AppError(401, 'Invalid username or Password'));
  }
  // 3.Change the password
  currentUser.password = req.body.password;
  currentUser.passwordConfirm = req.body.passwordConfirm;
  await currentUser.save();
  // 4.Sign in user
  createAndSendToken(req, res, currentUser, 200);
});
