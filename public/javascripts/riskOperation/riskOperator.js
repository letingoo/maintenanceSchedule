/**
 * Created by yzl on 2017/11/2.
 */


var riskOperator={
    createNew:function () {

        var busRoute=new BussinessRoute();

        var operator={
            Logger:new riskLogger(),
            Estimator:riskEstimator.createNew(busRoute)
        };
        operator.busRoute=busRoute;

        operator.operateStatus={
            invalid:-1,
            inCheck:-2,
            noBus:0,
            needSwitch:1,//需要选择路由
            directSwitch:2//该点运行在备用路由上，直接断开备用光通道即可
        };
        // operator.getCheckListStatus=function (elementList) {
        //     var resultList={affectList:[],breakList:[]};
        //     $.each(elementList){
        //         this.busRoute.getAffectedBusiness(element.getClient());
        //     }
        //
        // }
        operator.getOperateResult=function (elementList) {
            var result={
                "affectBus":busRoute.maintenanceAffectBusiness(elementList).length,
                "interruptBus":busRoute.maintenanceInterruptBusiness(elementList).length
            };
            return result;
        };


        /*
         *   获取受影响业务和中断业务并转换成Json
         *
         */
        operator.getDetailList=function (elementList) {
            var result ="[";
            var i;
            var max;
            var AffectBusiness=busRoute.maintenanceAffectBusiness(elementList);
            var InterruptBusiness=busRoute.maintenanceInterruptBusiness(elementList);
            max=busRoute.maintenanceAffectBusiness(elementList).length;
            try {
                for (i=0;i<max;i++){
                    if(InterruptBusiness[i])
                        result+='{"affectBus":"'+AffectBusiness[i].busName+'","interruptBus":"'+InterruptBusiness[i].busName+'"';
                    else
                        result+='{"affectBus":"'+AffectBusiness[i].busName+'","interruptBus":""';
                    if(i<max-1)
                        result+="},";
                    else
                        result+="}]";
                }
            }catch (err){

            }
            var resultjson=JSON.parse(result);
            return resultjson;
        };
        /**
         *
         * @param selectList
         * @param type 类型，select或process
         */
        operator.switchRoute=function (selectList,type) {
            $.each(selectList,function (index,route) {
                if(type=="select"){
                    route.mainRoute=route.spareRoute;
                    route.mainFrequency=route.spareFrequency;
                }
                route.spareRoute=null;
                route.spareFrequency=null;
                //console.dir(route);
                busRoute.updateBusRoute(route);
            });
            return selectList;
        };
        operator.getCheckReport=function () {
            return operator.Estimator.getCheckReport();
        };
        operator.recordRecoverLog=function (element,busList) {
            return operator.Logger.recordRecoverLog(element,busList)
        };
        /**
         * 获取选择条目
         * 若设备在业务条目中的主路由上，则放入selectlist
         * 若设备在备用路由上，则放入processlist
         * @param busList
         * @returns {{selectList: Array, processList: Array}}
         */
        function getSelectList(busList) {
            var resultList={
                selectList:[],
                processList:[]
            };
            $.each(busList,function (index,element) {
                if(element[0]=="1")
                    resultList.selectList.push(busRoute.getBusRouteById(element.slice(2)));
                else
                    resultList.processList.push(busRoute.getBusRouteById(element.slice(2)));
            });
            return resultList;
        }
        /**
         *检修单个网元
         * @param element
         * @returns {{status: string, data: *}}
         */
            operator.checkElementStatus=function (element) {
            var result={
                status:null,
                data:[]
            };
            var id=(element instanceof twaver.Node)?element.getClient("netElementId"):element.getClient("linkId");
            if(element.getClient("incheck"))
                result.status=operator.operateStatus.inCheck;
            else if(busRoute.isItemOK(id)>0)
                result.status=operator.operateStatus.invalid;
            //现在只有主备两条，可以直接切换
            else{
               var busList=busRoute.getBusRouteByItem(id);
                if(busList.length<=0)
                    result.status=operator.operateStatus.noBus;
                else{

                    var selectList=[];
                    result.data=( getSelectList(busList));
                    //如果选择列表为空，则直接返回可直接切换
                        result.status=(result.data.selectList.length>0)?operator.operateStatus.needSwitch:operator.operateStatus.directSwitch;
                }
            }
            return result;
        };

        /**
         * 调用logger记录一次检修之后的结果
         */
        operator.recordOperation=function (network) {
            operator.Logger.recordOperateList(operator.checkAllElements(network));
            //console.dir(operator.checkAllElements(network));
            var result=operator.Estimator.calculate_PRI_sum();
            operator.Logger.recordPriList(result.estimateLogSpec);
            operator.Logger.recordPri(result.pri_sum);
        };

        /**
         * 从logger中获取恢复记录并更新光通道记录
         * @param element
         */
        operator.recoverOperation=function (element) {
            var recoverResult=operator.Logger.recoverBusRoute(element,operator.busRoute);
            $.each(recoverResult.elementList,function (index,inCheckElement) {
                if(inCheckElement.getClient("incheck")){
                    inCheckElement.setClient("incheck",null);
                }else {
                    inCheckElement.setClient("routeReco",null);
                }
            });
        };

        /**
         * 直接将busRoute恢复到最开始状态
         * 同时将网元、链路的颜色、检修状态也复原
         * @param element
         */
        operator.recoverToInitialState = function (element) {
            operator.busRoute.recoverToInitialState();

            //把拓扑图恢复颜色
            var dataList = box.getDatas();
            for (var i = 0; i < dataList.size(); i++) {
                dataList.get(i).setStyle('inner.color', null);
                dataList.get(i).setClient("incheck", false);
            }
        }


        /**
         * 获取恢复记录
         */
        operator.getOperateList=function () {
            return operator.Logger.getRecoverLog().operateElementList;
        };

        /**
         * 全网检修，返回包含可检修和不可检修节点数组的对象
         * @param network
         * @returns {{validList: Array, invalidList: Array}}
         */
        operator.checkAllElements=function (network) {
            var result={
                validList:[],
                invalidList:[]
            };
            network.getElementBox().forEach(function (element) {
                if(!element.getClient("incheck")){
                    var id=(element instanceof twaver.Node)?element.getClient("netElementId"):element.getClient("linkId");
                    if (!busRoute.isItemOK(id))
                        result.validList.push(element);
                    else
                        result.invalidList.push(element);
                }
                else
                    console.dir(element);
            });

            return result;
        };
        
        return operator;


    }

};
