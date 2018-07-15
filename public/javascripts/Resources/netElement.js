/**
 * Created by yzl on 2017/9/21.
 */
'use strict';

jQuery(document).ready(function() {
    var prefix=DEFAULT_OPTIONS.Prefix.netElements;

    //table生成
    var tableList=new Array();
    tableList.push({checkbox:true});
    tableList.push({field:"netElementName",title:"网元名称"});
    tableList.push({field:"netElementType",title:"网元类型"});
    tableList.push({field:"circleId",title:"所属环路"});
    tableList.push({field:"coordinateX",title:"X坐标"});
    tableList.push({field:"coordinateY",title:"Y坐标"});
    tableUtil.createTable($('#list_netElement'),DEFAULT_OPTIONS.DB_Interface+prefix+parent.versionId,tableList);


    $('.btn-save').on('click',function () {
        generalUtil.saveVersion(parent.versionId,parent.modalLocator);
    })
    //按钮响应
    $(".btn-edit").click(function(){
        var selectedRes=$('#list_netElement').bootstrapTable('getAllSelections');
        console.dir(selectedRes);
        if(selectedRes.length!=1){
            parent.modalLocator.showErrMsg("请选中一条记录再进行操作");
        }
        else{
                // $("input[name='netElementId']").val(selectedRes[0].netElementId);
            formUtil.fillJsonToForm(".modal-form",selectedRes[0]);
            $('.btn-submit').addClass('btn-edit-submit').removeClass('"btn-add-submit');
            $('#modal_netElement').modal('show');

        }
    });
    $(".btn-add").click(function(){
            $("input").val("");
            // $("input[name='userName']").attr("disabled",false);
            $('.btn-submit').addClass('btn-add-submit').removeClass('btn-edit-submit');
    });
    $(".btn-delete").click(function(){
        var selectedRes=$('#list_netElement').bootstrapTable('getAllSelections');
        if(selectedRes.length<1){
            parent.modalLocator.showErrMsg("请选中至少一条记录再进行操作");
        }
        else{

            parent.modalLocator.showConfirmMsg("删除","确定要删除记录吗",function () {
                let deleteList=new Array();
                $(selectedRes).each(function(index,data){
                    deleteList.push(data.netElementId);
                })
                new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+prefix+parent.versionId,deleteList,"delete")
                    .then(function () {
                        parent.modalLocator.showSuccessMsg();
                        refreshTable();
                    })
                    .catch(function(err){
                        parent.modalLocator.showErrMsg(err.responseText);
                    });
            });



        }
    });

    $('.btn-submit').on("click",function () {
        formUtil.validateForm($('.modal-form')).then(function(){
            var x=$(".btn-submit");
            // $("input[name='userName']").attr("disabled",false);
            var data=$('.modal-form').serializeArray();
            console.log(data);
            if(x.hasClass("btn-edit-submit"))
                ajaxUtil.submitResource(DEFAULT_OPTIONS.DB_Interface+prefix+parent.versionId+"/"+data[0].value,data,"patch")
                    .then(function (data) {
                        parent.modalLocator.showSuccessMsg();
                        refreshTable();
                    })
                    .catch(function(err){
                        parent.modalLocator.showErrMsg(err.responseText);
                    })
            else if(x.hasClass("btn-add-submit")){
                ajaxUtil.submitResource(DEFAULT_OPTIONS.DB_Interface+prefix+parent.versionId,data,"post")
                    .then(function (data) {
                        parent.modalLocator.showSuccessMsg();
                        refreshTable();
                    })
                    .catch(function(err){
                        parent.modalLocator.showErrMsg(err.responseText);
                    })
            }
        },function(errData){
            parent.modalLocator.showErrMsg(errData.errMsg);
        })

    });

    var refreshTable=function () {
        $("#list_netElement").bootstrapTable('refresh', {url:DEFAULT_OPTIONS.DB_Interface+prefix+parent.versionId});
        $('#modal_netElement').modal('hide');
    }

});




