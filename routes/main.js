var express = require('express');
var router = express.Router();
var qs=require('querystring');
var multiparty = require('multiparty');
var session=require('express-session');
var constArg=require('../nodepublic/const_args')
var http=require('http');
/* GET users listing. */
router.get('/', function(req, res, next) {
  if(req.session.id){
    console.log(req.session.usrid,'usrid');
  }
  res.render('main',{title:""});
 // res.send('respond with a resource');
});

module.exports = router;
