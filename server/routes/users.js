process.env.TMPDIR = 'tmp';

var express = require('express'),
    //moment = require('moment'),
    ObjectID = require('mongodb').ObjectID,
    router = express.Router(),
    authenticate = require("authenticate"),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    multipart = require('connect-multiparty'),
    multipartMiddleware = multipart(),
    flow = require('../other/flow-node.js')('tmp');

var userSchema = new Schema({
    username: String,
    password: String,
    email: String,
    avatar: String,
    firstName: String,
    lastName: String,
    privateKey: String,
    publicKey: String
});

userSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

// Configure access control allow origin header stuff
var ACCESS_CONTROLL_ALLOW_ORIGIN = false;


// Ensure virtual fields are serialised.
userSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret, options) {
         ret.id = ret._id;
         delete ret._id;
         delete ret.__v;
     }
});

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

    var users = database.collection('users');

    /******************************************
     * GET methods
     ******************************************/
    router.get('/', function(req, res) {

        Users.find(function (error, users) {
            if (error) {
                return res.status(500).send({ 'success': false, 'message': 'Cannot fetch users.'});
            }

            res.json(users);
        });

    });

    router.get('/:name', function(req, res) {
        var name = req.param('name');

        Users.findOne({ $or: [
            { username: name },
            { email: name}]
        }, function(error, user) {
            if (error) {
                return res.status(500).send({ 'success': false, 'message': 'Cannot find user with provided name.'});   
            }

            delete user.password;

            res.json(user);
        });
    });

    // Handle status checks on chunks through Flow.js
    router.get('/update/avatar', function(req, res) {
      flow.get(req, function(status, filename, original_filename, identifier) {
        console.log('GET', status);
        if (ACCESS_CONTROLL_ALLOW_ORIGIN) {
          res.header("Access-Control-Allow-Origin", "*");
        }

        if (status == 'found') {
          status = 200;
        } else {
          status = 404;
        }

        res.status(status).send();
      });
    });

    router.options('/update/avatar', function(req, res) {
      console.log('OPTIONS');
      if (ACCESS_CONTROLL_ALLOW_ORIGIN) {
        res.header("Access-Control-Allow-Origin", "*");
      }
      res.status(200).send();
    });

    /******************************************
     * POST methods
     ******************************************/
    router.post('/login', function(req, res) {

        var name = req.body.name,
            password = req.body.password;
        console.log('Login');
        Users.findOne({ 
            $or: [
                { username: name },
                { email: name} 
            ]
        }, function(error, user) {
            if (error) {
                return res.status(500).send({ 'success': false, 'message': 'Error in searching for user.'});   
            }

            var client_id = 'client-id-victoria',
                user_id = user.id,
                extra_data = 'extra-data-victoria';

            // Check the input password validity
            if (user.password !== password) {
                return res.status(500).send({'success': false, 'message': 'Incorrect password'});
            }

            // Insert user auth logic here
            res.writeHead(200, {
                "Content-Type": "application/json"
            });
            res.write(JSON.stringify({
                'success': 'true',
                'id': user.id,
                'username': user.username,
                'avatar': user.avatar,
                'email': user.email,
                'firstName': user.firstName,
                'lastName': user.lastName,
                'access_token': authenticate.serializeToken(client_id, user_id, extra_data), // extra data is optional,
                'privateKey': user.privateKey,
                'publicKey': user.publicKey
            }));
            console.log('Result end');
            res.end(); 
        });
    });

    router.post('/register', function(req, res) {

        var user = to_database(req.body);

        var newUser = new Users({
            username: user.username,
            password: user.password,
            email: user.email,
            avatar: "",
            firstName: "Your",
            lastName: "Name",
            privateKey: user.privateKey,
            publicKey: user.publicKey
        });

        newUser.save(function(error) {
            if (error) {
                return res.status(500).send({ 'success': false, 'message': 'Cannot register user.'});   
            }

            res.status(200).send({'success': true});
        });
    });

    router.post('/update/profile', function(req, res) {
        var user = req.body;

        Users.update({
            _id: ObjectID(user.id)
        }, {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
        }, function(error) {
            if (error) {
                console.error('Cannot update user priofile', err);
                return res.status(500).send({'success':'false', 'message':'Cannot update user profile.'});
            }

            res.status(200).send({'success':true, 'message':'Profile Details updated!'});
        });
    });

    // Handle uploads through Flow.js
    router.post('/update/avatar', multipartMiddleware, function(req, res) {
      flow.post(req, function(status, filename, original_filename, identifier) {
        console.log('POST', status, original_filename, identifier);
        if (ACCESS_CONTROLL_ALLOW_ORIGIN) {
          res.header("Access-Control-Allow-Origin", "*");
        }
        res.status(status).send();
      });
    });

    router.post('/victoria', function(req, res) {
        users.remove({}, function(reponse) {
            res.json({'success':'true', 'message':'All users are deleted'});    
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