
/**
 * Friends Mongoose Model
 */

var ObjectID = require('mongodb').ObjectID,
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var friendSchema = new Schema({
    userId: Schema.ObjectId,
    friendId: Schema.ObjectId,
    username: String,
    isAccepted: Boolean, 
    isPending: Boolean
});

friendSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

// Ensure virtual fields are serialised.
friendSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret, options) {
         ret.id = ret._id;
         delete ret._id;
         delete ret.__v;
     }
});

module.exports = friendSchema;