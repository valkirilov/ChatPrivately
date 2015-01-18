var express = require('express'),
    //moment = require('moment'),
    ObjectID = require('mongodb').ObjectID,
    router = express.Router(),
    authenticate = require("authenticate"),
    mongoose = require('mongoose'),
    postSchema = require('./../models/posts.js'),
    friendSchema = require('./../models/friends.js'),
    Schema = mongoose.Schema,
    moment = require('moment');

var Posts = mongoose.model('posts', postSchema);
var Friends = mongoose.model('friends', friendSchema);

module.exports = function(database) {

    //var messages = database.collection('messages');

    /******************************************
     * GET methods
     ******************************************/
    router.get('/:userId', function(req, res) {
        var userId = new ObjectID(req.param('userId'));

        Friends.find({ userId: userId})
            .select('friendId')
            .exec(function(error, friends) {
                if (error) {
                    return res.status(500).send({ 'success': false, 'message': 'Cannot get posts.'});
                }

                var friendsList = friends.map(function(friend) {
                    return friend.friendId;
                });
                friendsList.push(userId);

                Posts.find({ userId: { $in : friendsList } })
                    .sort({ date: -1})
                    .exec(function (error, posts) {
                        if (error) {
                            return res.status(500).send({ 'success': false, 'message': 'Cannot get posts.'});
                        }

                        console.log(users);
                        res.json(posts);
                    });
            });
    });

    router.get('/my/:userId', function(req, res) {
        var userId = new ObjectID(req.param('userId'));

        Posts.find({ userId: userId })
            .sort({ date: -1})
            .exec(function (error, posts) {
                if (error) {
                    return res.status(500).send({ 'success': false, 'message': 'Cannot get posts.'});
                }

                res.json(posts);
            });
    });

    /******************************************
     * POST methods
     ******************************************/
    router.post('/', function(req, res) {

        var newPost = new Posts({
            userId: ObjectID(req.body.userId),
            message: req.body.message
        });

        console.log(newPost);

        Posts.create(newPost, function(error) {
            if (error) {
                return res.status(500).send({'success': false, 'message':'Cannot insert post.'});
            }

            res.status(200).send({'success': true});
        });
    });


    /******************************************
     * UTILS methods
     ******************************************/


    return router;
};