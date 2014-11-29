var express = require('express'),
    //moment = require('moment'),
    ObjectID = require('mongodb').ObjectID,
    router = express.Router(),
    authenticate = require("authenticate");

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

        rooms.find({}).toArray(function(err, rooms) {
            if (err) {
                console.error('Cannot get rooms', err);
                return res.status(500).send({'success':'false', 'message':'Cannto get rooms'});
            }

            res.json(rooms.map(from_database));
        });
    });

    router.get('/id/:roomId', function(req, res) {
        var roomId = new ObjectID(req.param('roomId'));

        rooms.findOne({
            _id: roomId,
        }, function(err, room) {
            if (err) {
                console.error('Cannot get room', err);
                return res.status(500).send({'success':'false', 'message':'Cannot get room'});
            }

            res.json(room);
        });
    });

    router.get('/:userId', function(req, res) {
        var userId = new ObjectID(req.param('userId'));

        rooms.find({
            participants: { $in : [ userId ] },
        }).toArray(function(err, rooms) {
            if (err) {
                console.error('Cannot get rooms', err);
                return res.status(500).send({'success':'false', 'message':'Cannot get rooms'});
            }

            res.json(rooms.map(from_database));
        });
    });

    /******************************************
     * POST methods
     ******************************************/
    router.post('/create', function(req, res) {
        var room = {};
        room.participants = req.body.participants.map(function(item) {
            return new ObjectID(item);
        });
        room.title = req.body.title;

        // TODO: Add only one room 

        rooms.insert(room, function(err, response) {
            if (err) {
                console.error('Cannot insert room', err);
                return res.status(500).send({'success':'false', 'message':'Cannot create room.'});
            }
            var fixed = from_database(response[0]);
            res.status(200).send({'success':'true', 'room':fixed });
        });
    });


    /******************************************
     * UTILS methods
     ******************************************/


    return router;
};