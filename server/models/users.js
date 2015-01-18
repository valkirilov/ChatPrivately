
/**
 * Users Mongoose Model
 */

var ObjectID = require('mongodb').ObjectID,
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var userSchema = new Schema({
    username: String,
    password: String,
    passphrase: String,
    email: String,
    avatar: String,
    firstName: String,
    lastName: String,
    description: String,
    privateKey: String,
    publicKey: String,
    created: { type: Date, default: Date.now }
});

userSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

// Ensure virtual fields are serialised.
userSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret, options) {
         ret.id = ret._id;
         delete ret._id;
         delete ret.__v;
     }
});

module.exports = userSchema;