
/**
 * Posts Mongoose Model
 */

var ObjectID = require('mongodb').ObjectID,
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var postSchema = new Schema({
    userId: Schema.ObjectId,
    message: String,
    date: { type: Date, default: Date.now },
    isCrypted: Boolean,
});

// Ensure virtual fields are serialised.
postSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret, options) {
         ret.id = ret._id;
         delete ret._id;
         delete ret.__v;
     }
});


module.exports = postSchema;