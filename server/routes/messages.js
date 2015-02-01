var express = require('express'),
    //moment = require('moment'),
    ObjectID = require('mongodb').ObjectID,
    router = express.Router(),
    authenticate = require("authenticate"),
    mongoose = require('mongoose'),
    mongoosePaginate = require('mongoose-paginate'),
    messageSchema = require('./../models/messages.js'),
    Schema = mongoose.Schema;

messageSchema.plugin(mongoosePaginate);
var Messages = mongoose.model('messages', messageSchema);

module.exports = function(database) {

    var messages = database.collection('messages');

    /******************************************
     * GET methods
     ******************************************/
    router.get('/:roomId/:page', function(req, res) {
        var roomId = new ObjectID(req.param('roomId'));

        // Messages.find(
        //     { roomId: roomId },
        //     function (error, messages) {
        //         if (error) {
        //             return res.status(500).send({ 'success': false, 'message': 'Cannot get messages.'});
        //         }

        //         res.json(messages);
        //     });

        var perPage = 10,
            currentPage = req.param('page') || 1;

        Messages.paginate(
            { roomId: roomId }, currentPage, perPage, 
            function(error, pageCount, paginatedResults, itemCount) {
                if (error) {
                    console.error(error);
                    return res.status(500).send({ 'success': false, 'message': 'Cannot get messages.'});
                } else {
                    res.json({ 'pages': pageCount, 'messages': paginatedResults });
                }
            },
            { sortBy : { date : -1 } }
        );
    });

    /******************************************
     * POST methods
     ******************************************/
    router.post('/', function(req, res) {
        var message = req.body;

        message.roomId = new ObjectID(message.roomId);
        message.userId = new ObjectID(message.user);

        var newMessage = new Messages({
            roomId: message.roomId,
            user: message.userId,
            username: message.username,
            content: message.content,
            isCrypted: message.isCrypted
        });

        Messages.create(newMessage, function(error) {
            if (error) {
                return res.status(500).send({'success': false, 'message':'Cannot insert message.'});
            }

            res.status(200).send({'success': true});
        });
    });

    router.post('/victoria', function(req, res) {
        messages.remove({}, function(reponse) {
            res.json({'success': true, 'message':'All messages are deleted'});    
        });
    });


    /******************************************
     * UTILS methods
     ******************************************/


    return router;
};