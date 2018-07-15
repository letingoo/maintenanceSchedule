/**
 * Created by yzl on 2017/7/12.
 */
'use strict';
const prefix='versions/';
var getDictList=function () {
    new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.versionDicts)
        .then(
            function (data) {
                $.each(data,function (index,ele) {
                    $("[name='versionDictName']")[0].options.add(new Option(ele.versionDictName,ele.versionDictName));
                });
            },
            function (errMsg) {
                if(errMsg.responseText)
                    parent.modalLocator.showErrMsg(errMsg.responseText);

            });
};
jQuery(document).ready(function() {
    //table生成
    var tableList=[];
    tableList.push({checkbox:true});
    tableList.push({field:"versionName",title:"版本名称"});
    tableList.push({field:"versionDescription",title:"版本描述"});
    tableList.push({field:"versionDictName",title:"版本字典"});
    tableList.push({field:"creatorName",title:"创建者"});
    tableList.push({field:"gmtCreate",title:"创建时间"});
    tableList.push({field:"gmtModified",title:"修改时间"});
    tableUtil.createTable($('#versionList'),DEFAULT_OPTIONS.DB_Interface+prefix,tableList);
    //获取字典列表
    getDictList();

    //按钮响应
    $(".btn-open").click(function(){
        var selectedRes=$('#versionList').bootstrapTable('getAllSelections');
        if(selectedRes.length!=1){
            parent.modalLocator.showErrMsg("请只选中一个版本再进行操作");
        }
        else{
            new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+prefix+selectedRes[0].versionId)
                .then(function (data) {
                    console.dir(data);
                    parent.versionId=selectedRes[0].versionId;
                    $("#resource_contents li a",window.parent.document).show();
                    modifyDisplayData(data);
                });
        }
    });

    $(".btn-add").click(function(){
        $("input[type='text']").val("");
        $('.btn-submit').addClass('btn-add-submit').removeClass('"btn-edit-submit');
    });
    $(".btn-delete").click(function(){
        var selectedRes=$('#versionList').bootstrapTable('getAllSelections');
        if(selectedRes.length<1){
            parent.modalLocator.showErrMsg("请选中至少一条记录再进行删除");
        }
        else{
            parent.modalLocator.showConfirmMsg("删除","确定要删除记录吗",function () {
                var deleteList=[];
                $(selectedRes).each(function(index,data){
                    deleteList.push(data.versionId);
                });
                new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+prefix,deleteList,"delete").then(
                    function () {
                        parent.modalLocator.showSuccessMsg();
                        refreshTable();
                    },
                    function (errMsg) {
                        if(errMsg.responseText)
                            parent.modalLocator.showErrMsg(errMsg.responseText);

                    });
            });
        }

    });

    $('.btn-submit').on("click",function () {
        $('.modal-form [name="creatorName"]').val(parent.window.User?parent.User.userName:"root");
        formUtil.validateForm($('.modal-form')).then(function () {

            var x=$(".btn-submit");
            var data=$('.modal-form').serializeArray();
            if(x.hasClass("btn-edit-submit"))
                ajaxUtil.submitResource(DEFAULT_OPTIONS.DB_Interface+prefix,data,"post").then(function () {
                    parent.modalLocator.showSuccessMsg();
                    refreshTable();

                },function (errMsg) {
                    if(errMsg.responseText)
                        parent.modalLocator.showErrMsg(errMsg.responseText);
                });
            else if(x.hasClass("btn-add-submit")){
                ajaxUtil.submitResource(DEFAULT_OPTIONS.DB_Interface+prefix,data,"post").then(
                    function (data) {
                        refreshTable();
                        parent.modalLocator.showConfirmMsg("下一步","新建版本成功，是否进行资源同步",
                            function(){
                                var bar=parent.modalLocator.initProgressBar();
                                bar.showProgressBar();
                                new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.version+"synchronize/"+data.versionId).then(function () {
                                        new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.version+"save/"+data.versionId,undefined,"patch")
                                            .then(function () {
                                                bar.finish(function () {
                                                    parent.modalLocator.showSuccessMsg("同步成功");
                                                })
                                            })
                                    },
                                    function (reject) {
                                        bar.intercept(function () {
                                            parent.modalLocator.showErrMsg("数据同步失败，请检查网络状态及版本字典是否合理");
                                        });
                                        console.dir(bar);
                                    })
                                    .catch(function (e) {
                                        parent.modalLocator.showErrMsg(e.responseText);
                                    });
                            })
                    },
                    function (errMsg) {
                        if(errMsg.responseText)
                            parent.modalLocator.showErrMsg(errMsg.responseText);
                    });
            }
        },function (errData) {
            parent.modalLocator.showErrMsg(errData.errMsg);
        })

    });



    var refreshTable=function () {
        $("#versionList").bootstrapTable('refresh', {url:DEFAULT_OPTIONS.DB_Interface+prefix});
        $('#myModal').modal('hide');
    };

    

    var modifyDisplayData =function(data) {
        if(data.versionName!="基础版本")
            $("[page='sync']",window.parent.document).hide();
        else
            $("[page='sync']",window.parent.document).show();
        console.log($("[page='sysGraph']",window.parent.document).text());
        var next={
            frameContainer:$("#content_wrapper",window.parent.document),
            tabTitle:'网络层决策分析',
            tabUrl:'sysGraph',
        };
        parent.tabNavigator.closeAll(next);
        // //请务必放在末尾执行，该操作删除所有tab，包括该tab
    }



});



