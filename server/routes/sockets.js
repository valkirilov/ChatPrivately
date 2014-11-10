var express = require('express'),
    router = express.Router();

module.exports = function() {

    router.get('/', function(req, res) {


            res.send('Here');

    });


    return router;
};