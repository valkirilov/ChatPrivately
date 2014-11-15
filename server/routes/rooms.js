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

    router.get('/:name', function(req, res) {
        var name = req.param('name');
    });

    /******************************************
     * POST methods
     ******************************************/
    router.post('/create', function(req, res) {
        console.log(req.body.participants);
        var room = {};
        room.participants = req.body.participants.map(function(item) {
            return new ObjectID(item);
        });

        // TODO: Add only one room 

        rooms.insert(room, function(err, response) {
            if (err) {
                console.error('Cannot insert room', err);
                return res.status(500).send({'success':'false', 'message':'Cannot create room.'});
            }

            res.status(200).send({'success':'true', 'room':response});
        });
    });


    /******************************************
     * UTILS methods
     ******************************************/


    return router;
};