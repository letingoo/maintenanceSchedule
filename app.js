var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var ejs=require('ejs');
var index = require('./routes/index');
var main = require('./routes/main');
var download=require('./routes/download');
var resource=require('./routes/resources');
var session=require('express-session');
// var redis = require("redis");
// var RedisStore = require('connect-redis')(session);
// var compression = require('compression')
var app = express();

// app.use(compression());//
//无集群版本，请部署时解注该代码
app.use(session({
    secret: 'elin', //secret的值建议使用随机字符串
    cookie: {maxAge: 60 * 1000 *30*48},// 过期时间（毫秒）
    resave: true,
    saveUninitialized:true
}));

//如果想使用带强制校验的集群版本，请使用此版本并安装redis
// app.use(session({
//     secret:'elin',
//     store:new RedisStore({host:"127.0.0.1",port:"6379"}),
//     cookie: {maxAge: 60 * 1000 * 30},// 过期时间（毫秒）
//     resave: true,
//     saveUninitialized:true
// }));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');
app.engine('.html', ejs.__express);
app.set('view engine', 'html');
// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/main', main);
app.use('/',resource);
app.use('/',download);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  // res.render('error');
});

module.exports = app;
