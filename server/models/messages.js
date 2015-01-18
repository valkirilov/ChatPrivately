
/**
 * Messages Mongoose Model
 */

var ObjectID = require('mongodb').ObjectID,
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var messageSchema = new Schema({
    roomId: Schema.ObjectId,
    user: Schema.ObjectId,
    username: String,
    content: String,
    date: { type: Date, default: Date.now },
    isCrypted: Boolean,
});

// Ensure virtual fields are serialised.
messageSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret, options) {
         ret.id = ret._id;
         delete ret._id;
         delete ret.__v;
     }
});


module.exports = messageSchema;