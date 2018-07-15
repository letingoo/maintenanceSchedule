/**
 * Created by xf on 2017/11/7.
 *
 * 运维检修，为不可检修点寻找新路由
 * 为不可检修点影响的业务按照选定策略，最短路径或者负载均衡，
 * 寻找两条路由，用户选择一条更新插入businessRoute对象中。
 * @param busRoutes bussinessRoute存储运维检修业务数据
 * @param options  可选项，更新路由后拓扑图闪烁相关数据
 * @constructor
 */
function FindNewRoute(operator,options){
    var element;
    var busRoutes;
    //弹出框数据源
    var resultRoute={};
    //初始化 生成弹出框表格，添加点击事件
    var findNewInit=function(){
        //console.log("findNewRoute init!");
        busRoutes='busRoute' in operator? operator.busRoute:operator;

        var tableList=[];
        tableList.push({field:"busName",title:"业务名称"});
        tableList.push({field:"mainRoute",title:"路由一"});
        tableList.push({field:"spareRoute",title:"路由二"});
        tableList.push({field:"selectRoute",title:"选择路由",formatter:setSelect,events:{'change #selectOneRoute':onIndexChange},width:'120px'});
        tableUtil.createTable($('#newRouteList'),null,tableList,{showToolbar:false});

        $('input:radio[name="routeStrategy"]').unbind().change( function(){
            console.log("radio change!");
            loadData(resultRoute);
        });

        //更新路由信息点击事件
        $('.btn-updateRoute').unbind().click(function(){
            addBusRouteRecoverLog();
            updateRoute(busRoutes);
            $('#modal_newRoute').modal('hide');
            flashNewRoute(options.color);
            parent.modalLocator.showSuccessMsg('更新成功');
        });

    };

    /**
     *寻找新路由，显示模态框
     */
    this.showNewRoute= function(){
        element = network.getSelectionModel().getLastData();
        findRoute();
    };
    this.showNewRoute = function(ele){
        element = ele;
        findRoute();
    };


    /**
     * 不显示模态框直接生成新路由并切换
     * @returns {*}
     */
    this.switchRoute = function(ele){
        element = ele;
        resultRoute=newRoute(busRoutes);
        if(!('minDistance' in  resultRoute) || resultRoute['busRouteRes']['notFound'].length>0){
            return false;
        }
        loadData(resultRoute);
        addBusRouteRecoverLog();
        updateRoute(busRoutes);
        flashNewRoute(options.color);
        return true;
    };

    /**
     * 返回检修点需寻找新路由的各个业务路由寻找结果
     */

    this.busRouteFindRes = function (ele) {
        element = ele;
        resultRoute=newRoute(busRoutes);
        return resultRoute['busRouteRes'];
    };


    this.setOperatorAndBusRoutes = function (newOperator) {
        operator = newOperator;
        busRoutes='busRoute' in newOperator? newOperator.busRoute:operator;
    };

    var getBusRoutes = function () {
        return busRoutes;
    };

    var findRoute = function(){

        resultRoute=newRoute(busRoutes);

        if(!('minDistance' in  resultRoute)){
            parent.modalLocator.showErrMsg("不能找到新路由！");
            return;
        }
        if(resultRoute['busRouteRes']['notFound'].length > 0){
            parent.modalLocator.showErrMsg("未找到新路由！");
            return;
        }
        //  resultRoute=createTestData();
        loadData(resultRoute);
        $('#modal_newRoute').modal('show');
    };
    //更新路由前添加日志信息
    var addBusRouteRecoverLog=function(){
        // if (element === undefined)
        //     element = network.getSelectionModel().getLastData();

        var ee = getBusRoutes().getTopoEquip();
        var busAffected=busRoutes.getBusRouteByItem(getItemNameOrId(element,'id'));
        var busNeedNewRoute=getNeedNewRouteBus(busAffected)['needNewRoute'];
        var busLogList=[];
        for(var i=0;i<busNeedNewRoute.length;i++){
            var bus=busRoutes.getBusRouteById(busNeedNewRoute[i]);
            busLogList.push(bus);
        }
        //console.dir(busLogList);
        operator.Logger.recordRecoverLog(element,JSON.parse(JSON.stringify(busLogList)));
    };

    var flashNewRoute=function(color){
        //var element = network.getSelectionModel().getLastData();
        element.setClient('routeReco',true);
        operator.recordOperation(network);
        var diffList=operator.Logger.getDiffElements();
        //console.log(diffList.validList.length + diffList.invalidList.length + "  ");
        //$.flashUtil().flashOneNode(element,color.valid,true,true);
        // $.flashUtil().flashPath(diffList.validList,color.valid,true,true);
        // $.flashUtil().flashPath(diffList.invalidList,color.invalid,true,true);
    };
    /**
     *更新路由
     **/
    var updateRoute=function(busRoutes){
        var data=$('#newRouteList').bootstrapTable('getData');     //获取模态框表格数据
        for(var i=0;i<data.length;i++){
            var originRoute=busRoutes.getBusRouteById(data[i]['busId']+'');   //生成bussinessRoute对象
            var newRoute=JSON.parse(JSON.stringify(originRoute));
            newRoute['mainRoute']=data[i][data[i]['select']];
            newRoute['spareRoute']=null;
            //console.log("update route------");
            //console.dir(newRoute);
            busRoutes.updateBusRoute(newRoute);
        }
    };

    //为模态框表格添加数据
    var loadData=function(data){
        var selectedRadio=$('input:radio[name="routeStrategy"]:checked').val();
        if(selectedRadio==='minDistance'){
            //添加数据前先刷新数据，清除之前select选择路由的影响
            reFreshData(data['minDistance']);
            $('#newRouteList').bootstrapTable('load',data['minDistance']);
        }else if(selectedRadio==='loadBalance'){
            reFreshData(data['loadBalance']);
            $('#newRouteList').bootstrapTable('load',data['loadBalance']);
        }
        //console.log(selectedRadio+"--");
    };
    var reFreshData=function(routeData){
        for(var i=0;i<routeData.length;i++){
            routeData[i]['select']='mainRoute';
        }
    };

    var setSelect=function(value,row,index){
        var strHtml= "<select id='selectOneRoute' class='form-control' style='width: 100%'>" +
            "<option value='mainRoute' selected='selected'>路由一</option>" +
            "<option value='spareRoute'>路由二</option>" +
            "</select>";
        return strHtml;
    };
    //数据源每一列有一个不显示的'select'属性用来存储下拉框选中的值
    //更新数据的时候根据这个值选择使用生成的那个路由
    var onIndexChange=function(e,value,row,index){
        //console.log('selectIndexChange-------------------'+index);
        if(row['spareRoute']===''||row['spareRoute']===undefined){
            $('#selectOneRoute').val('mainRoute');
            parent.modalLocator.showErrMsg("路由二 为空");
            return;
        }
        row['select']=row['select']==='mainRoute'?'spareRoute':'mainRoute';
    };

    var newRoute= function(busRoutes){
        //var element = network.getSelectionModel().getLastData();
        //将寻找到新路由和不能找到新路由的业务分为两类然后返回
        //同时将不需要寻找新路由的业务放入found数组内，不能找到新路由的业务放入notfound数组内
        var routeRes = { found:[], notFound : [] };

        var nodeId = getItemNameOrId(element,'id');
        var busAffected=busRoutes.getBusRouteByItem(getItemNameOrId(element,'id'));
        /*
        经过此节点的业务可分为两类：这条业务不需要寻找新路由，这个业务需要寻找新路由（右分为找到和不能找到两种情况），
         */
        var busNeedNewRoute=getNeedNewRouteBus(busAffected)['needNewRoute'];
        var resultMinRoute=[];
        var resultBalanceRoute=[];
        for(var i=0;i<busNeedNewRoute.length;i++){
            var busid = busNeedNewRoute[i];
            var bus=busRoutes.getBusRouteById(busid);
           // console.log(busNeedNewRoute[i]+'-------');
            //判断一些这个节点是不是这个业务的起始或者终止点是的话略过
            if(busRoutes.isStartOrEndOfBusiness(busid, nodeId)){
                routeRes['notFound'].push({busId: busid});
                continue;
            }
            var busArr=bus.mainRoute.split('-');
            var fromNode=getElementByName(busArr[0]);
            var toNode=getElementByName(busArr[busArr.length-1]);
            var pathFinder= new FindPath(network);
            var newMinRoute=pathFinder.minDistanceNewRoute(fromNode,toNode,element);
            var newBalanceRoute=pathFinder.loadBalanceNewRoute(fromNode,toNode,busRoutes,element);
            try{
                var minRoute=convertRouteForm(newMinRoute,bus);
                var balanceRoute=convertRouteForm(newBalanceRoute,bus);

                routeRes['found'].push({busId: busid, route: minRoute['mainRoute']});
                resultMinRoute.push(minRoute);
                resultBalanceRoute.push(balanceRoute);
            }catch (err){
                routeRes['notFound'].push({busId: busid});
            }
        }

        try{
            isItemNeedNewRoute(element,busRoutes);
        }catch(err) {
            return {busRouteRes:routeRes};
        }
        return {minDistance:resultMinRoute,loadBalance:resultBalanceRoute, busRouteRes:routeRes};
    };


    var isItemNeedNewRoute=function(item,busRoutes){
        var isItemOk= busRoutes.isItemOK(getItemNameOrId(item,'id'));
        if(isItemOk==null||isItemOk==3){
            throw new Error("不能找到新路由！");
        }else if (isItemOk==0){
            throw new Error('设备可检修，无需寻找新路由! ');
        }
    };
    //前缀为'1#''11'的标识此点不可检修需要寻找新路由将它们筛选出来
    //将不需要寻找新路由的业务和不能找到新路由的业务分别放入数组中返回
    //
    var getNeedNewRouteBus= function(busAffected){
        var busArr={needNewRoute:[],  notNeed:[]};
        for(var i=0;i<busAffected.length;i++){
            var flag=busAffected[i].slice(0,2);
            var busId=busAffected[i].slice(2);
            if(flag==='1#'||flag==='11'){
                busArr['needNewRoute'].push(busId);
            }else {
                busArr['notNeed'].push(busId);
            }
        }
        return busArr;
    };

    var getItemNameOrId=function(item,nameType){
        if(nameType==='id'){
            return item instanceof twaver.Node?item.getClient('netElementId')+'':item.getClient('linkId')+'';
        }else if(nameType==='name'){
            return item instanceof twaver.Node?item.getClient('netElementName')+'':item.getClient('linkName')+'';
        }
    };
    //twaver 没有找到直接根据name属性获得特定网元的方法
    var getElementByName = function(name){
        var ele;
        network.getElementBox().forEachByLayer(function(item){
            if(item.getClient('netElementName')==name){
                ele=item;
            }
            if(item.getClient('linkName')==name){
                ele=item;
            }
        });
        return ele;
    };
    //转换找到的路由的格式，作为模态框表格的数据源
    var convertRouteForm=function(newRoute,bus){
        var mainRouteStr=convertRouteToStr(newRoute.getMainRoute());
        if (mainRouteStr===''){
            throw new Error('未找到路由');
        }
        var spareRouteStr=convertRouteToStr(newRoute.getBackupRoute());
        var route={busId:bus.bussinessId,busName:bus.bussinessName,mainRoute:mainRouteStr,spareRoute:spareRouteStr,select:'mainRoute'};
        return route;
    };

    var convertRouteToStr=function(route){
        var routeArray=route.getNodeArray();
        if(routeArray==null||routeArray.length==0){
            return '';
        }
        var routeStr=getItemNameOrId(routeArray[0],'name');
        for(var i=1;i<routeArray.length;i++){
            routeStr=routeStr+'-'+getItemNameOrId(routeArray[i],'name');
        }
        return routeStr;
    };

    var createTestData=function(){
        var jsonTest=[];
        jsonTest.push({busId:'',busName:'业务1',mainRoute:"route1",spareRoute:'',select:'mainRoute'});
        jsonTest.push({busId:'',busName:'业务2',mainRoute:"route2",spareRoute:'spareRoute1',select:'mainRoute'});
        jsonTest.push({busId:'',busName:'业务3',mainRoute:"route3",spareRoute:'spareRoute2',select:'mainRoute'});
        var jsonTest1=[];
        jsonTest1.push({busId:'',busName:'balanceBus1',mainRoute:"balanceRoute1",spareRoute:'balanceSpareRoute1',select:'mainRoute'});
        jsonTest1.push({busId:'',busName:'balanceBus2',mainRoute:"balanceRoute2",spareRoute:'balanceSpareRoute2',select:'mainRoute'});
        jsonTest1.push({busId:'',busName:'balanceBus3',mainRoute:"balanceRoute3",spareRoute:'balanceSpareRoute3',select:'mainRoute'});

        return {minDistance:jsonTest,loadBalance:jsonTest1};
    };







    findNewInit();
}



