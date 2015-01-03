
var express = require('express'),
    //moment = require('moment'),
    ObjectID = require('mongodb').ObjectID,
    router = express.Router(),
    authenticate = require("authenticate"),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var friendSchema = new Schema({
    userId: Schema.ObjectId,
    friendId: String.ObjectId,
    isAccepted: Boolean 
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

var Friends = mongoose.model('friends', friendSchema);

function from_database(user) {
    user.id = user._id;
    delete user._id;

    return user;
}

function to_database(user) {
    user._id  = new ObjectID(user.id);
    //task.date = moment(task.date).toDate();

    delete user.id;

    return user;
}

module.exports = function(database) {

    var friends = database.collection('friends');

    /******************************************
     * GET methods
     ******************************************/

    router.get('/:userId', function(req, res) {
        var userId = req.param('userId');

        Friends.find({ 
            userId: userId
        }, function(error, friends) {
            if (error) {
            }
                return res.status(500).send({ 'success': false, 'message': 'Cannot find user friends.'});   

            res.json(friends);
        });
    });

    /******************************************
     * POST methods
     ******************************************/

    router.post('/add', function(req, res) {

        var userId = to_database(req.body.userId),
            friendId = to_database(req.body.friendId),

        var newUserFriend1 = new Friends({
            userId: ObjectID(userId),
            friendId: ObjectID(friendId),
            isAccepted: false,
        });
        var newUserFriend2 = new Friends({
            userId: ObjectID(friendId),
            friendId: ObjectID(userId),
            isAccepted: false,
        });

        Friends.create(newUserFriend1, newUserFriend2, function(error) {
            if (error) {
                return res.status(500).send({ 'success': false, 'message': 'Cannot add friend.'});   
            }

            res.status(200).send({'success': true});
        });
    });

    router.post('/victoria', function(req, res) {
        friends.remove({}, function(reponse) {
            res.json({'success': true, 'message':'All friends are deleted'});    
        });
    });

    /******************************************
     * UTILS methods
     ******************************************/

    return router;
};