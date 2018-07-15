/**
 * Created by yzl on 2017/6/28.
 */
jQuery(document).ready(function() {
    "use strict";
    UIUtil.setAllModalDraggable($(document));
    sysGraph.init();
});

var networkPane;
var analyseResultPanel;             // 左侧面板
var analysePanelManager = AnalysePanel.createNew();
var analyseInfoPanelManager = AnalysePanel.createInfoNew();
var analyseInfoPanel;               // 下方面板
var box = new twaver.ElementBox();
var network = new twaver.vector.Network(box);
var circleDisplay=new circleDisplayer($('.func-panel .nav'),box);


var selectInitiator=function () {
    this.initDisk=function () {
        var  DiskOptions={
            url:DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.diskType+parent.versionId,
            blank:true
        };
        return UIUtil.adaptSelectList(DiskOptions,".modal [name='diskType']")
    };
    this.initAmp=function (diskType) {
        var AmpOptions={
            url:DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.diskType+parent.versionId+"/"+diskType,
            key:"amplifierName",
            val:"amplifierName"
        };
        return UIUtil.adaptSelectList(AmpOptions,".modal [name='amplifierName']");
    }

};


var sysGraph= function () {
    /**
     * 用于获取设备列表信息
     * @type {*}
     */
    var selectAdapter=new selectInitiator();
    var AequipList= $("#AendList");
    var ZequipList= $("#ZendList");
    var LinkTypeList= $("#linkType");
    var getGraphData=function(){
        var recvArr= [];
        recvArr.push(new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+ DEFAULT_OPTIONS.Prefix.links+parent.versionId));
        recvArr.push(new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+
            DEFAULT_OPTIONS.Prefix.netElements+parent.versionId));
        return Promise.all(recvArr);
    };
    /**
     * 包括工具栏、右键菜单初始化
     */
    var initNetwork=function(){
        $('body').height= $('#content_wrapper').width();
        var toolbar=graphUtil.createNetworkToolbar(network);
        //analyseResultPanel = AnalysePanel.CreateAnalysePanel();
        analyseResultPanel = analysePanelManager.CreateAnalysePanel();
        analyseInfoPanel = analyseInfoPanelManager.CreateInfoPanel();
        networkPane = new twaver.controls.BorderPane(network, toolbar, null, null, null);
        var popupMenu = graphUtil.createMenu(network);
        popupMenu.addMenuItems(1,'Node',"资源删除",function (data){
            deleteElement(data);
        });
        popupMenu.addMenuItems(2,'Node',"资源修改",function (data){
            modElement(data);
        });
        // popupMenu.addMenuItems(3,'Node',"机盘管理",function (data){
        //     manageDisk(data);
        // });
        popupMenu.addMenuItems(2,'Link',"资源删除",function (data){
            deleteElement(data);
        });
        popupMenu.addMenuItems(1,'Link',"资源修改",function (data){
            modElement(data);
        });
        popupMenu.generateMenus();
        networkPane.setTopHeight(25);
        networkPane.setLeftWidth(200);
        $('.network-panel').append(networkPane.getView());
        networkPane.adjustBounds({x:0,y:0,width:document.documentElement.clientWidth,height:$('.network-panel').height()});
        window.onresize = function (e) {
            console.log("window resize");
            networkPane.adjustBounds({x:0,y:0,width:document.documentElement.clientWidth,height:$('.network-panel').height()});
            networkPane.invalidate();
        };
    };
    /**
     * 当sysgraph执行提交后刷新osnr界面,由于box初始化时twaver会出问题，所以无法直接刷新box，只能等到切换iframe时才能进行刷新box
     */
    var refreshOsnrGraph=function () {
        parent.changeFlag=1;
        parent.window.sessionStorage.setItem("refreshFlag","1");
        parent.window.sessionStorage.setItem("refreshCircle",circleDisplay.getCircleId());
    };
    /**
     * 资源提交
     * @param submitClass
     */
    var submitData=function(submitClass){

        /**
         * 整理数据
         * @type {*}
         */
        var data=$(submitClass).parents('.modal').find('form').serializeArray();
        console.dir(data);
        var url,type,appendData={};
        if($(submitClass).hasClass("btn-node")){
            url=DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.netElements+parent.versionId;
            type="node";
        }
        else{
            url=DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.links+parent.versionId;
            appendData=getAppendData();
            type="link";
        }
        /**
         * 提交
         */
        if($(submitClass).hasClass("btn-edit-submit")){
            ajaxUtil.submitResource(url+"/"+data[0].value,data,"patch",appendData)
                .then(function (result) {
                    if(type=="node"){
                        ajaxUtil.submitResource(DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.disk+parent.versionId+"/"
                            +result.netElementId+"/"+$("#modal_node [name='diskId']").val()
                            ,data,"patch",{slotId:1, diskName:result.netElementName+"1盘1槽"}).then(
                            function () {
                                circleDisplay.changeCircleGraph(circleDisplay.getCircleId()).then(function () {
                                    refreshOsnrGraph();
                                    parent.modalLocator.showSuccessMsg("修改成功");
                                })

                            });
                    }
                    else {
                        circleDisplay.changeCircleGraph(circleDisplay.getCircleId()).then(function () {
                            refreshOsnrGraph();
                            parent.modalLocator.showSuccessMsg("修改成功");
                        })

                    }

                })
                .catch(function(err){
                    if(err.responseText!=""||undefined)
                        parent.modalLocator.showErrMsg(err.responseText);
                    else
                        console.dir(err.responseText);
                })
        }
        else if($(submitClass).hasClass("btn-add-submit")){
            ajaxUtil.submitResource(url,data,"post",appendData)
                .then(function (ElementData) {
                    refreshOsnrGraph();
                    /**
                     * 新增站点情况，发送两次同步请求，新增设备与机盘，
                     * 拓扑图只保留设备信息
                     */
                    if(type=="node"){
                        //新增机盘（放大器）
                        ajaxUtil.submitResource(DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.disk+parent.versionId+"/"+ElementData.netElementId
                            ,data,"post",{slotId:1, diskName:ElementData.netElementName+"1盘1槽"}).then(
                        function (diskData) {
                            var newNode=graphUtil.createNode(ElementData);
                            box.add(newNode);
                            parent.modalLocator.showSuccessMsg();
                        });
                    }
                    else{
                        parent.modalLocator.showSuccessMsg();
                        box.add(graphUtil.createLink(ElementData,box));
                    }
                })
                .catch(function(err){
                    console.dir(err);
                    parent.modalLocator.showErrMsg(err.responseText);
                })
        }
        $(submitClass).parents('.modal').modal('toggle');


    };
    /**
     * 版本保存
     */
    var saveVersion=function () {
        new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.version+"save/"+parent.versionId,undefined,"patch").then(function () {
            parent.modalLocator.showSuccessMsg("保存成功");
        },
        function (msg) {
            parent.modalLocator.showErrMsg(msg.responseText);
        });

    };
    var getAppendData=function () {
        var apd={};
        apd.endAName= AequipList.find("option:selected").text();
        apd.endAId=AequipList.val();
        apd.endZName= ZequipList.find("option:selected").text();
        apd.endZId=ZequipList.val();
        return apd;
    };
    /**
     * 资源删除
     */
    var deleteElement=function (element) {

        parent.modalLocator.showConfirmMsg("删除","确定要删除记录吗",function () {
            if(element instanceof twaver.Node)
                new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.netElements+parent.versionId,[element.getClient('netElementId')],"delete");
            else
                new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.links+parent.versionId,[element.getClient('linkId')],"delete");
            box.remove(element);
            parent.modalLocator.showSuccessMsg();
        });



    };
    /**
     * 弹出机盘管理界面
     * @param element
     */
    var manageDisk=function (element) {
        console.dir(element);

        var next={
            frameContainer:$("#content_wrapper",window.parent.document),
            tabTitle:'机盘管理',
            tabUrl:'disk'+"?elementId="+element.getClient("netElementId"),
        };
        //请务必放在末尾执行
        parent.tabNavigator.addTab(next);
    };

    /**
     * 资源修改
     * @param element
     */
    var modElement=function (element) {

        /**
         * 修改站点操作
         * 获取机盘信息->初始化机盘、放大器列表->适配数据
         *
         */
        if(element instanceof twaver.Node){
            $("#modal_node input").val("");
            new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.disk+parent.versionId+"/"+element._clientMap.netElementId)
                .then(
                    function (diskListData) {
                        if(diskListData.length>1)
                            console.log("现在是多机盘状态，你应该改代码了hhhhh");
                        else{
                            Promise.all([selectAdapter.initDisk(),selectAdapter.initAmp(diskListData[0].diskType)]).then(function () {
                                var tpData=$.extend({},element._clientMap,diskListData[0]);
                                console.dir(tpData);
                                formUtil.fillJsonToForm($('#modal_node'),tpData);
                                $('.btn-node').addClass('btn-edit-submit').removeClass('"btn-add-submit');
                                $('#modal_node').modal('show');
                            });
                        }
                    }
                )
                .catch(function (e) {
                    parent.modalLocator.showErrMsg(e.responseText);
                })
        }
        else{
            getEquipList(function (data) {
                new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.linkTypes+parent.versionId)
                    .then(function (typeData) {
                        $('select[name="linkType"]')[0].options.length=0;
                        AequipList[0].options.length=0;
                        ZequipList[0].options.length=0;
                        $.each(data,function(index,ele){
                            AequipList[0].options.add(new Option(ele.netElementName,ele.netElementId));
                            ZequipList[0].options.add(new Option(ele.netElementName,ele.netElementId));
                        });
                        $.each(typeData,function(index,ele){
                            $('select[name="linkType"]')[0].options.add(new Option(ele.linkType,ele.linkType));
                        });
                        formUtil.fillJsonToForm($('#modal_link'),element._clientMap);
                        console.log(element.getClient("endAName"));
                        $('#AendList').val(element.getClient("endAId"));
                        $('#ZendList').val(element.getClient("endZId"));
                        $('.btn-link').addClass('btn-edit-submit').removeClass('"btn-add-submit');
                        $('#ZendList,#AendList').attr("disabled","disabled");
                        $('#modal_link').modal('show');
                });

            });
        }
    };
    var getEquipList=function(callback){
        return new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+"netElements/"+parent.versionId).then(
            function (data) {
                if(callback)
                    callback(data);
            },function (errmsg) {

            });
    };
    /**
     *  检查network内元素所有位置是否与原来一致，若不一致则发送修改
     */
    var saveNetworkPos=function () {
        var changeList=[];
        box.forEach(function(item){
            if(item instanceof twaver.Node ){
                if(item._location.x!=item.getClient('coordinateX')||item._location.y!=item.getClient('coordinateY')){
                    item._clientMap.coordinateX=item._location.x;
                    item._clientMap.coordinateY=item._location.y;
                    changeList.push(ajaxUtil.newAsyncAjaxRequest(
                        DEFAULT_OPTIONS.DB_Interface + DEFAULT_OPTIONS.Prefix.netElements + parent.versionId+"/"+item.getClient('netElementId'),
                        item._clientMap,
                        "patch"
                    ))
                }
            }
        });
        return Promise.all(changeList);
    };
    
    var initDomElements=function () {
        circleDisplay.init();
        $("#refreshGraph").on('click', function () {
            elementWithColor = false;
            initData();
        });
        //添加站点
        $("#otm1").on("dragstart",function(ev){
            ev.originalEvent.dataTransfer.setData("text",ev.target.id);
        });
        $(".network-panel").on('drop',function (ev) {
            ev.stopPropagation();
            ev.preventDefault();
            /**
             *   拖放特定元素才执行逻辑
             */
            if(ev.originalEvent.dataTransfer.getData("text")=="otm1"){
                var point = network.getLogicalPoint(ev);
                console.log(point.x, point.y,"point!");
                $("#modal_node").find("input,select").val("");
                $('.btn-node').addClass('btn-add-submit').removeClass('btn-edit-submit');
                $('#modal_node').modal('show');
                selectAdapter.initDisk();
                $("input[name='coordinateX']").val(point.x);
                $("input[name='coordinateY']").val(point.y);
                $("input[name='circleId']")[0].value=circleDisplay.getCircleId();

            }
        }).on('dragover',function (ev) {
                ev.originalEvent.preventDefault();
        });

        $("#keyEquipButton").on('click', function () {
            keyEquipHandler();
        });

        $("#circuitRateButton").on('click', function () {
            circuitRateHandler();
        });

        $("#diameterButton").on("click", function () {
            networkDiameterHandler();
        });
        $("#btn_save").on("click",function () {
            saveNetworkPos().then(function () {
                console.log("???");
                saveVersion();
            },function (err) {
                parent.modalLocator.showErrMsg("保存修改时出现异常");
            });

        });

        $(".modal [name='diskType']").change(function () {
            selectAdapter.initAmp(  $(".modal [name='diskType']").val());
        });

        /**
         * 添加链路响应
         */
        $('#link_create').click(function () {
            networkPane.setBottom(null);
            networkPane.setLeft(null);

            var nodeList=[];
            var nodeCount=0;
            parent.modalLocator.showInfoMsg("请选择起始站点与终止站点");
            var graphListener=function(e){
                if(e.kind=="clickElement"&&e.element instanceof twaver.Node){
                    nodeCount++;
                    nodeList.push(network.getSelectionModel().getLastData());
                    if(nodeCount>=2){
                        network.removeInteractionListener(graphListener);
                        nodeCount=0;

                        getEquipList(function (data) {
                            new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface + DEFAULT_OPTIONS.Prefix.linkTypes + parent.versionId)
                                .then(function (typeData) {
                                    $('select[name="linkType"]')[0].options.length=0;
                                    AequipList[0].options.length=0;
                                    ZequipList[0].options.length=0;
                                    $.each(data,function(index,ele){
                                        AequipList[0].options.add(new Option(ele.netElementName,ele.netElementId));
                                        ZequipList[0].options.add(new Option(ele.netElementName,ele.netElementId));
                                    });
                                    $.each(typeData,function(index,ele){
                                        $('select[name="linkType"]')[0].options.add(new Option(ele.linkType,ele.linkType));
                                    });
                                    AequipList.val(nodeList[0].getClient("netElementId"));
                                    ZequipList.val(nodeList[1].getClient("netElementId"));



                                    $('#modal_link select').removeAttr("disabled");
                                    $('#modal_link input').val("");
                                    var circleId =  $('#CircleId');
                                    circleId.val(circleDisplay.getCircleId());

                                    $('#ZendList,#AendList').attr("disabled","disabled");
                                    $('#modal_link').modal('show');
                                    $('.btn-link').addClass('btn-add-submit').removeClass('btn-edit-submit');
                                });
                        });
                    }
                }
            };
            network.addInteractionListener(graphListener);
        });

        /**
         * 资源提交
         */
        $('.btn-submit').on('click',function () {
            var type;
            if($(this).hasClass("btn-node")) type='node';
            else type='link';
            formUtil.validateForm(type==='node'?'.modal-form1':'.modal-form').then(function(){
                submitData(type==='node'?'.btn-node':'.btn-link');
            },function(errData){
                parent.modalLocator.showErrMsg(errData.errMsg);
            })
        });
    };

    /**
     * 数据初始化
     */
    var initData=function () {
        circleDisplay.changeCircleGraph("全网");
    };

    /**
     * 页面元素响应逻辑初始化
     */
    var initView=function () {
        initNetwork();
        initDomElements();
    };

    return{
        init:function () {
            initData();
            initView();
        }
    };
}();






/**
 * 点击“关键点分析”触发事件
 */
function keyEquipHandler() {

    networkPane.setBottom(null);
    networkPane.setLeft(analyseResultPanel);
    networkPane.setLeftWidth(200);
    var analyse = window.NetworkAnalyse.CreateNew(network);
    var result = analyse.keyNode();
    var subGraphs = analyse.getSubGraphInfo();

    //AnalysePanel.KeyNode(result);
    analysePanelManager.KeyNode(result, subGraphs);
}


/**
 * 点击“成环率分析”触发事件
 */

function circuitRateHandler() {

    networkPane.setBottom(null);
    networkPane.setLeft(analyseResultPanel);
    networkPane.setLeftWidth(200);
    var analyse = window.NetworkAnalyse.CreateNew(network);
    var result = analyse.circuitRate();

    var dataList = network.getElementBox().getDatas();
    var count = 0;      // network中node的总数
    for (var i = 0; i < dataList.size(); i++) {
        if (dataList.get(i) instanceof twaver.Node)
            count++;
    }
    var rate = Math.round((count - result.length) / count * 10000) / 100.00 + "%";
    analysePanelManager.CircuitRate(result, rate);
}

/**
 * 点击“网络直径分析”触发事件
 */
function networkDiameterHandler() {
    networkPane.setBottom(null);
    networkPane.setLeft(analyseResultPanel);
    networkPane.setLeftWidth(200);
    var analyse = window.NetworkAnalyse.CreateNew(network);
    var result = analyse.diameter();

    analysePanelManager.Diameter(result);
}
