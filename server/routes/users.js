var express = require('express'),
    //moment = require('moment'),
    ObjectID = require('mongodb').ObjectID,
    router = express.Router(),
    authenticate = require("authenticate");

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

    var users = database.collection('users');

    /******************************************
     * GET methods
     ******************************************/
    router.get('/', function(req, res) {

        users.find({}).toArray(function(err, users) {
            if (err) {
                console.error('Cannot get users', err);
                return res.status(500).send();
            }

            res.json(users.map(from_database));
        });
    });

    router.get('/:name', function(req, res) {
        var name = req.param('name');

        getUser(req, res, name, function(user) {
            res.json(user);
        });
    });

    /******************************************
     * POST methods
     ******************************************/
    router.post('/login', function(req, res) {

        var name = req.body.name,
            password = req.body.password;

        getUser(req, res, name, function(user) {
            var client_id = 'client-id-victoria',
                user_id = user.id,
                extra_data = 'extra-data-victoria';

            // Check the input password validity
            if (user.password !== password) {
                return res.status(200).send({'success':'false', 'message':'Incorrect password'});
            }

            // Insert user auth logic here
            res.writeHead(200, {
                "Content-Type": "application/json"
            });
            res.write(JSON.stringify({
                'success': 'true',
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'access_token': authenticate.serializeToken(client_id, user_id, extra_data) // extra data is optional
            }));
            res.end();
            
        });
    });

    router.post('/register', function(req, res) {

        var user = to_database(req.body);

        users.insert(user, function(err) {
            if (err) {
                console.error('Cannot insert user', err);
                return res.status(500).send({'success':'false', 'message':'Cannot add this user.'});
            }

            res.status(200).send({'success':'true'});
        });
    });

    /******************************************
     * UTILS methods
     ******************************************/

    var getUser = function(req, res, name, callback) {

        users.findOne({
            $or: [
                { username: name },
                { email: name }
            ]
        }, function(err, user) {
            if (err || user === null) {
                console.error('Users.js: Cannot get user with this username or email: '+name, err);
                return res.status(500).send({'success':'false', 'message':'Cannot find user with profided details.'});
            }

            console.error('Users.js: User fetched: '+name);
            callback(from_database(user));
        });

    };

    return router;
};