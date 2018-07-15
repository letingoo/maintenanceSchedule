/**
 * Created by elona on 2018/7/8.
 */
var express = require('express');
var router = express.Router();
var qs=require('querystring');
var fs=require('fs');
var multiparty = require('multiparty');
var session=require('express-session');
var constArg=require('../nodepublic/const_args')
var http=require('http');
var Excel = require('exceljs');
/**
 * 导出检修结果
 */
router.post('/exportOperate', function(req, res, next) {
   // console.dir(req.body);
    var data;
    for(var i in req.body){
        data=JSON.parse(i);
    }
    var fName='./public/'+data.excelName+'.xlsx';
    var workbook = new Excel.stream.xlsx.WorkbookWriter({
        filename: fName
    });
    var affectBusiness = workbook.addWorksheet('Sheet');
    var breakBusiness = workbook.addWorksheet('Sheet1');
    for(let i in data.breakBusiness) {
        console.dir(data.breakBusiness[i]);
        breakBusiness.addRow(["中断业务名称",data.breakBusiness[i]]);
    }
    for(let i in data.affectBusiness) {
        console.dir(data.affectBusiness[i]);
        affectBusiness.addRow(["影响业务名称",data.affectBusiness[i]]);
    }
    workbook.commit().then(function () {
        remoteDelete(fName);
        res.status(200).json({downloadUrl:"/"+data.excelName+'.xlsx'});
    });

});
/**
 * 新建检修单导出
 */
router.post('/exportOperateOrder', function(req, res, next) {
    console.dir(req.body);
    var data,column=[];
    for(var i in req.body){
        data=JSON.parse(i);
    }

    var fName='./public/'+data.excelName+'.xlsx';
    var workbook = new Excel.stream.xlsx.WorkbookWriter({
        filename: fName
    });
    var sheet = workbook.addWorksheet('Sheet');
    // sheet.columns=column;
    for(let i in data){
        console.log(i);
        if(i!="excelName")
            sheet.addRow([i,data[i]]);
            // column.push({header:i,key:i})
    }
    workbook.commit().then(function () {
        remoteDelete(fName);
        res.status(200).json({downloadUrl:"/"+data.excelName+'.xlsx'});
    });

});

var remoteDelete=function (fName) {
    var clearData=setTimeout(function () {
        try {
            fs.unlinkSync(fName, function (err) {
                if (err)
                    console.log(err);
            });
        }
        catch (e) {

        }
    },1000000);

}

module.exports = router;
