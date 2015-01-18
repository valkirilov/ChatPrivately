
var express = require('express'),
    //moment = require('moment'),
    ObjectID = require('mongodb').ObjectID,
    router = express.Router(),
    authenticate = require("authenticate"),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    friendSchema = require('./../models/friends.js'),
    userSchema = require('./../models/users.js'),
    underscore = require('underscore');

var Friends = mongoose.model('friends', friendSchema);
var Users = mongoose.model('users', userSchema);

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

    //var friends = database.collection('friends');

    /******************************************
     * GET methods
     ******************************************/

    router.get('/:userId', function(req, res) {
        var userId = req.param('userId');

        Friends.find({ 
            userId: userId,
            isAccepted: true
        }, function(error, friends) {
            if (error) {
                return res.status(500).send({ 'success': false, 'message': 'Cannot find user friends.'});   
            }

            var friendsList = friends.map(function(friend) {
                return friend.friendId;
            });

            // Now let's get info about that guys
            Users.find({
                _id: { $in: friendsList }
            }, function(error, users) {
                 if (error) {
                    return res.status(500).send({ 'success': false, 'message': 'Cannot find user friends.'});   
                }

                res.json(users);
            });
        });
    });

    router.get('/requests/:userId', function(req, res) {
        var userId = req.param('userId');

        Friends.find({ 
            userId: userId,
            isAccepted: false 
        }, function(error, friends) {
            if (error) {
                return res.status(500).send({ 'success': false, 'message': 'Cannot find user friends requests.'});   
            }
                
            res.json(friends);
        });
    });

    router.get('/recommended/:userId', function(req, res) {
        var userId = req.param('userId');

        // First get all of the users
        // Then filter the users that you are already friend with

        Users.find({
            _id: { $ne: ObjectID(userId) }
        }, function(error, users) {
            if (error) {
                console.log(error);
                return res.status(500).send({ 'success': false, 'message': 'Cannot find user friends recommendations.'});   
            }

            Friends.find({
                userId: ObjectID(userId)
            }, function(error, friends) {
                if (error) {
                    console.log(error);
                    return res.status(500).send({ 'success': false, 'message': 'Cannot find user friends recommendations.'});   
                }

                var filtered = underscore.filter(users, function(user) {
                    
                    var isFriend = underscore.filter(friends, function(friend) {
                        if (friend.friendId.toString() === user.id) {
                            console.log(user.username + ' ' + friend.username);
                            return friend;
                        }
                    });

                    if (isFriend.length === 0) {
                        user.password = undefined;
                        user.passphrase = undefined;
                        user.privateKey = undefined;
                        user.publicKey = undefined;

                        return user;
                    }
                });

                res.json(filtered);
            });
        });
    });

    /******************************************
     * POST methods
     ******************************************/

    router.post('/add', function(req, res) {

        var user = req.body.user,
            friend = req.body.friend;

        var newUserFriend1 = new Friends({
            userId: ObjectID(user.id),
            friendId: ObjectID(friend.id),
            username: friend.username,
            isAccepted: false,
            isPending: true,
        });
        var newUserFriend2 = new Friends({
            userId: ObjectID(friend.id),
            friendId: ObjectID(user.id),
            username: user.username,
            isAccepted: false,
            isPending: false,
        });

        Friends.create(newUserFriend1, newUserFriend2, function(error) {
            if (error) {
                return res.status(500).send({ 'success': false, 'message': 'Cannot add friend.'});   
            }

            res.status(200).send({'success': true});
        });
    });

    router.post('/accept', function(req, res) {

        var request = req.body.request;

        Friends.update({
            $or: [
                { 
                    $and: [
                        { userId: request.userId },
                        { friendId: request.friendId },
                    ]
                },
                {
                    $and: [
                        { userId: request.friendId },
                        { friendId: request.userId },
                    ]  
                }
            ]
        }, {
            isPending: false,
            isAccepted: true,
        }, { multi: true}, function(error, friends) {
            if (error) {
                return res.status(500).send({ 'success': false, 'message': 'Cannot accept friend.'});   
            }
            console.log(friends);
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