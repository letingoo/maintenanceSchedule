/**
 * Created by yzl on 2017/7/10.
 */

'use strict';

jQuery(document).ready(function() {
    var prefix=DEFAULT_OPTIONS.Prefix.links;
    var AequipList= $("#AendList");
    var ZequipList= $("#ZendList");
    //table生成
    var tableList=new Array();
    tableList.push({checkbox:true});
    tableList.push({field:"linkName",title:"链路名称"});
    tableList.push({field:"linkType",title:"链路类型"});
    tableList.push({field:"endAName",title:"A端设备"});
    tableList.push({field:"endZName",title:"Z端设备"});
    tableList.push({field:"linkLength",title:"链路长度"});
    tableList.push({field:"linkLoss",title:"链路损耗"});
    tableList.push({field:"circleId",title:"所属环"})
    tableUtil.createTable($('#list_link'),DEFAULT_OPTIONS.DB_Interface+prefix+parent.versionId,tableList);


    $('.btn-save').on('click',function () {
        generalUtil.saveVersion(parent.versionId,parent.modalLocator);
    })
    //按钮响应
    $(".btn-edit").click(function(){
        var selectedRes=$('#list_link').bootstrapTable('getAllSelections');
       if(selectedRes.length!=1){
           parent.modalLocator.showErrMsg("请选中一条记录再进行操作");
       }
        else{
           $('#modal_link').modal('toggle');
           $("#circleDiv").show();
           $("#CircleList").val(selectedRes[0].circleId);
           getEquipList(function (data) {
               AequipList[0].options.length=0;
               ZequipList[0].options.length=0;
               $.each(data,function(index,ele){
                   AequipList[0].options.add(new Option(ele.netElementName,ele.netElementId));
                   AequipList[0].options[index].setAttribute("circleId", ele.circleId);
                   ZequipList[0].options.add(new Option(ele.netElementName,ele.netElementId));
                   ZequipList[0].options[index].setAttribute("circleId", ele.circleId);
               });
               // $("input[name='linkId']").val(selectedRes[0].linkId);
               formUtil.fillJsonToForm(".modal-form",selectedRes[0]);
               AequipList.val(selectedRes[0].endAId);
               ZequipList.val(selectedRes[0].endZId);
               $('.btn-submit').addClass('btn-edit-submit').removeClass('"btn-add-submit');

               //$("#AendList").attr("disabled", "disabled");
               //$("#ZendList").attr("disabled", "disabled");
               //$("#CircleList").attr("disabled", "disabled");
           });

           $("#linkTypeSelect")[0].value()
           // 获取链路类型
           getLinkType(function (data) {
               var linkTypeSelect = $("select#linkTypeSelect");
               linkTypeSelect[0].options.length = 0;
               $.each(data, function (index, element) {
                   linkTypeSelect[0].options.add(new Option(element.linkType, element.linkType));
               });
           });
       }
    });
    $(".btn-add").click(function(){
        $("#circleDiv").hide();
        getEquipList(function (data) {
            AequipList[0].options.length=0;
            ZequipList[0].options.length=0;
            $.each(data,function(index,ele){
                AequipList[0].options.add(new Option(ele.netElementName,ele.netElementId));
                AequipList[0].options[index].setAttribute("circleId", ele.circleId);
                ZequipList[0].options.add(new Option(ele.netElementName,ele.netElementId));
                ZequipList[0].options[index].setAttribute("circleId", ele.circleId)
            });
            $("input").val("");
            // $("input[name='userName']").attr("disabled",false);
            $('.btn-submit').addClass('btn-add-submit').removeClass('btn-edit-submit');

            $("#AendList").removeAttr("disabled");
            $("#ZendList").removeAttr("disabled");
            $("#CircleList").removeAttr("disabled");
        });

        // 获取链路类型
        getLinkType(function (data) {
            var linkTypeSelect = $("select#linkTypeSelect");
            linkTypeSelect[0].options.length = 0;
            $.each(data, function (index, element) {
               linkTypeSelect[0].options.add(new Option(element.linkType, element.linkId));
            });
        });



    });
    $(".btn-delete").click(function(){
        var selectedRes=$('#list_link').bootstrapTable('getAllSelections');
        if(selectedRes.length<1){
            parent.modalLocator.showErrMsg("请选中至少一条记录再进行操作");
        }
        else{

            parent.modalLocator.showConfirmMsg("删除","确定要删除记录吗",function () {
                let deleteList=new Array();
                $(selectedRes).each(function(index,data){
                    deleteList.push(data.linkId);
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

        // 先检查两端设备是否位于同一个环上

        var indexA = document.getElementById("AendList").selectedIndex;
        var indexZ = document.getElementById("ZendList").selectedIndex;
        if (AequipList[0].options[indexA].getAttribute("circleId") !=
            ZequipList[0].options[indexZ].getAttribute("circleId") ) {
            parent.modalLocator.showErrMsg("两端站点不在同一环！");
            return;
        }


        if (!$("#circleDiv").is(':visible'))
            $("#CircleList").val( AequipList[0].options[indexA].getAttribute("circleId") );

        else {
            // 再检查所选的环是否正确
            var circleName = $("#CircleList").find("option:selected").text();
            if (AequipList[0].options[indexA].getAttribute("circleId") != circleName) {
                parent.modalLocator.showErrMsg("所属环选择错误！");
                return;
            }
        }


        formUtil.validateForm($('.modal-form')).then(function(){
            var x=$(".btn-submit");
            // $("input[name='userName']").attr("disabled",false);
            var data=$('.modal-form').serializeArray();
            console.log(data);
            var appendData=getAppendData();
            if(x.hasClass("btn-edit-submit"))
                ajaxUtil.submitResource(DEFAULT_OPTIONS.DB_Interface+prefix+parent.versionId+"/"+data[0].value,data,"patch",appendData)
                    .then(function (data) {
                        parent.modalLocator.showSuccessMsg();
                        refreshTable();
                    })
                    .catch(function(err){

                        parent.modalLocator.showErrMsg(err.responseText);
                    })
            else if(x.hasClass("btn-add-submit")){
                ajaxUtil.submitResource(DEFAULT_OPTIONS.DB_Interface+prefix+parent.versionId,data,"post",appendData)
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
        $("#list_link").bootstrapTable('refresh', {url:DEFAULT_OPTIONS.DB_Interface+prefix+parent.versionId});
        $('#modal_link').modal('hide');
    }

    var getEquipList=function(callback){
            return new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+"netElements/"+parent.versionId).then(
                function (data) {
                    if(callback)
                        callback(data);
            },function (errmsg) {

            });
    }

    var getLinkType = function (callback) {
        return new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface + DEFAULT_OPTIONS.Prefix.linkTypes + parent.versionId).then(
            function (data) {
                if (callback)
                    callback(data);
            }, function (errmsg) {

            }
        );
    }


    var getAppendData=function () {
        var apd={};
       apd.endAName= AequipList.find("option:selected").text();
       apd.endAId=AequipList.val();
        apd.endZName= ZequipList.find("option:selected").text();
        apd.endZId=ZequipList.val();
        apd.circleId = $("#CircleList").find("option:selected").val();
        apd.linkType = $("#linkTypeSelect").find("option:selected").val();
        apd.linkLoss = $("#linkLossInput").val();
        return apd;
    }



});



