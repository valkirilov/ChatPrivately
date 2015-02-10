
/**
 * Messages Mongoose Model
 */

var ObjectID = require('mongodb').ObjectID,
    mongoose = require('mongoose'),
    mongooseFS = require('mongoose-fs'),
    Schema = mongoose.Schema;

var messageSchema = new Schema({
    roomId: Schema.ObjectId,
    user: { 
        id: Schema.ObjectId,
        username: String,
    },
    content: String,
    type: String,
    date: { type: Date, default: Date.now },
    isCrypted: Boolean,
});

messageSchema.index({ date: -1 }); // schema level
//messageSchema.plugin(mongooseFS, { keys: ['image.content', 'image.complement'], mongoose: mongoose });

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