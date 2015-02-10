var express = require('express'),
    //moment = require('moment'),
    ObjectID = require('mongodb').ObjectID,
    router = express.Router(),
    authenticate = require("authenticate"),
    mongoose = require('mongoose'),
    mongoosePaginate = require('mongoose-paginate'),
    messageSchema = require('./../models/messages.js'),
    Schema = mongoose.Schema,
    moment = require('moment');

messageSchema.plugin(mongoosePaginate);
var Messages = mongoose.model('messages', messageSchema);

module.exports = function(database) {

    var messages = database.collection('messages');

    /******************************************
     * GET methods
     ******************************************/
    
    router.get('/stats/:roomId', function(req, res) {
        var roomId = new ObjectID(req.params.roomId);

        var today = moment();
        var startOfDay = new Date(today.startOf('day').format()),
            startOfWeek = new Date(today.startOf('week').format()),
            startOfMonth = new Date(today.startOf('month').format()),
            startOfYear = new Date(today.startOf('year').format());

        Messages.aggregate([
            {
                $match: { 'roomId' : roomId }
            }, {
            $group: {
                _id: { id: '$user.id', username: '$user.username' },
                all: { $sum: 1 },
                today: {
                    "$sum": {
                        "$cond": [ { "$gt": [ "$date", startOfDay ] }, 1, 0 ]
                    }
                },
                week: {
                    "$sum": {
                        "$cond": [ { "$gt": [ "$date", startOfWeek ] }, 1, 0 ]
                    }
                },
                month: {
                    "$sum": {
                        "$cond": [ { "$gt": [ "$date", startOfMonth ] }, 1, 0 ]
                    }
                },
                year: {
                    "$sum": {
                        "$cond": [ { "$gt": [ "$date", startOfYear ] }, 1, 0 ]
                    }
                },
            },
        }, {
        $project: {
            _id   : 1,
            all: 1,
            today: 1,
            week: 1,
            month: 1,
            year: 1
        }
        }], function(error, response) {
            if (error) {
                console.log(error);
                return res.status(500).send({ 'success': false, 'message': 'Cannot get stats.'});
            }

            res.json(response);
        });

    });

    router.get('/:roomId/:page', function(req, res) {
        var roomId = new ObjectID(req.params.roomId);

        var perPage = 10,
            currentPage = req.params.page || 1;

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
            user: { 
                id: message.userId,
                username: message.username,
            },
            content: message.content,
            type: message.type,
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