/**
 * Created by yzl on 2017/11/2.
 */
jQuery(document).ready(function() {
    "use strict";
    UIUtil.setAllModalDraggable($(document));
    init()();
});
var networkPane;
var analyseResultPanel;             // 左侧面板
var analysePanelManager = AnalysePanel.createNew();
var analyseInfoPanelManager = AnalysePanel.createInfoNew();
var analyseInfoPanel;               // 下方面板
var box = new twaver.ElementBox();
var network = new twaver.vector.Network(box);
var circleDisplay=new circleDisplayer($('.func-panel .nav'),box);

// 网元节点是否带有颜色
var elementWithColor = false;

var init= function () {

    var Operator;
    var color={
        invalid:"#FF0000",
        valid:"#00FF00",
        incheck:"#0000CC",
    };
    var newRouteFinder;
    var getGraphData = function () {
        var recvArr = [];
        recvArr.push(new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface + DEFAULT_OPTIONS.Prefix.links + parent.versionId));
        recvArr.push(new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface +
            DEFAULT_OPTIONS.Prefix.netElements + parent.versionId));
        return Promise.all(recvArr);
    };

    var initNetwork=function(){
        $('body').height= $('#content_wrapper').width();
        var toolbar=graphUtil.createNetworkToolbar(network);
        analyseResultPanel = analysePanelManager.CreateAnalysePanel();
        analyseInfoPanel = analyseInfoPanelManager.CreateInfoPanel();
        networkPane = new twaver.controls.BorderPane(network, toolbar, null, null, null);
        initMenu(network);
        networkPane.setTopHeight(25);
        networkPane.setLeftWidth(200);
        $('.network-panel').append(networkPane.getView());
        networkPane.adjustBounds({x:0,y:0,width:document.documentElement.clientWidth,height:$('.network-panel').height()});
        window.onresize = function (e) {
            networkPane.adjustBounds({x:0,y:0,width:document.documentElement.clientWidth,height:$('.network-panel').height()});
            networkPane.invalidate();
        };
    };

    var initMenu=function(network) {
        var popupMenu = graphUtil.createMenu(network);
        popupMenu.addMenuItems(1,'Node',"检修网元",function (element){
            operateElement(element);
        });
        //
        // popupMenu.addMenuItems(1,'Node',"检修恢复",function (element){
        //     recoverAction(element);
        // });
        //
        // popupMenu.addMenuItems(2,'Link',"检修网元",function (element){
        //     operateElement(element);
        // });
        // popupMenu.addMenuItems(1,'Link',"检修恢复",function (element){
        //     recoverAction(element);
        // });
        popupMenu.addMenuItems(1,'Node',"添加检修单",function (){
            addOperateRecord(box);
        });
        popupMenu.addMenuItems(1,'Link',"添加检修单",function (){
            addOperateRecord(box);
        });
        popupMenu.generateMenus();
    };
    function addOperateRecord(box) {
        var selectModel=box.getSelectionModel();
        if(selectModel.getSelection().size()>2)
            parent.modalLocator.showErrMsg("最多只能选中两个节点！");
        else{
            initNewRecordForm(selectModel.getSelection().toArray());
            selectModel.clearSelection();
        }

    }

    /**
     *全局变量存放json格式的受影响业务和中断业务
     */
    var opreateResultDetail;

    /**
     * 全局存放待检修的设备，复用段
     * @type {Array}
     */
    var maintenanceElementList = new Array();


    /**
     *  下检修单时的傻逼操作
     *  顺序：1不关心两个节点是否相互影响，同时获取其检修情况下影响、中断的业务
     *         2 中断业务为0时正常检修，不为0时删除中断业务，检修,这里检修不负责检修后果
     *          3按输入顺序做检修操作
     */
    var checkOperateList=function (elementList) {
        maintenanceElementList = elementList;


        var idList=[];
        elementList.forEach(function (element) {
            idList.push((element instanceof twaver.Node)?element.getClient("netElementId"):element.getClient("linkId"));
        });
        var operateResult=Operator.getOperateResult(idList);
        opreateResultDetail=Operator.getDetailList(idList);
        // var AffectBusiness=Operator.busRoute.maintenanceAffectBusiness(elementList);
        var InterruptBusiness=Operator.busRoute.maintenanceInterruptBusiness(idList);
        /**
         * 如果有中断业务，删除中断业务
         */
        if(InterruptBusiness.length>0){
            var deleteBusList=InterruptBusiness.map(function (element) {
                return element.busId;
            });
            Operator.busRoute.deleteBusList(deleteBusList);
        }
        //检修单可以检修也显示影响中断详细信息
        $("#alert-label").html("该检修单检修情况如下：");
        showOperateResult(operateResult);

        elementList.forEach(function (element) {
            var result= Operator.checkElementStatus(element);
            switch (result.status){
                case Operator.operateStatus.invalid:{
                    operateElement(element);
                    //再次对检修节点进行检修
                    // operateElement(element,{skipDisplay:true});
                    break;
                    //生成新路由无提示逻辑
                }
                case Operator.operateStatus.noBus:{
                    operateElement(element);
                    break;
                }
                case Operator.operateStatus.directSwitch:{
                    operateElement(element);
                    break;
                }
                case Operator.operateStatus.needSwitch:{
                    operateElement(element,{skipDisplay:true});

                    break;
                }
                default:{
                    break;
                }

            }
        });

        
    };


    /**
     * 检修单检修结果
     */
    var showOperateResult=function (operateResult) {
        formUtil.fillJsonToForm($('#modal_operate_result'),operateResult);
        $('#modal_operate_result').modal('toggle');
    };

    /**
     * 单点检修操作，傻逼ie不支持json内中括号变量名，就别想套策略模式了呵呵呵呵
     * @param element options
     * options: skipDisplay:boolean跳过选择检修页面
     */
    var operateElement=function (element,options) {
        var opt=options||{};
        var result= Operator.checkElementStatus(element);
        //console.log("operate status:"+result.status);
        switch (result.status){
            case Operator.operateStatus.inCheck:{
                parent.modalLocator.showErrMsg("该节点已经检修，请勿重复检修");
                break;
            }
            case Operator.operateStatus.invalid:{
                debugger;
               // parent.modalLocator.showConfirmMsg('',"该网元无法检修，是否通过策略生成新路由",function() {
                newRouteFinder.switchRoute(element);
                element.setClient("incheck",true);
                $.flashUtil().flashOneNode(element,color.incheck,true,true);
              //  });
                break;
            }
            case Operator.operateStatus.noBus:{
                //parent.modalLocator.showErrMsg("该网元上没有承载光通道，无需检修");
                element.setClient("incheck",true);
                $.flashUtil().flashOneNode(element,color.incheck,true,true);
                break;
            }
            case Operator.operateStatus.directSwitch:{

                Operator.Logger.recordRecoverLog(element,$.extend(true,[],result.data.processList));
                Operator.switchRoute(result.data.processList,"process");
                //你问我为什么又重写一遍？因为最外层不好再拆分成单独功能函数，涉及变色、日志记录及顺序问题，写成一个函数杂的不行，以后再重构吧hhhh
                element.setClient("incheck",true);
                $.flashUtil().flashOneNode(element,color.incheck,true,true);
                Operator.recordOperation(network);
                var diffList=Operator.Logger.getDiffElements();
                // $.flashUtil().flashPath(diffList.validList,color.valid,true,true);
                // $.flashUtil().flashPath(diffList.invalidList,color.invalid,true,true);
                break;
            }
            case Operator.operateStatus.needSwitch:{
                /**
                 * 注意顺序：
                 *
                 * 选择界面
                 * 保存影响业务记录（deep copy），请不要使用slice或concat，它们只拷贝基础数据类型
                 * 更新业务路由
                 * 将节点置于检修状态
                 * 全网检修保存记录
                 * 比较新旧全网检修记录获取需要变色的节点
                 * 变色
                 */

                $('#modal_usr_select table').bootstrapTable('load',result.data.selectList);
                $('#modal_usr_select .btn-submit').unbind().click(function () {
                    Operator.Logger.recordRecoverLog(element,$.extend(true,[],result.data.processList,result.data.selectList));
                    Operator.switchRoute(result.data.selectList,"select");
                    Operator.switchRoute(result.data.processList,"process");
                    element.setClient("incheck",true);
                    Operator.recordOperation(network);
                    var diffList=Operator.Logger.getDiffElements();
                    $.flashUtil().flashOneNode(element,color.incheck,true,true);
                    // $.flashUtil().flashPath(diffList.validList,color.valid,true,true);
                    // $.flashUtil().flashPath(diffList.invalidList,color.invalid,true,true);
                });
                if(opt.skipDisplay)
                    $('#modal_usr_select .btn-submit').click();
                else
                    $('#modal_usr_select').modal("toggle");

                break;
            }

        }

    };

    /**
     * 恢复节点，变色
     * @param element
     */
    var recoverAction=function (element,options) {
        var opt=options?options:{};
        // if(element.getClient("incheck")||element.getClient('routeReco')) {
        //     //Operator.recoverOperation(element);

            Operator.recoverToInitialState();       // 将busRoute恢复至原始状态
            Operator.recordOperation(network);
            var diffList=Operator.Logger.getDiffElements();

            //$.flashUtil().flashPath(diffList.validList, color.valid, true, options ? opt.flashFlag : true);
            //$.flashUtil().flashPath(diffList.invalidList, color.invalid, true, options ? opt.flashFlag : true);
        //
        // }
        // else{
        //     parent.modalLocator.showErrMsg("该网元没有处于检修状态！");
        // }
    };




    /**
     * 表格内按钮
     * @param value
     * @param row
     * @param index
     */
    var operationListFormatter=function (value, row, index) {
        return [
            '<button type="button" class="operate-perform btn btn-primary  btn-sm" style="margin-right: 15px;"  >检修</button>',

            '<button type="button" class="operate-spec btn btn-primary  btn-sm" style="margin-right:15px;">查看详细信息</button>'
        ].join("");
    };


    /**
     * 把检修的信息转换成JSON
     */
    var convertMaintenanceMsgToJson = function () {
        var result = new Object();

        var maintenanceElementName = "";
        if (maintenanceElementList.length > 1) {
            tempNameArray = new Array();
            for (var i = 0; i < maintenanceElementList.length; i++) {
                if (maintenanceElementList[i] instanceof twaver.Node)
                    tempNameArray.push(maintenanceElementList[i].getName());
                else
                    tempNameArray.push(maintenanceElementList[i].getName());
            }
            maintenanceElementName = tempNameArray.join(",");
        }
        else {
            if (maintenanceElementList[0] instanceof twaver.Node)
                maintenanceElementName = maintenanceElementList[0].getName();
            else
                maintenanceElementName = maintenanceElementList[0].getName();
        }


        var date = new Date();
        var nowDate = date.toLocaleDateString() + "-" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
        result.excelName = "Overyhaul-" + maintenanceElementName + "-" + nowDate;
        result.maintenanceElement = maintenanceElementName;       // 检修的设备

        var breakBusArray = new Array();
        var affectBusArray = new Array();
        for (var i = 0; i < opreateResultDetail.length; i++) {
            affectBusArray.push(opreateResultDetail[i].affectBus);
            if (opreateResultDetail[i].interruptBus != "")
                breakBusArray.push(opreateResultDetail[i].interruptBus);
        }

        result.affectBusiness = affectBusArray; // 检修影响的业务数
        result.breakBusiness = breakBusArray;   // 检修中断的业务数

        console.log(JSON.stringify(result));



        parent.modalLocator.showConfirmMsg('', "是否将信息保存到excel中",function () {
            $.post("/exportOperate", JSON.stringify(result), function (data) {
                return new Promise(function (resolve, reject) {
                    resolve(data);
                });
            });
        });

    }




    /**
     * 表格内按钮事件响应
     * @type {{"click .operate-perform": Window.operateListEvents.click .operate-perform, "click .operate_spec": Window.operateListEvents.click .operate_spec}}
     */
    var operateListEvents= {
        'click .operate-perform': function (e, value, row, index) {
           // var x=
            var selectNameList=row.deviceName.split(","),selectElementList=[];
            $.each(selectNameList,function (index,name) {
                box.forEach(function(item){
                    if((item.getClient("netElementName")==name||item.getClient("linkName")==name)){
                        selectElementList.push(item);
                    }
                });
            });
            if(selectElementList.length>0){
                reconditionOperate(row.id).then(function () {
                        checkOperateList(selectElementList);
                    });
            }
            else if(selectElementList.length>2){
                parent.modalLocator.showErrMsg("请只选择1-2个节点进行检修");
            }
            //提交后尚未改动
            else {
                parent.modalLocator.showConfirmMsg("未找到匹配设备","未匹配到对应节点或链路，是否需要手动选择",function () {
                    //手动选择检修的时候，更新检修单状态函数需要传入检修单id，所以先将id放入手动选择模态框里==
                    $('#modal_elements_list label').text(row['id']);
                    $('#modal_elements_list').modal('toggle');
                    $('#modal_operation_list input[type="hidden"]').val(row.id);
                });
            }

        },
        'click .operate-spec': function (e, value, row, index) {
            //console.dir(row);
            formUtil.fillJsonToForm('#modal_operation_spec_list',row);
            $('#modal_operation_spec_list').modal('toggle');
        }
    };
    /**
     * 检修单检修时恢复图状态函数
     * @param selectElement
     * @param id
     */
    var reconditionOperate = function(id){
        var operateList=Operator.getOperateList();
        if(operateList.length>0){
            recoverAction(operateList[0],{flashFlag:false});
        }
        else
            console.log("wtf");
        $('#modal_operation_list').modal('toggle');
       // operateElement(selectElement);
        // update
        return  ajaxUtil.submitResource(DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.maintenanceRecords+id,'','patch');
    };
    /**
     * 将所有信息放入一个下拉框中
     * 当检修单无法匹配时，提供所有站点链路信息供选择
     */
    var showAllElements = function(){
        var type = $("#element_type").find('option:selected').text();
        $("#element_name").find("option").remove();
        box.forEach(function(item){
            if(item instanceof twaver.Node &&type==='站点'){
                $("#element_name").append("<option value='Value'>"+item.getClient('netElementName')+"</option>");
            }else if(item instanceof twaver.Link &&type==='链路') {
                $("#element_name").append("<option value='Value'>"+item.getClient('linkName')+"</option>");
            }
        });
    };



    /**
     * 新建检修单时传入节点数组以初始化表单的一些数据
     * @param itemArr 节点数组
     */
    var initNewRecordForm = function(itemArr){
        var itemName = [];
        for(var i=0; i<itemArr.length; i++){
            if(itemArr[i] instanceof twaver.Node ){
                itemName[i] = itemArr[i].getClient('netElementName');
            }else {
                itemName[i] = itemArr[i].getClient('linkName');
            }
        }
        //先将表单的旧内容清空
        $('#new_maintenance_record').find('.input-xlarge').val('');

        $('#new_maintenance_record').find('textarea[name="deviceName"]').val(itemName.join(','));

        $("#new_maintenance_record").modal('toggle');
    };


    var selectChangeListener=function (e) {
        console.log("Kind:"+e.kind);
        if(!(e.kind=="remove"||e.kind=="clear"))
            box.getSelectionModel().appendSelection(e.datas);
    };
    var initDOMElements=function () {
        box.getSelectionModel().addSelectionChangeListener(selectChangeListener);
        $('.fixed-table-loading').hide();
        /**
         * 全网检修响应
         */
        $("#check_all_net").on('click',function () {
            elementWithColor = true;
            var resultList= Operator.checkAllElements(network);
            // $.flashUtil().flashPath(resultList.validList,color.valid,true,false);
            // $.flashUtil().flashPath(resultList.invalidList,color.invalid,true,false);
        });
        $('#show_bus_list').on('click',function () {
            $('#modal_bus_list table').bootstrapTable('refresh',{url:DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.bussiness+parent.versionId+"/"+circleDisplay.getCircleId()+"/"});
            $('#modal_bus_list').modal('toggle');
        });

        $("ul.circle-display").unbind().on('click', function (e) {
            circleDisplay.changeCircleGraph(e.target.innerText).then(function () {
                Operator=riskOperator.createNew();
                //newRouteFinder=new FindNewRoute(Operator,{color:color});
                newRouteFinder.setOperatorAndBusRoutes(Operator);
                Operator.recordOperation(network);
            });
        });



        /**
         * 全网风险预警响应
         */
        $("#risk_check_report").on("click",function () {
            $('#modal_report_check table').bootstrapTable('load',Operator.getCheckReport());
            $('#modal_report_check').modal('toggle');
        });
        /**
         * 风险值评估
         */
        $("#risk_estimate_report").on("click",function () {
            var resultObj=Operator.Logger.integrateFormData();
            if(resultObj){


                // 将风险值变化的项全部置前

                var unchangeList = [];
                var changeList  = [];

                $(resultObj.priList).each(function (index, item) {
                    if (item.prePri != item.curPri)
                        changeList.push(item);
                    else
                        unchangeList.push(item);
                });

                resultObj.priList = changeList.concat(unchangeList);

                var options = {};
                options.showPaginationSwitch = true;
                options.pagination = true;
                options.singleSelect = false;
                options.searchBar = true;

                var tableList = [];
                tableList.push({field:"bussinessName", title:"光通道名称", width:100});
                tableList.push({field:"mainPreRoute", title:"检修前主用路由", width:200});
                tableList.push({field:"sparePreRoute", title:"检修前备用路由", width:200});
                tableList.push({field:"prePri", title:"检修前风险值", width:80});
                tableList.push({field:"mainCurRoute", title:"检修后主用路由", width:200});
                tableList.push({field:"spareCurRoute", title:"检修后备用路由", width:200});
                tableList.push({field:"curPri", title:"检修后风险值", width:80});
                tableUtil.createTable($('#modal_report_estimate #estimate'), null, tableList, options);
                $('#modal_report_estimate #estimate').bootstrapTable('hideLoading');

                $('#modal_report_estimate #estimate').bootstrapTable('load',resultObj.priList);
                $('#modal_report_estimate #priSum').bootstrapTable('load',resultObj.priSum);
                $('#modal_report_estimate').modal('toggle');
            }
            else
                parent.modalLocator.showErrMsg("评估前请先进行检修操作！");


        });


        /**
         * 显示“业务风险评估”时，对风险值有变化的项标红
         */
        $('#modal_report_estimate #estimate').on('page-change.bs.table', function (number, size) {
            var allMesseage = $("#modal_report_estimate #estimate").bootstrapTable('getData', 'true');

            $('#modal_report_estimate #estimate tbody tr').each(function (index, item) {
                var oneData = allMesseage[index];
                if (oneData.prePri != oneData.curPri) {

                    $(item).children('td:eq(3)').css('color', '#FF0000');
                    $(item).children('td:eq(6)').css('color', '#FF0000');
                }
            });
        });



        /**
         * 显示“业务风险评估”时，对风险值有变化的项标红
         */
        $('#modal_report_estimate').on('shown.bs.modal', function () {
            var allMesseage = $("#modal_report_estimate #estimate").bootstrapTable('getData', 'true');

            $('#modal_report_estimate #estimate tbody tr').each(function (index, item) {
                var oneData = allMesseage[index];
                if (oneData.prePri != oneData.curPri) {

                    $(item).children('td:eq(3)').css('color', '#FF0000');
                    $(item).children('td:eq(6)').css('color', '#FF0000');
                }
            });
        });

        $('#confirmToExcelButton').click(function () {
            convertMaintenanceMsgToJson();
        })


        // 给modal添加关闭按钮
        $('#modal_report_estimate_close_button').click(function () {
            $('#modal_report_estimate').modal('hide');
        });

        $('#modal_report_check_close_button').click(function () {
            $('#modal_report_check').modal('hide');
        });

        $('#modal_bus_list_close_button').click(function () {
           $('#modal_bus_list').modal('hide');
        });

        $('#modal_operation_list_close_button').click(function () {
            $('#modal_operation_list').modal('hide');
        });

        $('#modal_operation_detail_list_close_button').click(function () {
            $('#modal_operation_detail_list').modal('hide');
        });


        /**
         * 检修单详细结果查询
         */
        $("#show_operation_detail").on("click",function () {
            var tableList = [];
            tableList.push({field:"affectBus", title:"影响业务", width:500});
            tableList.push({field:"interruptBus", title:"中断业务", width:500});
            $('#modal_operation_detail_list').modal('toggle');
            tableUtil.createTable($('#modal_operation_detail_list table'), null, tableList);
            $('#modal_operation_detail_list table').bootstrapTable('hideLoading');
            $('#modal_operation_detail_list table').bootstrapTable('load',opreateResultDetail);
        });

        /**
         * 检修单信息查询
         */
        $("#show_operation_list").on("click",function () {

            $('#modal_operation_list table').bootstrapTable('refresh',{url:DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.maintenanceRecords});
            $('#modal_operation_list').modal('toggle');

        });


        /**
         * 刷新全图，恢复每个网元和连线的初始颜色
         */
        $("#refreshGraph").on('click', function () {

            elementWithColor = false;
            initData();

            // var dataList = box.getDatas();
            // for (var i = 0; i < dataList.size(); i++) {
            //     var dataItem = dataList.get(i);
            //     dataItem.setStyle('inner.color', undefined);
            // }
        });



        /**
         * 显示模态框前先填充
         */
        $('#modal_elements_list').on('show.bs.modal', function () {
            showAllElements();
        });
        /**
         * 检修单手动选择节点进行检修
         */
        $('#modal_elements_list').find(".btn-affirm").on('click', function () {
            var selectElement;
            var name = $("#element_name").find('option:selected').text();
            box.forEach(function(item){
                if(item.getClient("netElementName")===name||item.getClient("linkName")===name){
                    selectElement=item;
                }
            });
            if(selectElement) {
                //reconditionOperate(selectElement,$('#modal_operation_list input[type="hidden"]').val());
                var haha = $('#modal_operation_list input[type="hidden"]').val();
                var selectElementList = new Array();
                selectElementList.push(selectElement);
                reconditionOperate($('#modal_operation_list input[type="hidden"]').val()).then(function () {
                    checkOperateList(selectElementList);
                });
            }
            else
                parent.modalLocator.showErrMsg("获取节点错误");
        });
        $("#element_type").on("change",function(){
            showAllElements();
        });


        /**
         * 新建检修单提交数据
         */
        $("#new_maintenance_record .btn-submit").unbind().click(function () {
            var data=$('#new_maintenance_record').find('.input-xlarge').serializeArray();
            //  var dd = formUtil.SerializeArrayToJson(data);
            // console.dir(data);
            ajaxUtil.submitResource(DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.maintenanceRecords,data,"post")
                .then(function (data) {
                    parent.modalLocator.showSuccessMsg();
                })
                .catch(function(err){
                    parent.modalLocator.showErrMsg(err.responseText);
                })
        })

    };
    var initTable=function () {
        var Config={
            Options:{},
            FieldMappingList:{}
        };
        Config.Options.userSelect={
            // pagination:true,
            showToolbar:false,
            column:[
                {
                    valign:"top",
                }
            ]
        };
        Config.Options.operationListSpec={
            showToolbar:false,
            pagination:false
        };
        Config.Options.showTableExport ={
            showExport: true,
            showToolbar:true,
            pagination:true
        };
        Config.FieldMappingList.userSelect=[
            {checkbox:true},
            {field:"bussinessName",title:"光通道名称"},
            {field:"mainRoute",title:"原路由"},
            {field:"spareRoute",title:"切换路由"}
        ];
        Config.FieldMappingList.riskEstimate=[
            {field:"bussinessName",title:"光通道名称"},
            {field:"mainPreRoute",title:"检修前主用路由"},
            {field:"sparePreRoute",title:"检修前备用路由"},
            {field:"prePri",title:"检修前风险值"},
            {field:"mainCurRoute",title:"检修后主用路由"},
            {field:"spareCurRoute",title:"检修后备用路由"},
            {field:"curPri",title:"检修后风险值"}
        ];
        Config.FieldMappingList.riskEstimatePri=[
            {field:"prePriSum",title:"检修前总风险值"},
            {field:"curPriSum",title:"检修后总风险值"}
        ];
        Config.FieldMappingList.riskCheck=[
            {field:"bussinessName",title:"风险光通道名称"},
            {field:"elementList",title:"不可检修点"}
        ];
        Config.FieldMappingList.operationList=[
            {field:"idNo",title:"记录Id"},
            {field:"deviceName",title:"检修设备"},
            {field:"deptName",title:"检修部门"},
            {field:"deptMan",title:"检修人员"},
            {
                title:"操作",
                formatter: operationListFormatter,
                events: operateListEvents}
        ];

        Config.FieldMappingList.busList=[
            {field:"bussinessName",title:"业务名称"},
            {field:"mainRoute",title:"主用路由"},
            {field:"spareRoute",title:"备用路由"},
        ];

        Config.FieldMappingList.operationSpecList=[
            {field:"record_name",title:"名称"},
            {field:"record_detail",title:"内容"}
        ];

        tableUtil.createTable($('#modal_usr_select table'),null,Config.FieldMappingList.userSelect,Config.Options.userSelect);
        tableUtil.createTable($('#modal_report_check table'),null,Config.FieldMappingList.riskCheck,Config.Options.showTableExport);
        tableUtil.createTable($('#modal_report_estimate #estimate'),null,Config.FieldMappingList.riskEstimate,Config.Options.userSelect);
        tableUtil.createTable($('#modal_report_estimate #priSum'),null,Config.FieldMappingList.riskEstimatePri,Config.Options.userSelect);
        tableUtil.createTable($('#modal_operation_list table'),null,Config.FieldMappingList.operationList);
        tableUtil.createTable($('#modal_bus_list table'),null,Config.FieldMappingList.busList,$.extend(true,{searchBar:true},Config.Options.showTableExport));
    };
    function initData() {
        circleDisplay.init();
       return circleDisplay.changeCircleGraph("全网");
    }

    return function () {
        $.extend({
            flashUtil:function () {
                return FlashUtil.createNew();
            },
        });

        initData().then(function () {
            Operator=riskOperator.createNew();
            newRouteFinder=new FindNewRoute(Operator,{color:color});
            Operator.busRoute.setFindNewRoute(newRouteFinder);
            Operator.recordOperation(network);
            initTable();
            initDOMElements();
            initNetwork();
        });



    }
};
