/**
 * Created by cjj on 2018/3/28.
 */
'use strict';

jQuery(document).ready(function() {
    var prefix=DEFAULT_OPTIONS.Prefix.maintenanceRecords;

    //table生成
    var tableList=new Array();
    tableList.push({checkbox:true});
    // tableList.push({field:"id",title:"id"});
    tableList.push({field:"idNo",title:"检修票据编号"});
    tableList.push({field:"rContent",title:"工作内容"});
    tableList.push({field:"deptName",title:"申请单位"});
    tableList.push({field:"deptMan",title:"申请人"});
    tableList.push({field:"rPlace",title:"工作地点"});
    tableList.push({field:"rType",title:"检修类别"});
    tableList.push({field:"repairType",title:"检修单类型"});
    tableList.push({field:"deviceName",title:"设备名称"});
    tableList.push({field:"linkMan",title:"联系人"});
    tableList.push({field:"mobilePhone",title:"移动电话"});
    tableList.push({field:"linkWaymobile",title:"工作移动电话"});
    tableList.push({field:"isDone",title:"是否已过期"});
    tableUtil.createTable($('#list_MaintenanceRecord'),DEFAULT_OPTIONS.DB_Interface+prefix,tableList);


    $('.btn-save').on('click',function () {
        generalUtil.saveVersion(parent.versionId,parent.modalLocator);
    })
    //按钮响应
    $(".btn-add").click(function(){
        $('#modal_MaintenanceRecord').modal('show');
        $("input").val("");
        // $("input[name='userName']").attr("disabled",false);
        $('.btn-submit').addClass('btn-add-submit').removeClass('btn-edit-submit');
    });
    $(".btn-delete").click(function(){
        var selectedRes=$('#list_MaintenanceRecord').bootstrapTable('getAllSelections');
        if(selectedRes.length<1){
            parent.modalLocator.showErrMsg("请选中至少一条记录再进行操作");
        }
        else{
            let deleteList=new Array();
            $(selectedRes).each(function(index,data){
                deleteList.push(data.id);
            })
            new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+prefix,deleteList,"delete")
                .then(function () {
                    parent.modalLocator.showSuccessMsg();
                    refreshTable();
                })
                .catch(function(err){
                    parent.modalLocator.showErrMsg(err.responseText);
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
                ajaxUtil.submitResource(DEFAULT_OPTIONS.DB_Interface+prefix+"/"+data[0].value,data,"patch")
                    .then(function (data) {
                        parent.modalLocator.showSuccessMsg();
                        refreshTable();
                    })
                    .catch(function(err){
                        parent.modalLocator.showErrMsg(err.responseText);
                    })
            else if(x.hasClass("btn-add-submit")){
                ajaxUtil.submitResource(DEFAULT_OPTIONS.DB_Interface+prefix,data,"post")
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
        console.log("1");
        $("#list_MaintenanceRecord").bootstrapTable('refresh', {url:DEFAULT_OPTIONS.DB_Interface+prefix});
        $('#modal_MaintenanceRecord').modal('hide');
    }

});




