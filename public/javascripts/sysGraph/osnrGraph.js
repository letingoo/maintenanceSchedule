/**
 * Created by yzl on 2017/9/28.
 * 此文件>500行时，应进行分割或webpack打包模块化
 */
jQuery(document).ready(function() {
    "use strict";
    UIUtil.setAllModalDraggable($(document));
    // initTree();
    init()();

});


var box = new twaver.ElementBox();
var network = new twaver.vector.Network(box);
var networkPane;
var circleDisplay=new circleDisplayer($('.func-panel .nav'),box);



var init= function () {
    /**
     * 用于存储选择光通道的节点和设备
     * @type {Array}
     */
    var nodeList=[];
    var linkList=[];
    /**
     * 用于存储网元详细信息
     * @type {Array}
     */
    var busNodeSpecData=[];


    var bussinessRoute = new BussinessRoute();      //bussinessRoute对象

    var analyseUtil=AnalysePanel.createNew();
    var BottomPanel={
        PanelMethod:$('#osnr_spec_method')[0],
        PanelBus:$('#osnr_spec_bus')[0],
        PanelAdjust:$('#bus_adjust_stragedy')[0]
    };
    var TabSetting={};
    //多个模框之间数据交换buf
    var interFormData={
        dataFromBusGenerate:{},
        dataFromBusSpec:{}
    };

    $('button,ul li').on('click',function () {
        $.flashUtil().clearNetwork(network);
    });
    $('#modal_osnr_spec button,#modal_element_spec_equip button,#modal_element_spec_link button,#osnr_spec_method li').off('click');

    /**
     * 添加选项，添加模框内表单响应逻辑,添加按钮逻辑
     */
    var initModal=function () {
        $("#modal_link input,#modal_node input").attr("disabled","true");

        $("#modal_bus_generate select[name='bussinessRate']")[0].options.add(new Option("2.5G","2.5G"));
        $("#modal_bus_generate select[name='bussinessRate']")[0].options.add(new Option("10G","10G"));
        $("#modal_bus_generate .btn-submit").click(function () {
            formUtil.validateForm('#form_bus_generate').then(function(){
                //向公共空间中添加表单数据
                parent.modalLocator.showInfoMsg("请选择生成策略");
                interFormData.dataFromBusGenerate.formData=formUtil.SerializeArrayToJson($("#form_bus_generate").serializeArray());
                $(BottomPanel.PanelMethod).find("table").bootstrapTable("removeAll");
                setBottomPane(networkPane,BottomPanel.PanelMethod);
            },function(errData){
                parent.modalLocator.showErrMsg(errData.errMsg);
            })

        });
            $('#btn-delete-submit').on('click',function () {
                var selectedRes=$('#bussinessList').bootstrapTable('getAllSelections');
                if(selectedRes.length<1){
                    parent.modalLocator.showErrMsg("请选中至少一条记录再进行删除");
                }
                var deleteList=new Array();
                $(selectedRes).each(function(index,data){
                    deleteList.push(data.bussinessId);
                });
                console.log(deleteList);
                new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.bussiness+parent.versionId,deleteList,"delete")
                    .then(function () {
                        return  initComplexData();
                    })
                    .then(function () {
                        $('.fixed-table-loading').hide();
                        parent.modalLocator.showSuccessMsg();
                    })
            });

        /**
         * 新增光通道提交响应
            */
            $('#osnr_spec_method .data-submit').click(function () {
                createBus(joinBusData($('#osnr_method_list'))).then(
                    function () {
                        parent.modalLocator.showSuccessMsg();
                        setBottomPane(networkPane);
                    },
                    function (errMsg) {
                        if(errMsg.responseText)
                            parent.modalLocator.showErrMsg(errMsg.responseText);

                    });

        });
        $('#osnr_spec_method .data-dismiss').click(function () {
            setBottomPane(networkPane);
        });
    };
    /**
     * 将底栏表格主备路由拼接成可发送的光通道json对象
     * @param TableElement
     */
    var joinBusData=function (TableElement) {
        var BusJsonPack={};
        var DataList=$(TableElement).bootstrapTable('getData');
        BusJsonPack.bussinessName=DataList[0].bussinessName;
        BusJsonPack.bussinessRate=DataList[0].bussinessRate;
        BusJsonPack.mainRoute=DataList[0].routeString;

        if (DataList.length < 2)
            BusJsonPack.spareRoute = null;
        else
            BusJsonPack.spareRoute=DataList[1].routeString!=""?DataList[1].routeString:null;

        BusJsonPack.spareFrequency=BusJsonPack.mainFrequency=DataList[0].channelFrequency;
        BusJsonPack.inputPower=interFormData.dataFromBusGenerate.formData.inputPower;
        BusJsonPack.circleId=interFormData.dataFromBusGenerate.formData.circleId;
        return BusJsonPack;
    };

    var createBus=function (BusData) {
        return new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.bussiness+parent.versionId,BusData,"post");
    };


    var fillRoute=function(routeArr){
        var route="";
        $.each(routeArr,function (index,element) {
            route+=index<routeArr.length-1?element+"-":element;
        });
        return route;
    };
    /**
     * 拼接策略选择表单数据
     * @param complexPathobj
     * @param displayRoutePos
     * @param displayValPos
     * @returns {Array}
     */
    var fillTableData=function (complexPathobj,displayRoutePos,displayValPos) {
        var dataList=[];
        var tableData=[];
        //别问我为什么不写一行，傻逼ie就是这么菜
        var objForIe={};
        objForIe[displayRoutePos]=fillRoute(complexPathobj.getMainRoute().getNodeArray());
        objForIe[displayValPos]=complexPathobj.getMainRoute().getPathValue();
        dataList.push(objForIe);
        objForIe={};
        objForIe[displayRoutePos]=fillRoute(complexPathobj.getBackupRoute().getNodeArray());
        objForIe[displayValPos]=complexPathobj.getBackupRoute().getPathValue();
        dataList.push(objForIe);
        tableData.push($.extend(true,{},interFormData.dataFromBusGenerate.formData,dataList[0],{"isMain":"主用"}));
        tableData.push($.extend(true,{},interFormData.dataFromBusGenerate.formData,dataList[1],{"isMain":"备用"}));
        return tableData;
    };

    /**
     * 检查策略生成的数据并筛选返回显示数据
     * @param displayData
     */
    var checkBusData=function (displayData) {
        var forceResolve=function (result) {
            return Promise.resolve(result);
        };
        var self=this;

        var checkRequest=[];
        $.each(displayData,function (index,element) {
            // if(element.routeString=="")
            //     element.routeString=null;
            checkRequest.push(
                new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.osnr+
                    "OSNRLegalCheck/"+parent.versionId,element,"post",{forceResolve:true}));
        });
        return  Promise.all(checkRequest);

    };

    /**
     * 策略选择点击响应
     */
    $('#osnr_spec_method .dropdown-menu li').click(function () {
        $.flashUtil().clearNetwork(network);
        var pathFinder = new FindPath(network);
        var DisplayData={};
       switch($(this).text()){
           case "最小跳数":{
               var displayData;
               $("#osnr_method_list").bootstrapTable("hideColumn","4")
                   .bootstrapTable("hideColumn","5")
                   .bootstrapTable("hideColumn","6")
                   .bootstrapTable("showColumn","4");
               displayData=fillTableData(pathFinder.minHoop(interFormData.dataFromBusGenerate.nodeList[0],interFormData.dataFromBusGenerate.nodeList[1]),
                   "routeString","4");

               break;
           }

           case "最短路径":{
               $("#osnr_method_list").bootstrapTable('hideColumn','4')
                   .bootstrapTable("hideColumn","5")
                   .bootstrapTable("hideColumn","6")
                   .bootstrapTable("showColumn","5");
               displayData=fillTableData(pathFinder.minDistance(interFormData.dataFromBusGenerate.nodeList[0],interFormData.dataFromBusGenerate.nodeList[1]),
                   "routeString","5");

               // 把 距离 保留两位小数
               var distance1 = parseFloat(displayData[0]['5']);
               var distance2 = parseFloat(displayData[1]['5']);

               distance1 = distance1.toFixed(2);
               distance2 = distance2.toFixed(2);

               displayData[0]['5'] = distance1;
               displayData[1]['5'] = distance2;

               break;
           }

           case "负载均衡":{
               $("#osnr_method_list").bootstrapTable('hideColumn','4')
                   .bootstrapTable("hideColumn","5")
                   .bootstrapTable("hideColumn","6")
                   .bootstrapTable("showColumn","6");
               displayData=fillTableData(pathFinder.loadBalance(interFormData.dataFromBusGenerate.nodeList[0],interFormData.dataFromBusGenerate.nodeList[1], bussinessRoute),
                   "routeString","6");

               // 计算频点占用率
               displayData[0]['6'] = calculateTHZOccupancy(displayData[0].routeString);
               displayData[1]['6'] = calculateTHZOccupancy(displayData[1].routeString);

               break;
           }


       }
        console.dir(displayData);
        if(displayData[0].routeString=="")
            parent.modalLocator.showErrMsg("两站点不可达");
        else {
            checkBusData(displayData).then(function (resultList) {
                $.each(resultList, function (index, msg) {
                   // console.log(typeof msg);
                    if(msg != ""&&typeof msg!="object"){
                        parent.modalLocator.showErrMsg((index==0?"主用路由：":"备用路由：")+msg);
                        if(index==0)
                            displayData.splice(index);
                        else
                            displayData.splice(index,1);
                        //displayData[index].routeString="";
                    }
                });
                 $.each(displayData,function (index,row) {
                     var color;
                     if(row.isMain=="主用")
                         color="#7FFFAA";
                     else
                         color="#00FFFF";
                     markRoute(row.routeString,color);
                 });
                 $("#osnr_method_list").bootstrapTable("load",displayData);
            });
        }

    });


    /**
     * 调整光通道时选择策略响应
     */
    $('#bus_adjust_stragedy .dropdown-menu li').click(function () {
        $.flashUtil().clearNetwork(network);

        var pathFinder = new FindPath(network);
        var displayData;
        switch($(this).text()){
            case "最小跳数":{
                $("#adjust_method_list").bootstrapTable("hideColumn","4")
                    .bootstrapTable("hideColumn","5")
                    .bootstrapTable("hideColumn","6")
                    .bootstrapTable("showColumn","4");
                displayData=fillTableData(pathFinder.minHoop(adjustStartNode, adjustEndNode),
                    "routeString","4");

                break;
            }

            case "最短路径":{
                $("#adjust_method_list").bootstrapTable('hideColumn','4')
                    .bootstrapTable("hideColumn","5")
                    .bootstrapTable("hideColumn","6")
                    .bootstrapTable("showColumn","5");
                displayData=fillTableData(pathFinder.minDistance(adjustStartNode, adjustEndNode),
                    "routeString","5");

                // 把 距离 保留两位小数
                var distance1 = parseFloat(displayData[0]['5']);
                var distance2 = parseFloat(displayData[1]['5']);

                distance1 = distance1.toFixed(2);
                distance2 = distance2.toFixed(2);

                displayData[0]['5'] = distance1;
                displayData[1]['5'] = distance2;
                break;
            }


            case "负载均衡":{
                $("#adjust_method_list").bootstrapTable('hideColumn', '4')
                    .bootstrapTable("hideColumn", "5")
                    .bootstrapTable("hideColumn", "6")
                    .bootstrapTable("showColumn", "6");

                displayData = fillTableData(pathFinder.loadBalance(adjustStartNode, adjustEndNode, bussinessRoute),
                    "routeString", "6");

                // 计算频点占用率
                displayData[0]['6'] = calculateTHZOccupancy(displayData[0].routeString);
                displayData[1]['6'] = calculateTHZOccupancy(displayData[1].routeString);


                break;
            }

        }

        if(displayData[0].routeString=="")
            parent.modalLocator.showErrMsg("两站点不可达");
        else {
            displayData[0].inputPower = adjustInputPower;
            displayData[1].inputPower = adjustInputPower;
            displayData[0].bussinessName = adjustBusName;
            displayData[1].bussinessName = adjustBusName;
            displayData[0].channelFrequency = adjustMainFrequency;
            displayData[1].channelFrequency = adjustBackFrequency;
            adjustMainRoute = displayData[0].routeString;
            adjustBackRoute = displayData[1].routeString;
            var firstDelete = false;
            var ErrorMsg=[];
            checkBusData(displayData).then(function (resultList) {
                $.each(resultList, function (index, msg) {
                    ErrorMsg.push(msg);
                    console.log(index + "," + msg);
                    if (msg != "" && typeof msg != 'object') {
                        if (index == 0) {
                            displayData.splice(index, 1);
                            displayData[0].isMain = "主用";
                            firstDelete = true;
                        }
                        else {
                            var deleteIndex = 1;
                            if (firstDelete)
                                deleteIndex = 0;
                            displayData.splice(deleteIndex, 1);
                        }
                    }
                });

                if (displayData.length == 1 && displayData[0].routeString == '')
                    displayData.splice(0, 1);

                else if (displayData.length == 2 && displayData[1].routeString == '')
                    displayData.splice(1, 1);

                if (displayData.length == 0) {
                    adjustMainRoute = null;
                    adjustBackRoute = null;
                }

                else if (displayData.length == 1) {
                    adjustMainRoute = displayData[0].routeString;
                    adjustBackRoute = null;
                }

                $.each(displayData, function (index,row) {
                    var color;
                    if(row.isMain=="主用")
                        color="#7FFFAA";
                    else
                        color="#00FFFF";
                    markRoute(row.routeString, color);
                });
                $("#adjust_method_list").bootstrapTable("load", displayData);
                if (adjustMainRoute == null) {
                    $.each(ErrorMsg,function (index,msg) {
                        if(typeof msg == 'string')
                             parent.modalLocator.showErrMsg(msg);
                    })
                }


            });
        }

    });


    /**
     * 光通道调整的 确定 按钮触发事件
     */
    $("#bus_adjust_stragedy .data-submit").click(function () {

        if (adjustMainRoute == null)
            return;

        var url = DEFAULT_OPTIONS.DB_Interface + DEFAULT_OPTIONS.Prefix.bussiness + parent.versionId + "/" + adjustBusId;

        var updateBusData;
        if (adjustBackRoute == null) {
            updateBusData = {
                bussinessName: adjustBussiness.bussinessName,
                bussinessRate: adjustBussiness.bussinessRate,
                inputPower: adjustBussiness.inputPower,
                mainFrequency: adjustBussiness.mainFrequency,
                spareFrequency: adjustBussiness.spareFrequency,
                mainRoute: adjustMainRoute
            };
        }

        else {
            updateBusData = {
                bussinessName: adjustBussiness.bussinessName,
                bussinessRate: adjustBussiness.bussinessRate,
                inputPower: adjustBussiness.inputPower,
                mainFrequency: adjustBussiness.mainFrequency,
                spareFrequency: adjustBussiness.spareFrequency,
                mainRoute: adjustMainRoute,
                spareRoute: adjustBackRoute
            };
        }

        updateBusInfo(url, updateBusData).then(function () {
            parent.modalLocator.showInfoMsg("光通道路由信息更新成功");
        });

    });


    /**
     * 光通道调整的 取消 按钮
     */
    $("#bus_adjust_stragedy .data-dismiss").click(function () {
        networkPane.setBottom(null);
    });
    





    var updateBusInfo = function (url, updateBusData) {
        return new ajaxUtil.newAsyncAjaxRequest(url, updateBusData, "patch");
    };




    /**
     * 新建光通道响应
     */
    $('#bus_create').click(function () {
        //用于点击两点新增光通道    /**
        var nodeList=[];
        var nodeCount=0;
        parent.modalLocator.showInfoMsg("请选择两点");
        var graphListener=function(e){
            if(e.kind=="clickElement"&&e.element instanceof twaver.Node){
                nodeCount++;
                nodeList.push(network.getSelectionModel().getLastData());
                if(nodeCount>=2){
                    network.removeInteractionListener(graphListener);
                    nodeCount=0;

                    setTimeout(function () {
                        $("#modal_bus_generate input[type='text']").val("");
                        $("#modal_bus_generate input[name='AendName']").val(nodeList[0].getClient("netElementName"));
                        $("#modal_bus_generate input[name='ZendName']").val(nodeList[1].getClient("netElementName"));
                        // $("#modal_bus_generate input[name='circleId']").val(circleDisplay.getCircleId());
                        var ep=[];
                        $("#modal_bus_generate").modal("show");
                        //向buf中添加选择的节点
                        interFormData.dataFromBusGenerate.nodeList=nodeList;
                    },200)

                }
            }
        };
        network.addInteractionListener(graphListener);
    });

    $("#bus_adjust_stragedy .data-dismiss").click(function () {
        networkPane.setBottom(null);
    });
    /**
     * 业务可用性分析
     */
    $('#bus_invalid_ana').click(function () {

        $("div.panel-primary")[1].style.display = "";
        $("div.panel-primary")[0].style.display = "none";
        $("div.panel-primary")[2].style.display = "none";



        $('#bus_invalid_list').bootstrapTable("refresh",
            {url:DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.osnr+"falseList/"+parent.versionId+"/"+circleDisplay.getCircleId()+"/"});
        showLeftPanel();   //显示左面板
    });


    /**
     * 单通道分析响应逻辑
     */
    $('#bus_ana').click(function(){


        $("div.panel-primary")[0].style.display = "";
        $("div.panel-primary")[2].style.display = "none";
        $("div.panel-primary")[1].style.display = "none";



        $('#bus_list').bootstrapTable("refresh",{url:DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.bussiness+parent.versionId+"/"+circleDisplay.getCircleId()+"/"});
        showLeftPanel();
      });
    var showLeftPanel=function(){
        $('#accordion').show();
        networkPane.setLeft($('#accordion')[0]);
        networkPane.setLeftWidth(200);
        //解决左边栏和底部面板显示重叠问题
        $('#accordion').css('overflow','auto');
    };

    /**
     * 根据传入表单数据来对路由进行标色
     * @param rowData 光通道字符串
     * @param color 标色
     * @param linkStyleFlag 若存在，则画虚线
     */
    var markRoute=function (rowData,color,linkStyleFlag) {
        var nodeNameList=rowData.split("-");
        nodeList=$.panelUtil().getNodeByName(network,nodeNameList);
        linkList=$.panelUtil().getLinkByName(network,nodeNameList);
        if(linkStyleFlag){
            $.each(linkList,function (index,element) {
                element.setStyle('link.pattern', [10, 5]);
            })
        }
        else{
            $.each(linkList,function (index,element) {
                element.setStyle('link.pattern',undefined);
            })
        }
        if(nodeList.length>0)
            network.centerByLogicalPoint(nodeList[0].getX(), nodeList[0].getY(), true);
        $.flashUtil().flashPath(nodeList,color,true,false);
        $.flashUtil().flashPath(linkList,color,true,false);

    };




    /**
     * 初始化所有表单
     * 其中
     * list_osnr对应osnr光通道大致信息
     * list_method对应生成策略信息
     * list_bus_osnr对应osnr光通道详细信息
     * bus_list对应光通道列表信息
     * @returns {{}}
     */

    var initTabConfig=function () {
        var Config={
            Options:{},
            FieldMappingList:{}
        };
        Config.FieldMappingList.list_osnr=[
            {field:"bussinessName",title:"光通道名称"},
            {field:"isMain",title:"主/备"},
            {field:"frequency",title:"频点(THZ)"},
            {field:"wholeRouteString",title:"路由"},
            {field:"isUsable",title:"是否可用"},
        ];
        Config.FieldMappingList.list_method=[
            {field:"bussinessName",title:"光通道名称"},
            {field:"isMain",title:"路由"},
            {field:"routeString",title:"具体路径"},
            {field:"channelFrequency",title:"频点"},
            {field:"4",title:"跳数"},
            {field:"5",title:"距离"},
            {field:"6",title:"频点占用率"}];
        Config.FieldMappingList.list_bus_osnr=[
            {field:"bussinessName",title:"光通道名称"},
            {field:"frequency",title:"频点(THZ)"},
            {field:"startNetElementName",title:"起始站点"},
            {field:"endNetElementName",title:"终止站点"},
            {field:"result",title:"Osnr值(>18Db)"}
        ];
        Config.FieldMappingList.bus_list=[{field:"bussinessName",title:"光通道名称"}];
        Config.FieldMappingList.adjust_method_list = [
            {field: "bussinessName", title: "光通道名称"},
            {field: "isMain", title:"路由"},
            {field: "routeString", title:'具体路由'},
            {field: "channelFrequency", title: "频点"},
            {field: "4", title: "跳数"},
            {field: "5", title: "距离"},
            {field: "6", title: "频点占用率"}
        ];

        Config.FieldMappingList.bus_adjust_list=[{field: "bussinessName", title:"光通道名称"}];
        Config.Options.busList={
            showToolbar:false,
            searchBar:true,
            doubleClick:function (row, $element, field){
                var data=[];
                data.push(new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.osnr+"nodesDetails/"+parent.versionId+"/"+row.bussinessId));
                data.push(new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.osnr+"generalInfos/"+parent.versionId+"/"+row.bussinessId));
                Promise.all(data).then(function (resultData) {
                   // busNodeSpecData.length=0;
                    busNodeSpecData=resultData[0];
                    markBus(resultData[1]);
                    $("#osnr_bus_list").bootstrapTable("load",resultData[1]);

                    setBottomPane(networkPane, BottomPanel.PanelBus);

                });
            },
        };

        Config.Options.bus_adjust_list={
            showToolbar:false,
            searchBar:true,
            doubleClick:function (row, $element, field) {
                var mainRoute = row.mainRoute;
                var equipArr = mainRoute.split('-');

                // 光通道的起始站点
                var startName = equipArr[0];
                var endName = equipArr[equipArr.length - 1];


                var dataList = network.getElementBox().getDatas();
                for (var i = 0; i < dataList.size(); i++) {
                    var item = dataList.get(i);
                    if (item instanceof twaver.Node) {
                        if (item.getName() == startName)
                            adjustStartNode = item;

                        if (item.getName() == endName)
                            adjustEndNode = item;
                    }
                }


                adjustInputPower = row.inputPower;
                adjustBusName = row.bussinessName;
                adjustBusId = row.bussinessId;
                adjustMainFrequency = row.mainFrequency;
                adjustBackRoute = row.spareFrequency;

                adjustBussiness = row;
                setBottomPane(networkPane, BottomPanel.PanelAdjust);

                //变色
                new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.osnr+"generalInfos/"+parent.versionId+"/"+adjustBusId).then(function (result) {
                    markBus(result);
                })

                // 调整样式
                //var tt = $('#bus_adjust_stragedy')[0];
                //tt.style.width = '800px';
            }
        };

        Config.Options.list_bus_osnr={
            showToolbar:false,
            searchBar:false,
        };
        Config.Options.list_method={
            showToolbar:false,
            searchBar:false,
        };

        Config.Options.adjust_method_list={
             showToolbar: false,
             searchBar: false,
        };

        Config.Options.list_osnr={
            showToolbar:false,
            searchBar:false,
            doubleClick:function (row){
                $("#bus_osnr_spec_list").bootstrapTable("refresh",
                    {url:DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.osnr+"detailInfos/"+parent.versionId+"/"+row.bussinessId+"/"+(row.isMain=="主用"?"true":"false")});
                $("#modal_osnr_spec").modal("show");
            }
        };
        tableUtil.createTable($("#bus_osnr_spec_list"),null,Config.FieldMappingList.list_bus_osnr,Config.Options.list_bus_osnr);
        tableUtil.createTable($('#osnr_method_list'),null,Config.FieldMappingList.list_method,Config.Options.list_method);
        tableUtil.createTable($('#osnr_bus_list'),null,Config.FieldMappingList.list_osnr, Config.Options.list_osnr);
        tableUtil.createTable($('#bus_list'),null,Config.FieldMappingList.bus_list,Config.Options.busList);
        tableUtil.createTable($('#bus_invalid_list'),null,Config.FieldMappingList.bus_list,Config.Options.busList);
        tableUtil.createTable($('#bus_adjust_list'), null, Config.FieldMappingList.bus_adjust_list, Config.Options.bus_adjust_list);
        tableUtil.createTable($('#adjust_method_list'), null, Config.FieldMappingList.adjust_method_list, Config.Options.adjust_method_list);
        $(".fixed-table-loading").hide();
        return Config;
    };


    // 业务调整的 起点 终点 业务名称 业务ID 主/备频点
    var adjustStartNode, adjustEndNode, adjustInputPower, adjustBusName, adjustBusId, adjustMainFrequency, adjustBackFrequency;

    var adjustBussiness;
    // 业务调整后的 主用/备用 路由
    var adjustMainRoute, adjustBackRoute;


    var markBus=function (businessData) {
        $.flashUtil().clearNetwork(network);
        $.each(businessData,function (index,row) {
            var color;
            interFormData.dataFromBusSpec.selectedLinkFrequency=row.frequency;
            if(row.isMain=="主用")
                color="#7FFFAA";
            else
                color="#00FFFF";
            markRoute(row.wholeRouteString,color,1);
            markRoute(row.realRouteString,color);
        })
    };
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
       return  new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.bussiness+parent.versionId).then(function (data) {
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
            var op={};
            op.data=data;
            tableUtil.createTable($('#bussinessList'),null,tableList,{data:data,showToolbar:true,searchBar:true,pagination:true});
        });

    }
    /**
     * 显示osnr信息窗口
     * @param element
     */
    function osnrSpecDisplay(element){
        if(busNodeSpecData.length<=0)
            parent.modalLocator.showErrMsg("请检查是否选择光通道或此网元是否可用");
        else{
            var flag=false;
            if(element instanceof twaver.Node){
                $.each(busNodeSpecData,function (index,nodeData) {
                    if(element.getClient("netElementName")==nodeData.nodeName){
                        flag=true;
                        formUtil.fillJsonToForm($('#modal_element_spec_equip'),nodeData);
                        $('#modal_element_spec_equip').modal('toggle');
                        return false;
                    }
                });
                if(!flag)
                    parent.modalLocator.showErrMsg("请选择在此光通道上的可用节点");
            }
            else if(element instanceof twaver.Link){
                $.each(linkList,function (index,linkNode) {
                    if(linkNode.getClient("linkId")==element.getClient("linkId")){
                        flag=true;
                        formUtil.fillJsonToForm($('#modal_element_spec_link'),element._clientMap);
                        $('#modal_element_spec_link input[name="frequency"]').val(interFormData.dataFromBusSpec.selectedLinkFrequency);
                        $('#modal_element_spec_link').modal('toggle');

                    }
                });
                if(!flag)
                    parent.modalLocator.showErrMsg("请选择在此光通道上的可用节点");

            }

        }

    }




    /**
     * 包括工具栏、canvas、右键菜单初始化
     */
    var initNetwork=function(){
       // $('#accordion').show();
        $('body').height= $('#content_wrapper').width();
        var toolbar=graphUtil.createNetworkToolbar(network);
        networkPane = new twaver.controls.BorderPane(network, toolbar,null,null, null);
        networkPane.setTopHeight(25);
      //  networkPane.setLeftWidth(200);
        $('.network-panel').append(networkPane.getView());
        networkPane.adjustBounds({x:0,y:0,width:document.documentElement.clientWidth,height:$('.network-panel').height()});
        window.onresize = function (e) {
            networkPane.adjustBounds({x:0,y:0,width:document.documentElement.clientWidth,height:$('.network-panel').height()});
            networkPane.invalidate();
        };
        network.setToolTipEnabled(false);
        var popupMenu = graphUtil.createMenu(network);
        popupMenu.addMenuItems(1,'Node',"查看详细信息",osnrSpecDisplay);
        popupMenu.addMenuItems(1,'Link',"查看详细信息",osnrSpecDisplay);
        popupMenu.generateMenus();
    };

    /**
     * network底层加载onsr信息面板
     * @param networkPane
     */
    var setBottomPane=function(networkPane,element){
        if(element){
            networkPane.setBottomHeight(200);
            networkPane.setBottom(element);
        }
        else
            networkPane.setBottom(null);
    };


    /**
     * 光通道调整的相应事件
     */
    $("#bus_adjust").click(function () {


        $("div.panel-primary")[2].style.display = "";
        $("div.panel-primary")[0].style.display = "none";
        $("div.panel-primary")[1].style.display = "none";


        $("#bus_adjust_list").bootstrapTable("refresh",{url:DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.bussiness+parent.versionId+"/"+circleDisplay.getCircleId()+"/"});
        showLeftPanel();
    });
    
    $('#bus_delete').click(function () {
        initComplexData().then(function () {
            $('#busDeleteModal').modal('toggle');
            $('.fixed-table-loading').hide();
        });

    })


    /**
     * 左侧信息栏关闭按钮
     */
     $(".left-close-button").click(function () {
         $('#accordion').hide();
         $('#accordion .panel-collapse').collapse('hide');
         networkPane.setBottom(null);
     });
    $('#refreshGraph').on('click',function () {
         circleDisplay.changeCircleGraph("全网");
     })


    /**
     * 计算路由的频点占用率
     */
    function calculateTHZOccupancy(routeString) {

        var routeArr = routeString.split('-');
        var result = 0;
        for (var i = 0; i < routeArr.length; i++) {

            var equipName = routeArr[i];
            //result += bussinessRoute.busIdNeedChange(equipName).length;
            var busArr = bussinessRoute.busIdNeedChange(equipName);
            result += busArr.length;
        }

        return (parseFloat(result) / 40).toFixed(2);
    }
    


    return function(){
        initModal();
        initNetwork();
        TabSetting=initTabConfig();
        circleDisplay.init();
        circleDisplay.changeCircleGraph("全网").then(function () {
            $('.circle-display').on('click',function () {
                $('#accordion .panel-collapse').collapse('hide');
                setBottomPane(networkPane);
            });
        });

        // getGraphData().then(function(GraphData){
        //     graphUtil.initBoxFromJson(box,GraphData[1],GraphData[0]);
        // });
        jQuery.extend({
            flashUtil:function () {
                return FlashUtil.createNew();
            },
            panelUtil:function () {
                return AnalysePanel.createNew();
            }
        });
    };
};

/**
 * 获取拓扑图节点、链路信息
 * @returns {Promise.<{}>}
 */
var getGraphData=function(){
    var recvArr= [];
    recvArr.push(new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+ DEFAULT_OPTIONS.Prefix.links+parent.versionId));
    recvArr.push(new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+
        DEFAULT_OPTIONS.Prefix.netElements+parent.versionId));
    return Promise.all(recvArr);
};

var refreshData=function () {
    getGraphData().then(function(GraphData){
        //shi一样的需求，同步刷新
        graphUtil.initBoxFromJson(box,GraphData[1],GraphData[0]);
    });

};