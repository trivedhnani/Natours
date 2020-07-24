const multer = require('multer');
const User = require('../models/user-model');
const asyncCatch = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('../controllers/handlerFactory');
const sharp = require('sharp');
const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) return cb(null, true);
  return cb(
    new AppError(400, 'Not an image! Please upload only images'),
    false
  );
};
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });
exports.uploadPhoto = upload.single('photo');
const filterdObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
exports.resizeUserPhoto = asyncCatch(async (req, res, next) => {
  if (!req.file) return next();
  // storing into memory buffer will not create this (req.file.filename)property, but we need this in the following middleware
  // which is updateUser. So we will manually set it
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({
      quality: 90
    })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});
exports.getAllUsers = factory.getAll(User);

exports.updateMe = asyncCatch(async (req, res, next) => {
  // 1.Check if user is updating password

  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        400,
        'This route is not for password updates. Please check another /updatePassword for this'
      )
    );
  }
  // 2.update user document
  // Filter out only name and email fields
  const filterBody = filterdObj(req.body, 'name', 'email');
  if (req.file) filterBody.photo = req.file.filename;
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
    new: true,
    runvalidators: true
  });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});
// User chooses to delete his account
exports.deleteMe = asyncCatch(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null
  });
});
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message:
      'This route is not defined and never will be!! Please use sign up instead'
  });
};
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
// admin deletes users permenantly
exports.deleteUser = factory.deleteOne(User);
