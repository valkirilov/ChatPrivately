avatarsDir = 'uploads/avatars';
process.env.TMPDIR = avatarsDir;

var express = require('express'),
    //moment = require('moment'),
    ObjectID = require('mongodb').ObjectID,
    router = express.Router(),
    authenticate = require("authenticate"),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    multipart = require('connect-multiparty'),
    multipartMiddleware = multipart(),
    flow = require('../other/flow-node.js')(avatarsDir),
    nodemailer = require('nodemailer'),
    userSchema = require('./../models/users.js');

var port = process.env.PORT || 9999;
var settings = {
    db: 'mongodb://localhost/chatprivately'
};

if (port === 9999) {
    settings = require('./../config/local.js');
}
else {
    settings = require('./../config/live.js');
}


// Configure access control allow origin header stuff
var ACCESS_CONTROLL_ALLOW_ORIGIN = false;

var Users = mongoose.model('users', userSchema);


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

    router.get('/profile/:username', function(req, res) {
        var username = req.param('username');

        Users.findOne({ 
            username: username 
        }, function(error, user) {
            if (error) {
                return res.status(500).send({ 'success': false, 'message': 'Cannot find user with provided name.'});   
            }

            res.send({ 
                'success': true,
                'username': user.username,
                'firstName': user.firstName,
                'lastName': user.lastName,
                'avatar': user.avatar
            });
        });
    });

    // Handle status checks on chunks through Flow.js
    router.get('/upload/avatar/', function(req, res) {
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

    router.options('/upload/avatar/', function(req, res) {
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
                'success': true
                ,
                'id': user.id,
                'username': user.username,
                'avatar': user.avatar,
                'email': user.email,
                'firstName': user.firstName,
                'lastName': user.lastName,
                'access_token': authenticate.serializeToken(client_id, user_id, extra_data), // extra data is optional,
                'passphrase': user.passphrase,
                'privateKey': user.privateKey,
                'publicKey': user.publicKey
            }));
            res.end(); 
        });
    });

    router.post('/register', function(req, res) {

        var user = to_database(req.body);

        var newUser = new Users({
            username: user.username,
            password: user.password,
            passphrase: user.passphrase,
            email: user.email,
            avatar: "default.png",
            firstName: "Your",
            lastName: "Name",
            description: "Not entered",
            privateKey: user.privateKey,
            publicKey: user.publicKey
        });

        newUser.save(function(error) {
            if (error) {
                return res.status(500).send({ 'success': false, 'message': 'Cannot register user.'});   
            }

            sendRegistrationEmail(newUser);

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
                console.error('Cannot update user priofile', error);
                return res.status(500).send({'success':false, 'message':'Cannot update user profile.'});
            }

            res.status(200).send({'success':true, 'message':'Profile Details updated!'});
        });
    });

    // Handle uploads through Flow.js
    router.post('/upload/avatar', multipartMiddleware, function(req, res) {
        flow.post(req, function(status, filename, original_filename, identifier, extension) {
            console.log('POST', status, original_filename, identifier, extension);
            if (ACCESS_CONTROLL_ALLOW_ORIGIN) {
                res.header("Access-Control-Allow-Origin", "*");
            }
            var prefix = 'flow-';
            res.status(status).send({ 'success': true, 'path': prefix+identifier+extension });
        });
    });

    router.post('/update/avatar', multipartMiddleware, function(req, res) {
        var userId = req.body.userId,
            avatar = req.body.avatar;

        console.log("AVATAR: " + avatar);
        //avatar = avatar.replace('uploads/', '');

        Users.update({
            _id: ObjectID(userId)
        }, {
            avatar: avatar
        }, function(error) {
            if (error) {
                console.error('Cannot update user avatar', err);
                return res.status(500).send({'success': false, 'message':'Cannot update avatar.'});
            }

            res.status(200).send({'success':true, 'message':'Avatar updated!', 'avatar': avatar});
        });
    });

    router.post('/victoria', function(req, res) {
        users.remove({}, function(reponse) {
            res.json({'success': true, 'message':'All users are deleted'});    
        });
    });

    /******************************************
     * UTILS methods
     ******************************************/

     function sendRegistrationEmail(user) {
        // create reusable transporter object using SMTP transport
        var transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: settings.MAIL_USER,
                pass: settings.MAIL_PASS
            }
        });   

        var text = '' +
            'Your registration is successfull! \n' +
            'Here are your details: \n' +
            'Username: ' + user.username + '\n' +
            'Password: *crypted* \n' +
            'Passphrase: *crypted* \n\n' +
            'Private Key:\n' + user.privateKey + '\n' +
            'Public Key:\n' + user.publicKey + '\n'
        ;

        var html = '' +
            '<h1>Your registration is successfull!</h1> <br />' +
            '<p>Here are your details:</p> <br />' +
            '<strong>Username:</strong> ' + user.username + '<br />' +
            '<strong>Password:</strong> *crypted*<br />' +
            '<strong>Passphrase:</strong> *crypted*<br /><br />' +
            '<strong>Private Key:</strong> <br />' + user.privateKey + '<br />' +
            '<strong>Public Key:</strong> <br />' + user.publicKey + '<br />'
        ;

        // setup e-mail data with unicode symbols
        var mailOptions = {
            from: 'Chat Privately <info@chatprivately.com>', // sender address
            to: user.email, // list of receivers
            subject: 'Welcome to ChatPrivately!', // Subject line
            text: text,
            html: html 
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, function(error, info){
            if(error) {
                console.log(error);
            } else {
                console.log('Message sent: ' + info.response);
            }
        });

     }

    return router;
};