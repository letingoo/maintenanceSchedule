/**
 * Created by txx
 */
'use strict';


const prefix=DEFAULT_OPTIONS.Prefix.amplifier+parent.versionId;
var selectInitiator=function () {
    this.initDisk=function () {
        var  DiskOptions={
            url:DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.diskType+parent.versionId,
            blank:true
        };
        return UIUtil.adaptSelectList(DiskOptions,".modal [name='diskType']")
    }
}
jQuery(document).ready(function() {
    var selectAdapter=new selectInitiator();

    // console.log($('.renderObj').text().test);
    //table生成
    var tableList=new Array();
    tableList.push({checkbox:true});
    tableList.push({field:"amplifierName",title:"放大器名称"});
    tableList.push({field:"gain",title:"增益"});
    tableList.push({field:"diskType",title:"机盘类型"});
    tableList.push({field:"maximumInputPower",title:"最大输入功率"});
    tableList.push({field:"maximumOutputPower",title:"最大输出功率"});
    tableList.push({field:"minimumInputPower",title:"最小输入功率"});
    tableUtil.createTable($('#list_amplifier'),DEFAULT_OPTIONS.DB_Interface+prefix,tableList);

    //按钮响应
    $(".btn-edit").click(function(){

        var selectedRes=$('#list_amplifier').bootstrapTable('getAllSelections');
        console.dir(selectedRes[0]);
        if(selectedRes.length!=1){
            parent.modalLocator.showErrMsg("请只选中一条记录再进行操作");
        }
        else{
            selectAdapter.initDisk().then(function () {
                $('.modal').modal('show');
                // $("input[name='amplifierId']").val(selectedRes[0].amplifierID);
                formUtil.fillJsonToForm(".modal-form",selectedRes[0]);
            });
        }
        $('.btn-submit').removeClass('btn-add-submit').addClass('btn-edit-submit');
    });

    $(".btn-add").click(function(){
        selectAdapter.initDisk();
        $("input").val("");
        $('.resource input:checkbox').attr('checked',false);
        $("input[name='userName']").attr("disabled",false);
        $('.btn-submit').addClass('btn-add-submit').removeClass('btn-edit-submit');
    });

    $(".btn-delete").click(function(){
        var selectedRes=$('#list_amplifier').bootstrapTable('getAllSelections');
        if(selectedRes.length<1){
            parent.modalLocator.showErrMsg("请选中至少一条记录再进行操作");
        }
        else{

            parent.modalLocator.showConfirmMsg("删除","确定要删除记录吗",function () {
                let deleteList=new Array();
                $(selectedRes).each(function(index,data){
                    deleteList.push(data.amplifierId);
                })
                new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+prefix,deleteList,"delete").then(function () {
                    parent.modalLocator.showSuccessMsg();
                    refreshTable();
                });
            });



        }
    });
    $('.btn-save').on('click',function () {
        generalUtil.saveVersion(parent.versionId,parent.modalLocator);
    })

    $('.btn-submit').on("click",function () {
        formUtil.validateForm($('.modal-form')).then(function(){
            var x=$(".btn-submit");
            var data=$('.modal-form').serializeArray();
            var appendData={};

            $('.resource input:checkbox').each(function() {
                if ($(this).attr('datafield')) {
                    appendData[$(this).attr('datafield')] =$(this).is(':checked');
                }
            });
            if(x.hasClass("btn-edit-submit")){
                console.info($('#list_amplifier').bootstrapTable('getAllSelections')[0]);
                ajaxUtil.submitResource(DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.amplifier+parent.versionId+"/"+
                    $('input[name="amplifierId"]').val(),
                    data,"patch",appendData).then(function () {
                    parent.modalLocator.showSuccessMsg();
                    refreshTable();
                },function (errMsg) {
                    if(errMsg.responseText)
                        parent.modalLocator.showErrMsg(errMsg.responseText);
                });}
            else if(x.hasClass("btn-add-submit")){
                ajaxUtil.submitResource(DEFAULT_OPTIONS.DB_Interface+prefix+"/",data,"post",appendData).then(
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

    var refreshTable=function () {
        $("#list_amplifier").bootstrapTable('refresh', {url:DEFAULT_OPTIONS.DB_Interface+prefix});
        $('#myModal').modal('hide');
    }
});





