var express = require('express'),
    //moment = require('moment'),
    ObjectID = require('mongodb').ObjectID,
    router = express.Router(),
    authenticate = require("authenticate");

function from_database(message) {
    message.id = message._id;
    delete message._id;

    return message;
}

function to_database(message) {
    message._id  = new ObjectID(message.id);
    //task.date = moment(task.date).toDate();

    delete message.id;

    return message;
}

module.exports = function(database) {

    var messages = database.collection('messages');

    /******************************************
     * GET methods
     ******************************************/
    router.get('/:roomId', function(req, res) {
        var roomId = new ObjectID(req.param('roomId'));

        messages.find({
            roomId: roomId
        }).toArray(function(err, messages) {
            if (err) {
                console.error('Cannot get rooms', err);
                return res.status(500).send({'success':'false', 'message':'Cannot get messages'});
            }

            res.json(messages.map(from_database));
        });
    });

    /******************************************
     * POST methods
     ******************************************/
    router.post('/', function(req, res) {
        console.log('Saver req received');
        var message = req.body;
        message.roomId = new ObjectID(message.roomId);
        message.userId = new ObjectID(message.userId);

        messages.insert(message, function(err, response) {
            if (err) {
                console.error('Cannot insert message', err);
                return res.status(500).send({'success':'false', 'message':'Cannot insert message.'});
            }

            res.status(200).send({'success':'true'});
        });
    });


    /******************************************
     * UTILS methods
     ******************************************/


    return router;
};