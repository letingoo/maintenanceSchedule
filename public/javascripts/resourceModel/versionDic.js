/**
 * Created by yzl on 2017/7/12.
 */
'use strict';
const prefix=DEFAULT_OPTIONS.Prefix.versionDicts;
jQuery(document).ready(function() {
    // console.log($('.renderObj').text().test);
    //table生成
    var tableList=new Array();
    tableList.push({checkbox:true});
    tableList.push({field:"versionDictName",title:"字典名称"});
    tableList.push({field:"versionDictDescription",title:"字典描述"});
    tableList.push({field:"creatorName",title:"创建者"});
    tableList.push({field:"gmtCreate",title:"创建时间"});
    tableList.push({field:"gmtModified",title:"修改时间"});
    // tableUtil.createTable($('#list_dic'),"versions",tableList);
    tableUtil.createTable($('#list_dic'),DEFAULT_OPTIONS.DB_Interface+prefix,tableList);

    //按钮响应
    $(".btn-edit").click(function(){
        var selectedRes=$('#list_dic').bootstrapTable('getAllSelections');
        console.dir(selectedRes[0]);
        if(selectedRes.length!=1){
            parent.modalLocator.showErrMsg("请只选中一条记录再进行操作");
        }
        else{
            $('.modal').modal('show');
            //将json填入表单中
            formUtil.fillJsonToForm(".modal-form",selectedRes[0]);
            for(var key in selectedRes[0]){
                if($('input[datafield='+key+']').length>0){
                    $('input[datafield='+key+']').attr('checked',selectedRes[0][key]);
                }
            }
        }
        $('.btn-submit').removeClass('btn-add-submit').addClass('btn-edit-submit');
    });

    $(".btn-add").click(function(){
        $("input[type='text']").val("");
        $('.resource input:checkbox').attr('checked',false);
        $("input[name='userName']").attr("disabled",false);
        $('.btn-submit').addClass('btn-add-submit').removeClass('btn-edit-submit');
    });

    $(".btn-delete").click(function(){
        var selectedRes=$('#list_dic').bootstrapTable('getAllSelections');
        if(selectedRes.length<1){
            parent.modalLocator.showErrMsg("请选中至少一条记录再进行操作");
        }
        else{

            parent.modalLocator.showConfirmMsg("删除","确定要删除记录吗",function () {
                let deleteList=new Array();
                $(selectedRes).each(function(index,data){
                    deleteList.push(data.versionDictId);
                })
                new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+prefix,deleteList,"delete").then(function () {
                    parent.modalLocator.showSuccessMsg();
                    refreshTable();
                });
            });

        }
    });

    $('.btn-submit').on("click",function () {
        var x=$(".btn-submit");
        if(!$('.modal-form [name="creatorName"]').attr('value'))
            $('.modal-form [name="creatorName"]').val(parent.window.User?parent.User.userName:"root");

        formUtil.validateForm($('.modal-form')).then(function(){
            var data=$('.modal-form').serializeArray();
            var appendData={};
            $('.resource input:checkbox').each(function() {
                if ($(this).attr('datafield')) {
                    appendData[$(this).attr('datafield')] =$(this).is(':checked');
                }
            });
            if(x.hasClass("btn-edit-submit"))
                ajaxUtil.submitResource(DEFAULT_OPTIONS.DB_Interface+prefix+$('#list_dic').bootstrapTable('getAllSelections')[0].versionDictId
                    ,data,"patch",appendData).then(function () {
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
        })
    });

    var refreshTable=function () {
        $("#list_dic").bootstrapTable('refresh', {url:DEFAULT_OPTIONS.DB_Interface+prefix});
        $('#myModal').modal('hide');
    }
});





