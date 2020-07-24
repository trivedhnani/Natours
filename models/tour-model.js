const mongoose = require('mongoose');
const validator = require('validator');
// const User = require('./user-model'); Not needed for referencing. Mongoose automatically fecthes
const slugify = require('slugify');
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have name'],
      unique: true,
      trim: true,
      minlength: [10, 'A tour name must have minimum 10 characters'],
      maxlength: [40, 'A tour name can have maximum of 40 characters']
      // validate: [validator.isAlpha, 'Tour name must only contain characers'] -->Does'nt check for space
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'please choose one of easy, medium and difficult'
      }
    },
    price: {
      type: Number,
      required: [true, 'A tour must have price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          return val < this.price;
        },
        message: 'Price discount ({VALUE}) should be less than Price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have description']
    },
    ratingAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Minimum rating is 1'],
      max: [5, 'Maximim rating is 5'],
      set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdDate: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ],
    slug: String
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
// tourSchema.index({ price: 1 });Indexing price field
// 1 indicates ascending and -1 indicates descending
// First sorts by price and for same price sorts by ratingsAverage
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});
// Document middleware
tourSchema.pre('save', function(next) {
  // console.log('In presave');
  this.slug = slugify(this.name.toLowerCase());
  next();
});
// This block is needed for embedding not referencing
// tourSchema.pre('save', async function(next) {
//   // Anything returned from async is promise
//   const guidesPromises = this.guides.map(async guideId => {
//     return await User.findById(guideId);
//   });
//   // awaiting array of Promises
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });
tourSchema.post('save', function(doc, next) {
  // console.log(doc);
  next();
});
// Query middleware
tourSchema.pre('find', function(next) {
  // console.log('pre fetch');
  next();
});
tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -__passwordChangedAt'
  });
  next();
});
tourSchema.post('find', function(docs, next) {
  // console.log('post fetch');
  next();
});
const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
