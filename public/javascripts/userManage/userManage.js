/**
 * Created by yzl on 2017/7/10.
 */


jQuery(document).ready(function() {
    //table生成
    var tableList=[];
    tableList.push({checkbox:true});
    tableList.push({field:"userName",title:"用户名称"});
    tableList.push({field:"password",title:"用户密码"});
    tableList.push({field:"userRole",title:"用户角色"});
    // tableList.push({field:"userGroup",title:"所属单位"});
    tableUtil.createTable($('#UserList'),DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.userManage+parent.window.User.userId,tableList);
    if(parent.User.userRole!="管理员"){
        $("select[name='userRole']").attr("disabled","disabled");
        $('.btn-add,.btn-delete').hide();
    }
    //按钮响应
    $(".btn-edit").click(function(){
       var selectedRes=$('#UserList').bootstrapTable('getAllSelections');
       console.log(selectedRes);
       if(selectedRes.length!=1){
           parent.modalLocator.showErrMsg("请只选中一条记录再进行修改");
       }
        else{
           if(selectedRes[0].userId!=parent.User.userId)
               parent.modalLocator.showErrMsg("普通用户只能修改自己的数据！");

           else{

               $('.modal').modal('show');
               // $("input[name='userName']").attr("disabled",true);
               //将json数据填入表单
               formUtil.fillJsonToForm(".modal-form",selectedRes[0]);
               $('.btn-submit').addClass('btn-edit-submit').removeClass('"btn-add-submit');
           }

       }
    });
    $(".btn-add").click(function(){
        $("input").val("");
        $("input[name='userName']").attr("disabled",false);
        $('.btn-submit').addClass('btn-add-submit').removeClass('btn-edit-submit');
    });
    $(".btn-delete").click(function(){
        var selectedRes=$('#UserList').bootstrapTable('getAllSelections');
        if(selectedRes.length<1){
            parent.modalLocator.showErrMsg("请选中至少一条记录再进行删除");
        }
        else{
            parent.modalLocator.showConfirmMsg("删除","确定要删除记录吗",
                function(){
                    var  deleteList=[];
                    $(selectedRes).each(function(index,data){
                        deleteList.push(data.userId);
                    });
                    new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.userManage+parent.window.User.userId,deleteList,"delete")
                        .then(function () {
                            refreshTable();
                            parent.modalLocator.showSuccessMsg("操作成功");
                        })
                        .catch(function(err){
                            parent.modalLocator.showErrMsg(err.responseText);
                        })
                });

        }

    });

    $('.btn-submit').on("click",function () {
        formUtil.validateForm($('.modal-form')).then(function(){
            var x=$(".btn-submit");
            $("input[name='userName']").attr("disabled",false);
            var data=$('.modal-form').serializeArray();
            console.log(data);
            if(x.hasClass("btn-edit-submit"))
                ajaxUtil.submitResource(DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.userManage+parent.window.User.userId+"/"+$('#UserList').bootstrapTable('getAllSelections')[0].userId,data,"patch")
                    .then(function (data) {
                        parent.modalLocator.showSuccessMsg();
                        refreshTable();
                    })
                    .catch(function(err){
                        parent.modalLocator.showErrMsg(err.responseText);
                    });
            else if(x.hasClass("btn-add-submit")){
                ajaxUtil.submitResource(DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.userManage+parent.window.User.userId,data,"post")
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
        });

    });

    var refreshTable=function () {
        $("#UserList").bootstrapTable('refresh', {url:DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.userManage+parent.window.User.userId});
        $('#myModal').modal('hide');
    }
});



