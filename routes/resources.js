/**
 * Created by yzl on 2017/9/1.
 */
var express = require('express');
var router = express.Router();
var session=require('express-session');
/* GET users listing. */
//资源管理及资源模型管理
router.get('/link', function(req, res, next) {
    res.render('Resources/Link', { });
});
router.get('/bussiness', function(req, res, next) {
    res.render('Resources/Bussiness',{});
});

router.get('/amplifier', function(req, res, next) {
    res.render('Resources/Amplifier');
});

router.get('/linkType', function(req, res, next) {
    res.render('Resources/LinkType');
});

router.get('/maintenanceRecord', function(req, res, next) {
    res.render('Resources/MaintenanceRecord');
});

router.get('/netElement', function(req, res, next) {
    res.render('Resources/NetElement');
});

router.get('/versionDic',function (req,res,next) {
    var resObj={};
    resObj.versionId=req.session.version?req.session.version:"unknown";

    res.render('ResourceModel/VersionDic',{resObj});
})

router.get('/disk',function (req,res,next) {
    console.dir(req.query.elementId);
    res.render('PanelGraph/DevicePanel',{elementId:req.query.elementId||""});
})

module.exports = router;

