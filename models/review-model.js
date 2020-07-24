const mongoose = require('mongoose');
const Tour = require('./tour-model');
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'A review should not be empty']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    rating: {
      type: Number,
      min: [1, 'Minimum rating should be atleast 1'],
      max: [5, 'Maximum rating should be atmost 5 '],
      required: [true, 'Review must have rating'],
      set: val => Math.round(val * 10) / 10
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
// This ensures that each combination of tour user is unique
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });
reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});
reviewSchema.statics.calcAvgRatings = async function(tourId) {
  // Static methods this keyword points to Model
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        avgRatings: { $avg: '$rating' }
      }
    }
  ]);
  // console.log(stats);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRatings,
      ratingAverage: stats[0].avgRatings
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingAverage: 4.5
    });
  }
};
reviewSchema.post('save', async function() {
  // this.constructor  points to current model
  // console.log('post save');
  await this.constructor.calcAvgRatings(this.tour);
});
reviewSchema.pre(/^findOneAnd/, async function(next) {
  // To get access to document
  // console.log(this);
  this.reviewDoc = await this.findOne();
  next();
});
reviewSchema.post(/^findOneAnd/, async function() {
  // console.log(this);
  await this.reviewDoc.constructor.calcAvgRatings(this.reviewDoc.tour);
});
const Review = new mongoose.model('Review', reviewSchema);
module.exports = Review;
