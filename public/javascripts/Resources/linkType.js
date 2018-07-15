/**
 * cjj
 */

'use strict';
jQuery(document).ready(function () {
    // var prefix=DEFAULT_OPTIONS.Prefix.linkTypes+'100';
    var prefix=DEFAULT_OPTIONS.Prefix.linkTypes;

    var tableList=new Array();
    tableList.push({checkbox:true});
    tableList.push({field:"linkType",title:"链路类型"});
    tableList.push({field:"linkLoss",title:"链路损耗"});
    tableList.push({field:"linkRate",title:"链路速率"});
    tableUtil.createTable($('#list_linkType'),DEFAULT_OPTIONS.DB_Interface+prefix+parent.versionId,tableList);

    $(".btn-edit").click(function(){
        var selectedRes=$('#list_linkType').bootstrapTable('getAllSelections');
        console.log(selectedRes[0]);
        if(selectedRes.length!=1){
            parent.modalLocator.showErrMsg("请选中一条记录再进行操作");
        }
        else{
            $('#modal_linkType').modal('show');
            // $("input[name='linkTypeId']").val(selectedRes[0].linkTypeId);
            // $("input[name='linkTypeId']").attr("disabled",true);
            formUtil.fillJsonToForm(".modal-form",selectedRes[0]);
            $('.btn-submit').addClass('btn-edit-submit').removeClass('btn-add-submit');
        }
    });

    $('.btn-save').on('click',function () {
        generalUtil.saveVersion(parent.versionId,parent.modalLocator);
    })
    $(".btn-add").click(function(){
        $('#modal_linkType').modal('show');
        $("input").val("");
        $('.btn-submit').addClass('btn-add-submit').removeClass('btn-edit-submit');
    });

    $(".btn-delete").click(function(){
        var selectedRes=$('#list_linkType').bootstrapTable('getAllSelections');
        if(selectedRes.length<1){
            parent.modalLocator.showErrMsg("请选中至少一条记录再进行操作");
        }
        else{

            parent.modalLocator.showConfirmMsg("删除","确定要删除记录吗",function () {
                let deleteList=new Array();
                $(selectedRes).each(function(index,data){
                    deleteList.push(data.linkTypeId);
                })
                new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+prefix+parent.versionId,deleteList,"delete")
                    .then(function () {
                        parent.modalLocator.showSuccessMsg();
                        refreshTable();
                        console.log("success3");
                    })
                    .catch(function(err){
                        parent.modalLocator.showErrMsg(err.responseText);
                        console.log("error3");
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
            if(x.hasClass("btn-edit-submit")){
                var selectedRes=$('#list_linkType').bootstrapTable('getAllSelections');
                console.log(selectedRes[0].linkTypeId);
                var appendData=getAppendData();
                ajaxUtil.submitResource(DEFAULT_OPTIONS.DB_Interface+prefix+parent.versionId+"/"+selectedRes[0].linkTypeId,data,"patch",appendData)
                    .then(function (data) {
                        parent.modalLocator.showSuccessMsg();
                        refreshTable();
                        console.log("success");
                    })
                    .catch(function(err){
                        parent.modalLocator.showErrMsg(err.responseText);
                        console.log("error");
                    })
            }

            else if(x.hasClass("btn-add-submit")){
                // var selectedRes=$('#list_linkType').bootstrapTable('getAllSelections');
                // console.log(selectedRes[0].linkTypeId);
                ajaxUtil.submitResource(DEFAULT_OPTIONS.DB_Interface+prefix+parent.versionId,data,"post")
                    .then(function (data) {
                            parent.modalLocator.showSuccessMsg();
                            refreshTable();
                        }
                    )
                    .catch(function(err){
                        parent.modalLocator.showErrMsg(err.responseText);
                    })
            }
        },function(errData){
            parent.modalLocator.showErrMsg(errData.errMsg);
        })
    });

    var refreshTable=function () {
        $("#list_linkType").bootstrapTable('refresh', {url:DEFAULT_OPTIONS.DB_Interface+prefix+parent.versionId});
        $('#modal_linkType').modal('hide');
    };

    var getAppendData=function () {
        var apd={};
        var selectedRes=$('#list_linkType').bootstrapTable('getAllSelections');
        // console.log(selectedRes[0].linkTypeId);
        apd.linkTypeId=selectedRes[0].linkTypeId;
        return apd;
    };

    });