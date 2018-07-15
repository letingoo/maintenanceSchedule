/**
 * Created by zhangminchao on 2017/10/23.
 */




$(document).ready(function () {


    /**
     * 选择故障数目之后故障类型改变
     */
    $("#faultNumber").on('change', function () {

        var faultNum = $("#faultNumber").val();
        var faultTypeNum = $("#faultType").children("option").length;

        $("#faultType").val('请选择');

        if (faultNum == 1 && faultTypeNum == 4) {
            $("#faultType option[value=2]").remove();
        }

        else if (faultNum == 2 && faultTypeNum == 3) {

            $("#faultType").append("<option value='2'>设备 + 链路</option>");
        }

        reRead = true;
    });



    $("#faultType").on('change', function () {
        var faultNum = $("#faultNumber").val();
        var faultType = $("#faultType option:selected").val();

        var tableList = new Array();
        tableList.push({checkbox:true});
        $('#searchNXItemInput').val('');


        if (faultType == "请选择")
            return;

        reRead = true;

        if (faultType == '0')
            tableList.push({field:"netElementName", title:"设备名称"});
        else if(faultType == '1')
            tableList.push({field:"linkName", title:"复用段名称"});
        else
            tableList.push({field:"itemName", title:"设备/复用段名称"});

        $("#nxSelectModal").modal("show");
        var options = new Object();
        options.showPaginationSwitch = true;
        options.pagination = true;
        options.singleSelect = false;

        var prefix = "";
        if (faultType == 0)
            prefix = DEFAULT_OPTIONS.Prefix.netElements;
        else if (faultType == 1)
            prefix = DEFAULT_OPTIONS.Prefix.links;


        var FEN_GE = '  +  ';



        // 不是选中 设备+链路的情况
        if (faultType != 2) {


            // 数量为1的时候直接显示要分析的设备/链路

            if (faultNum == 1) {

                var tempUrl = DEFAULT_OPTIONS.DB_Interface + prefix + parent.versionId +
                    ( circleDisplay.getCircleId() == '' ? "" : "/" + circleDisplay.getCircleId() );
                tableUtil.createTable($('#nxSelectTable'), tempUrl, tableList, options);
            }



            // 数量为2的时候显示 设备/链路 之间的两两组合
            else {

                tableUtil.createTable($('#nxSelectTable'), null, tableList, options);
                $('#nxSelectTable').bootstrapTable('hideLoading');
                var tempUrl = DEFAULT_OPTIONS.DB_Interface + prefix + parent.versionId +
                    ( circleDisplay.getCircleId() == '' ? "" : "/" + circleDisplay.getCircleId() );

                $.get(tempUrl, function (itemList) {
                    var doubleList = new Array();
                    for (var i = 0; i < itemList.length; i++) {
                        for (var j = 0; j < itemList.length; j++) {
                            var item = new Object();
                            if (faultType == '0') {
                                item.netElementName = itemList[i].netElementName + FEN_GE +
                                    itemList[j].netElementName;
                                item.zuheName = itemList[i].netElementName + "~" + itemList[j].netElementName;
                            }

                            else if (faultType == '1') {
                                item.linkName = itemList[i].linkName + FEN_GE + itemList[j].linkName;
                                item.zuheName = itemList[i].linkName + "~" + itemList[j].linkName;
                            }
                            doubleList.push(item);
                        }
                    }

                    $('#nxSelectTable').bootstrapTable('load', doubleList);
                });

            }


        }


        // 选择 设备+链路 的情况
        else {
            tableUtil.createTable($('#nxSelectTable'), null, tableList, options);
            $('#nxSelectTable').bootstrapTable('hideLoading');

            $.get(DEFAULT_OPTIONS.DB_Interface + DEFAULT_OPTIONS.Prefix.netElements + parent.versionId +
                ( circleDisplay.getCircleId() == '' ? "" : "/" + circleDisplay.getCircleId() ),
                function (equip_result) {
                    var equipArray = equip_result;

                    $.get(DEFAULT_OPTIONS.DB_Interface + DEFAULT_OPTIONS.Prefix.links + parent.versionId +
                        ( circleDisplay.getCircleId() == '' ? "" : "/" + circleDisplay.getCircleId() ),
                        function (link_result) {
                            var linkArray = link_result;
                            var itemArray = new Array();

                            $(equipArray).each(function (index, equipElement) {
                               $(linkArray).each(function (index2, linkElement) {
                                   var item = new Object();
                                   item.itemName = equipElement.netElementName + FEN_GE + linkElement.linkName;
                                   item.zuheName = equipElement.netElementName + "~" + linkElement.linkName;
                                   itemArray.push(item);
                               });
                            });

                            $('#nxSelectTable').bootstrapTable('load', itemArray);
                        });

                });
        }

    });


    /**
     * 选择具体设备/链路点确定后的触发事件
     */
    $("#nxSelectAnalyseButton").click(function () {

        if (parent.versionId == undefined) {
            alert("请先选择仿真版本");
            return;
        }


        var selectedRes=$('#nxSelectTable').bootstrapTable('getAllSelections');
        if(selectedRes.length == 0){
            parent.modalLocator.showErrMsg("没有选择数据");
            return;
        }



        var analyseItemArray = new Array();
        $(selectedRes).each(function (index, item) {
            if (item.zuheName == null) {
                if (item.netElementName == null)
                    analyseItemArray.push(item.linkName);
                else
                    analyseItemArray.push(item.netElementName);
            }

            else
                analyseItemArray.push(item.zuheName);
        });



        $("#nxTableBody").html("");
        document.body.style.cursor = "wait";        // 设置鼠标忙碌状态


        var versionId = parent.versionId;
        var num = $("#faultNumber").val();
        var type = $("#faultType").val();
        var circleId = circleDisplay.getCircleId();
        var url = DEFAULT_OPTIONS.DB_Interface + DEFAULT_OPTIONS.Prefix.nxAnalyse + "/some";


        if (circleId == '')
            circleId = '全图';
        $.get(url, {versionId: versionId, type:type, circleId:circleId, elements:JSON.stringify(analyseItemArray)}, function (result) {

            nxAnalyseResult.affectBussinessArray = new Array();
            nxAnalyseResult.recoveryBussinessArray = new Array();

            var tbody = $("#nxTableBody");


            for (var i = 0; i < result.length; i++) {
                var item = result[i];

                var tr = document.createElement("tr");
                tr.setAttribute("index", i);
                tr.setAttribute("class", "nxAnalyseItem");


                var td1 = document.createElement("td");
                td1.setAttribute("class", "nxTd1")
                td1.innerHTML = item.itemName;
                //td1.style.width = "60%";
                tr.appendChild(td1);

                var td2 = document.createElement("td");
                td2.setAttribute("class", "nxTd2");
                if (item.affectBussiness == undefined )
                    td2.innerHTML = "0";
                else
                    td2.innerHTML = item.affectBussiness.length;
                tr.appendChild(td2);


                var td3 = document.createElement("td");
                td3.setAttribute("class", "nxTd3");
                if (item.recoveryBussiness == undefined )
                    td3.innerHTML = "0";
                else
                    td3.innerHTML = item.recoveryBussiness.length;
                tr.appendChild(td3);

                var td4 = document.createElement("td");
                td4.setAttribute("class", "nxTd4");
                td4.innerHTML = item.recoveryRate;
                tr.appendChild(td4);


                tbody.append(tr);

                nxAnalyseResult.affectBussinessArray.push(item.affectBussiness);
                nxAnalyseResult.recoveryBussinessArray.push(item.recoveryBussiness);

                document.body.style.cursor = "default";         // 恢复鼠标正常状态
            }




            // 给表格的行设置点击监听事件
            $(".nxAnalyseItem").click(function () {
                var title = $(this).children("td")[0].innerHTML;
                var index = $(this).attr("index");
                var affectBus = nxAnalyseResult.affectBussinessArray[index];
                var recoveryBus = nxAnalyseResult.recoveryBussinessArray[index];

                $("#nxInfoModalTitle")[0].innerHTML = title;


                var tbody = $("#nxInfoTableBody")
                tbody.html("");
                for (var i = 0; i < affectBus.length; i++) {

                    var tr = document.createElement("tr");

                    var td1 = document.createElement("td");
                    td1.innerHTML = affectBus[i];
                    tr.appendChild(td1);

                    var td2 = document.createElement("td");
                    if (i >= recoveryBus.length)
                        td2.innerHTML = "";
                    else
                        td2.innerHTML = recoveryBus[i];
                    tr.appendChild(td2);

                    tbody.append(tr);
                }


                $("#nxInfoModal").modal("show");

            });


        }).fail(function () {
            alert("请求失败");
            document.body.style.cursor = "default";         // 恢复鼠标正常状态
        });



    });



    /**
     * N-X分析中点击“分析”按钮的触发事件
     */
    $("#nxAanlyseButton").click(function () {
        nxAnalyse();
    });


    /**
     * N-X弹窗关闭按钮
     */
    $("#nxAnalyseCloseButton").click(function () {
        $("#nxModal").modal("hide");

    });


    /**
     * 显示N-X弹窗
     */
    $("#nxModalShowButton").click(function () {
        $("#nxTableBody").html("");
        $("#faultNumber").val(1);
        $("#faultType").val('请选择');
        $("#nxModal").modal("show");

        var faultTypeNum = $("#faultType").children("option").length;
        if (faultTypeNum == 4)
            $("#faultType option[value=2]").remove();

    });



    var originalItems = new Array();

    // 是否重新读入originalItems
    var reRead = false;


    /**
     * 搜索具体的设备/复用段 用于N-X分析
     */
    $("#searchNXItemInput").on('input', function () {

        if (reRead) {
            originalItems = $('#nxSelectTable').bootstrapTable('getData');
            reRead = false;
        }


        var itemSearchName = $("#searchNXItemInput").val();
        var afterSearchArray = new Array();

        $(originalItems).each(function (index, item) {

            if (item.netElementName != undefined && item.netElementName.indexOf(itemSearchName) != -1)
                afterSearchArray.push(item);

            else if (item.linkName != undefined && item.linkName.indexOf(itemSearchName) != -1)
                afterSearchArray.push(item);

            else if (item.zuheName != undefined && item.zuheName.indexOf(itemSearchName) != -1)
                afterSearchArray.push(item);
        });

        $("#nxSelectTable").bootstrapTable('load', afterSearchArray);


    });

});



/**
 * 点击“分析”按钮后的触发事件
 * 向后台请求数据
 */
function nxAnalyse() {

    if (parent.versionId == undefined) {
        alert("请先选择仿真版本");
        return;
    }

    $("#nxTableBody").html("");
    document.body.style.cursor = "wait";        // 设置鼠标忙碌状态


    var versionId = parent.versionId;
    var num = $("#faultNumber").val();
    var type = $("#faultType").val();

    var circleId = circleDisplay.getCircleId();
    if (circleId == "")
        circleId = "全图";
    var url = DEFAULT_OPTIONS.DB_Interface + DEFAULT_OPTIONS.Prefix.nxAnalyse;
    $.get(url, {versionId: versionId, type:type, num:num, circleId:circleId}, function (result) {

        nxAnalyseResult.affectBussinessArray = new Array();
        nxAnalyseResult.recoveryBussinessArray = new Array();

        var tbody = $("#nxTableBody");

        for (var i = 0; i < result.length; i++) {
            var item = result[i];

            var tr = document.createElement("tr");
            tr.setAttribute("index", i);
            tr.setAttribute("class", "nxAnalyseItem");


            var td1 = document.createElement("td");
            td1.setAttribute("class", "nxTd1")
            td1.innerHTML = item.itemName;
            //td1.style.width = "60%";
            tr.appendChild(td1);

            var td2 = document.createElement("td");
            td2.setAttribute("class", "nxTd2");
            if (item.affectBussiness == undefined )
                td2.innerHTML = "0";
            else
                td2.innerHTML = item.affectBussiness.length;
            tr.appendChild(td2);


            var td3 = document.createElement("td");
            td3.setAttribute("class", "nxTd3");
            if (item.recoveryBussiness == undefined )
                td3.innerHTML = "0";
            else
                td3.innerHTML = item.recoveryBussiness.length;
            tr.appendChild(td3);

            var td4 = document.createElement("td");
            td4.setAttribute("class", "nxTd4");
            td4.innerHTML = item.recoveryRate;
            tr.appendChild(td4);


            tbody.append(tr);

            nxAnalyseResult.affectBussinessArray.push(item.affectBussiness);
            nxAnalyseResult.recoveryBussinessArray.push(item.recoveryBussiness);

            document.body.style.cursor = "default";         // 恢复鼠标正常状态
        }


        // 给表格的行设置点击监听事件
        $(".nxAnalyseItem").click(function () {
            var title = $(this).children("td")[0].innerHTML;
            var index = $(this).attr("index");
            var affectBus = nxAnalyseResult.affectBussinessArray[index];
            var recoveryBus = nxAnalyseResult.recoveryBussinessArray[index];

            $("#nxInfoModalTitle")[0].innerHTML = title;


            var tbody = $("#nxInfoTableBody")
            tbody.html("");
            for (var i = 0; i < affectBus.length; i++) {

                var tr = document.createElement("tr");

                var td1 = document.createElement("td");
                td1.innerHTML = affectBus[i];
                tr.appendChild(td1);

                var td2 = document.createElement("td");
                if (i >= recoveryBus.length)
                    td2.innerHTML = "";
                else
                    td2.innerHTML = recoveryBus[i];
                tr.appendChild(td2);

                tbody.append(tr);
            }


            $("#nxInfoModal").modal("show");

        });


    }).fail(function () {
        alert("请求失败");
        document.body.style.cursor = "default";         // 恢复鼠标正常状态
    });
}


/**
 * 存储故障的影响业务和可恢复业务
 */
function nxAnalyseResult(){

    this.affectBussinessArray = new Array();
    this.recoveryBussinessArray = new Array();


}


