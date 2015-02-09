var express = require('express'),
    //moment = require('moment'),
    ObjectID = require('mongodb').ObjectID,
    router = express.Router(),
    authenticate = require("authenticate"),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    roomSchema = require('./../models/rooms.js');

var Rooms = mongoose.model('rooms', roomSchema);

function from_database(room) {
    room.id = room._id;
    delete room._id;

    return room;
}

function to_database(room) {
    room._id  = new ObjectID(room.id);
    //task.date = moment(task.date).toDate();

    delete room.id;

    return room;
}

module.exports = function(database) {

    var rooms = database.collection('rooms');

    /******************************************
     * GET methods
     ******************************************/
    router.get('/', function(req, res) {

        Rooms.find({}, function(err, rooms) {
            if (err) {
                console.error('Cannot get rooms', err);
                return res.status(500).send({'success':'false', 'message':'Cannot get rooms'});
            }

            res.json(rooms);
        });
    });

    router.get('/id/:roomId', function(req, res) {
        var roomId = new ObjectID(req.params.roomId);

        Rooms.findOne({
            _id: ObjectID(roomId),
        }, function(err, room) {
            if (err) {
                console.error('Cannot get room', err);
                return res.status(500).send({'success':'false', 'message':'Cannot get room'});
            }

            res.json(room);
        });
    });

    router.get('/:userId', function(req, res) {
        var userId = new ObjectID(req.params.userId);

        Rooms.find({
            participants: { $in : [ userId ] },
        }, function(err, rooms) {
            if (err) {
                console.error('Cannot get rooms', err);
                return res.status(500).send({'success':'false', 'message':'Cannot get rooms'});
            }

            res.json(rooms);
        });
    });

    /******************************************
     * POST methods
     ******************************************/
    router.post('/create', function(req, res) {
        

        var room = new Rooms({
            title: req.body.title,
            participants: []
        });

        room.participants = req.body.participants.map(function(item) {
            console.log(item);
            return new ObjectID(item);
        });

        Rooms.create(room, function(err, response) {
            if (err) {
                console.error('Cannot insert room', err);
                return res.status(500).send({'success':'false', 'message':'Cannot create room.'});
            }

            res.status(200).send({'success':'true', 'room': response });
        });
    });


    router.post('/victoria', function(req, res) {
        rooms.remove({}, function(reponse) {
            res.json({'success':'true', 'message':'All rooms are deleted'});    
        });
    });


    /******************************************
     * UTILS methods
     ******************************************/


    return router;
};