/**
 * Created by yzl on 2017/11/2.
 */
function riskLogger() {
    var operateList={
        oldPri:undefined,
        newPri:undefined,
        oldList:undefined,
        oldPriList:undefined,
        newPriList:undefined,
        newList:undefined
    };
    var recoverLog={
        operateElementList:[],
        busList:[],
    }
    this.recordRecoverLog=function (element,buslist) {
        recoverLog.busList.push(buslist);
        recoverLog.operateElementList.push(element);
        //console.log("recoverlog:");
        //console.dir(recoverLog);
    }
    this.recordPriList=function (dataList) {

        operateList.oldPriList=operateList.newPriList;
        operateList.newPriList=dataList;
    };
    this.recordPri=function (data) {
        operateList.oldPri=operateList.newPri;
        operateList.newPri=data;
    }
    this.recordOperateList=function (dataList) {
        operateList.oldList=operateList.newList;
        operateList.newList=dataList;
    };
    this.getRecoverLog=function () {
        return recoverLog;
    };
    /**
     * 恢复busroute到指定节点检修之前的状态,并返回一个包含所恢复的检修节点的list
     * @param recoverElement
     * @param busRoute
     */
    this.recoverBusRoute=function (recoverElement,busRoute) {
        var result={
            elementList:[]
        };
        while(recoverLog.operateElementList.length>0){
            var element=recoverLog.operateElementList.pop();
            result.elementList.push(element);
            var busLog=recoverLog.busList.pop();
            $.each(busLog,function (index,singleBusLog) {
                busRoute.updateBusRoute(singleBusLog);
            });


            if(element===recoverElement)
                break;
        }
        return result;
    };

    this.integrateFormData=function () {
        if(operateList.oldPriList&&operateList.newPriList){
            var result= {
                priList: [],
                priSum: [{
                    prePriSum:operateList.oldPri,
                    curPriSum:operateList.newPri
                }]
            };
            for(var i=0;i<operateList.oldPriList.length;i++){
                var singleFormData={};
                singleFormData.bussinessName=operateList.oldPriList[i].bussinessName;
                singleFormData.mainPreRoute=operateList.oldPriList[i].mainRoute;
                singleFormData.sparePreRoute=operateList.oldPriList[i].spareRoute;
                singleFormData.prePri=operateList.oldPriList[i].pri;
                var match=operateList.newPriList.filter(function (element) {
                    if(element.bussinessName==operateList.oldPriList[i].bussinessName)
                        return true;
                });
                if(match.length>0){
                    singleFormData.mainCurRoute=match[0].mainRoute;
                    singleFormData.spareCurRoute=match[0].spareRoute;
                    singleFormData.curPri=match[0].pri;
                }
                else{
                    singleFormData.mainCurRoute="业务中断";
                    singleFormData.spareCurRoute="业务中断";
                    singleFormData.curPri="业务中断";
                }
                // singleFormData.mainCurRoute=operateList.newPriList[i].mainRoute;
                // singleFormData.spareCurRoute=operateList.newPriList[i].spareRoute;
                // singleFormData.curPri=operateList.newPriList[i].pri;
                result.priList.push(singleFormData);
            }
        }
        return result;
    }
    /**
     *
     * @returns {{validList: Array, invalidList: Array}}
     */
    this.getDiffElements=function () {
        var resultList={
            validList:[],
            invalidList:[]
        }
        if(operateList.oldList&&operateList.newList){
            resultList.validList=compareList(operateList.newList.validList,operateList.oldList.validList);
            resultList.invalidList=compareList(operateList.newList.invalidList,operateList.oldList.invalidList);
        }
        return resultList;
        
    };


    function compareList(newList,oldList) {
        var resultList=[];
        $.each(newList, function (index, newElement) {
            var flag = true;
            $.each(oldList, function (index, oldElement) {
                if (newElement === oldElement) {
                    flag = false;
                   return flag;
                }
            });
            if (flag){
                resultList.push(newElement);
            }
        });
        return resultList;


    }

}
