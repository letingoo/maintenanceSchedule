var express = require('express');
var router = express.Router();
var app = express();
var util=require('../nodepublic/util');
var qs=require('querystring');
var multiparty = require('multiparty');
var session=require('express-session');
var constArg=require('../nodepublic/const_args');
var http=require('http');



//登录校验,开发时屏蔽吧hhhh
router.use('/',function(req,res,next){
    if(req.session.sign||req.path=="/validate"){
        next();
    }
    else{
        res.render('index', { MsgCode:constArg.MsgCode.NORMAL });
    }
});
/* GET home page. */
router.get('/index', function(req, res, next) {
  res.render('index',{MsgCode:constArg.MsgCode.NORMAL});
});
router.get('/sysGraph', function(req, res, next) {
    res.render('GraphAnalysis/SysGraph');
});

router.get('/osnrGraph', function(req, res, next) {
    res.render('GraphAnalysis/OsnrGraph');
});

router.get('/riskOperation', function(req, res, next) {
    res.render('GraphAnalysis/RiskOperation');
});


router.get('/mdConfirm', function(req, res, next) {
    res.render('Components/modalConfirm');
});




router.get('/UserManage', function(req, res, next) {
    res.render('UserManage/UserManage');
});


router.get('/VersionManage', function(req, res, next) {
    res.render('VersionControl/VersionManage', { });
});

router.post('/fakedata', function(req, res, next) {
   console.log("fakedata");
    res.json([{linkId:"111"},{linkId:"222"}]);

});

router.get('/userInfo', function(req, res, next) {
    console.log("111");
    console.log(req.session.User);
    if(req.session.User)
          res.json( req.session.User);
    else
        res.json(undefined);
});

function newHttpRequestByPromise(url){
    return new Promise(function(resolve, reject){
        http.get(url,function(req,res){
            var recvData='';
            req.on('data',function(data){
                recvData+=data;
            });
            req.on('end',function(){
                console.log(req.statusCode);
               if(req.statusCode==200)
                 resolve(recvData);
               else
                   reject(recvData);
            });
            req.on('err',function(err){
                reject(err);
            })
        });
    })
}

//登录验证 session处理
router.post('/validate',function (req,res,next) {
    newHttpRequestByPromise(constArg.DB_addr+"users/"+encodeURIComponent(req.body.usrname)+"/"+encodeURIComponent(req.body.password))
        .then(function(data){
            req.session.User=JSON.parse(data);
            req.session.sign=1;
            req.session.deadcount=0;
        res.redirect('/main');
    })
        .catch(function(err){
            console.dir(err);
            if(req.session.deadcount!=undefined)
                req.session.deadcount++;
            else
                req.session.deadcount=1;
            console.info(req.session.deadcount);
            res.render('index',{MsgCode:constArg.MsgCode.ERR_USRPWD});
        });
});

router.get('/logout',function (req,res,next) {
    delete req.session.User;
    delete req.session.sign;
    res.redirect('/index');

});

router.post('/saveVersion',function (req,res,next) {
    console.log(req.body.version);
    req.session.version=version;
    res.status(200).end();

});



module.exports = router;
