/**
 * Created by yzl on 2017/9/7.
 */
//const prefix='versions/';
'use strict';
jQuery(document).ready(function() {
    initComplexData();


    $('.btn-save').on('click',function () {
        generalUtil.saveVersion(parent.versionId,parent.modalLocator);
    })
    //按钮响应
    $(".btn-open").click(function(){
        var selectedRes=$('#versionList').bootstrapTable('getAllSelections');
        // console.log(selectedRes[0]);
        if(selectedRes.length!=1){

            alert("请只选中一个版本再进行操作");
        }
        else{
            new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+prefix+selectedRes[0].versionId)
                .then(function (data) {
                    modifyDisplayData(data);
                });

        }
    });
    $(".btn-add").click(function(){
        $("input").val("");
        $("input[name='userName']").attr("disabled",false);
        $('.btn-submit').addClass('btn-add-submit').removeClass('"btn-edit-submit');
    });
    $(".btn-delete").click(function(){
        var selectedRes=$('#versionList').bootstrapTable('getAllSelections');
        if(selectedRes.length<1){
            alert("请选中至少一条记录再进行删除");
        }
        let deleteList=new Array();
        $(selectedRes).each(function(index,data){
            deleteList.push(data.versionId);
        })
        //console.log(deleteList);
        new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+prefix,deleteList,"delete").then(function () {
            $("#versionList").bootstrapTable('refresh', {url:DEFAULT_OPTIONS.DB_Interface+prefix});
        });
    });

    $('.btn-submit').on("click",function () {
        formUtil.validateForm($('.modal-form')).then(function(){
            var x=$(".btn-submit");
            var data=$('.modal-form').serializeArray();
            var appendData={}
            appendData.versionSetting={};
            appendData.versionSetting.resourceSetting={};
            $('.resource input:checkbox').each(function() {
                if ($(this).attr('datafield')) {
                    appendData.versionSetting.resourceSetting[$(this).attr('datafield')] =$(this).is(':checked');
                }
            });


            console.log(JSON.stringify(data));
            if(x.hasClass("btn-edit-submit"))
                ajaxUtil.submitResource(DEFAULT_OPTIONS.DB_Interface+prefix,data,"post",appendData).then(function () {
                    parent.modalLocator.showSuccessMsg();
                    refreshTable();
                },function (errMsg) {
                    if(errMsg.responseText)
                        parent.modalLocator.showErrMsg(errMsg.responseText);

                });
            else if(x.hasClass("btn-add-submit")){
                ajaxUtil.submitResource(DEFAULT_OPTIONS.DB_Interface+prefix,data,"post",appendData).then(
                    function () {
                        parent.modalLocator.showSuccessMsg();
                        refreshTable();
                    },
                    function (errMsg) {
                        if(errMsg.responseText)
                            parent.modalLocator.showErrMsg(errMsg.responseText);

                    });
            }
        },function(errData){
            parent.modalLocator.showErrMsg(errData.errMsg);
        });
    });
    /**
     * 在bootstraptable无法显示复杂json对象时，请手写方法导入并将需要展示的变量放至外层
     */
    var initComplexData=function(){
        var tableList=new Array();
        tableList.push({checkbox:true});
        tableList.push({field:"bussinessName",title:"光通道名称"});
        tableList.push({field:"mainRoute",title:"主用路由"});
        tableList.push({field:"mainChannelRate",title:"主路由速率"});
        tableList.push({field:"mainChannelFrequency",title:"主路由频点"});
        tableList.push({field:"spareRoute",title:"备用路由"});
        tableList.push({field:"spareChannelRate",title:"备用路由速率"});
        tableList.push({field:"spareChannelFrequency",title:"备用路由频点"});
        new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+prefix).then(function (data) {
           $.each(data,function(index,ele){
               if(ele.mainChannel){
                   ele.mainChannelFrequency=ele.mainChannel.channelFrequency;
                   ele.mainChannelRate=ele.mainChannel.channelRate;
               }
               if(ele.spareChannel){
                   ele.spareChannelRate=ele.spareChannel.channelFrequency;
                   ele.spareChannelFrequency=ele.spareChannel.channelRate;
               }

           }) ;
        });
        var op={};
        op.data=data;
        tableUtil.createTable($('#bussinessList'),null,tableList,op);
    }

    var refreshTable=function () {
        $("#versionList").bootstrapTable('refresh', {url:DEFAULT_OPTIONS.DB_Interface+prefix});
        $('#myModal').modal('hide');
    }




});

