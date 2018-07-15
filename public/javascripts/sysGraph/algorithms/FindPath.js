/**
 * 寻路算法
 * @param network
 * @constructor
 */
function FindPath(network) {

    /**
     * 算法主体,使用Astar算法
     * from     Node类型
     * to       Node类型
     * g是函数，参数列表应该为g(from, to)  from和to都是Node类型  g(from, to)计算from到to的实际权值，在这里from到to是直接相连的
     * h是函数，参数列表应该为h(from, to)  from和to都是Node类型  h(from, to)计算from到to的预估权值
     * h(from, to)得到的预估值应该小于from到to的实际值
     * 对于g(from, to)和h(from, to)当from == to时应该返回0
     *
     *
     * 返回ResultRoute类型
     */
    var getTheRoute = function (from, to, g, h, businessRoute) {
        var astar = new AStar(network);
        var mainRoute = astar.go(from, to, g, h, businessRoute);      // 调用AStar算法,计算主路由


        // 计算备用路由
        var backupRoute = astar.findBackupRoute(from, to, g, h, mainRoute.getNodeArray(), businessRoute);

        var resultRoute = new ResultRoute(mainRoute, backupRoute);
        return resultRoute;
    };
    /**
     * 运维检修模块
     * 给经过不可检修点的业务寻找新路由，使不可检修点变为可检修点
     * 使用Astar算法，参数和getTheRoute函数类似
     */
    var getTheNewRoute=function(from, to, ele, g, h, businessRoute){
        var astar = new AStar(network);
        var mainRoute= astar.findNewRoute(from, to, ele, g, h, businessRoute);


        //计算备用路由
        var backupRoute = astar.findNewBackupRoute(from, to,ele, g, h,mainRoute.getNodeArray(), businessRoute);

        if (mainRoute.getNodeArray().length == 1) {
            var startNode = mainRoute.getNodeArray()[0];
            mainRoute.getNodeArray().push(startNode);
            backupRoute.setNodeArray( new Array() );

            var resoultRoute = new ResultRoute(mainRoute, backupRoute);
            return resoultRoute;
        }


        var resoultRoute = new ResultRoute(mainRoute, backupRoute);
        return resoultRoute;
    };

    /**
     *
     * 生成负载均衡策略的路由
     * （包含主备路由）
     * @param from
     * @param to
     * @param businessRoute
     */
    this.loadBalance = function (from, to, businessRoute) {
        return getTheRoute(from, to, gLoadBalance, hLoadBalance, businessRoute);
    };
    /**
     *运维检修负载均衡策略寻找新路由
     */
    this.loadBalanceNewRoute= function (from, to, businessRoute, ele){
        return getTheNewRoute(from, to, ele, gLoadBalance, hLoadBalance, businessRoute)
    };


    /**
     * 生成最短距离策略的路由
     * （包含主备路径）
     * @param from
     * @param to
     */
    this.minDistance = function (from, to) {
        return getTheRoute(from , to, gDistance, hDistance);
    };
    /**
     * 运维检修最短距离策略寻找新路由
     */
    this.minDistanceNewRoute= function (from ,to, ele){

        return getTheNewRoute(from, to, ele, gDistance, hDistance);
    };

    /**
     * 生成最小跳数策略的路由
     * （包含主备路径）
     * @param from
     * @param to
     */
    this.minHoop = function (from, to) {
        return getTheRoute(from, to, gHop, hHop);
    }




    /**
     * 负载均衡
     * 计算from到to之间的实际权值, 这里是计算from和to上承载业务数量之和
     * @param from      Node类型
     * @param to        Node类型
     * @param businessRoute
     */
    var gLoadBalance = function (from, to, businessRoute) {

        var fromBusNumber = businessRoute.busIdNeedChange(from.getClient('netElementId')+'').length;
        var toBusNumber = businessRoute.busIdNeedChange(to.getClient('netElementId')+'').length;

        return fromBusNumber + toBusNumber;
    }


    /**
     * 负载均衡
     * 计算from到to之间的预估权值
     * @param from      Node类型
     * @param to        Node类型
     * @param businessRoute
     */
    var hLoadBalance = function (from, to, businessRoute) {

        var fromBusNumber = businessRoute.busIdNeedChange(from.getClient('netElementId')+'').length;
        var toBusNumber = businessRoute.busIdNeedChange(to.getClient('netElementId')+'').length;

        return fromBusNumber + toBusNumber;
    }




    /**
     * 最小跳数
     * 计算from和to之间链路的实际权值
     * @param from      Node类型
     * @param to        Node类型
     */
    var gHop = function(from, to) {
        if (from == to)
            return 0;
        return 1;
    }


    /**
     * 最小跳数
     * 计算from到to之间链路的预估权值
     * @param from
     * @param to
     */
    var hHop = function(from, to) {
        if (from == to)
            return 0;
        return 1;
    }


    /**
     * 最小距离
     * 计算from到to之间链路的实际距离
     * @param from
     * @param to
     * @returns {number}
     */
    var gDistance = function(from, to) {
        if (from == to)
            return 0;

        var dataList = network.getElementBox().getDatas();
        for (var i = 0; i < dataList.size(); i++) {
            var dataItem = dataList.get(i);
            if (dataItem instanceof twaver.Link) {
                if (dataItem.getFromNode() == from && dataItem.getToNode() == to ||
                    dataItem.getFromNode() == to && dataItem.getToNode() == from) {
                    return dataItem.getClient("linkLength");
                }
            }
        }

        return 0;
    }


    /**
     * 最小距离
     * 计算from到to之间链路的预估权值
     * 预估方法是选择from节点和to节点所连链路的距离的最小值
     * @param from
     * @param to
     */
    var hDistance = function(from, to) {
        if (from == to)
            return 0;

        var dataList = network.getElementBox().getDatas();
        var minLinkLength = 80000;     // 设一个最大值


        for (var i = 0; i < dataList.size(); i++) {
            var dataItem = dataList.get(i);
            if (dataItem instanceof twaver.Link) {
                if (dataItem.getFromNode() == from || dataItem.getToNode() == from ||
                    dataItem.getFromNode() == to || dataItem.getToNode() == to) {
                    var linkLength = dataItem.getClient("linkLength");
                    minLinkLength = Math.min(linkLength, minLinkLength);
                }
            }
        }

        return minLinkLength;
    }

}


/**
 * AStar 算法
 * @param network
 * @constructor
 */
function AStar(network) {



    var fArray;         //  记录f（n）
    var gArray;         //  记录g（n）
    var pathArray;      //  记录路径


    var open;
    var close;

    var init = function () {

    };


    /**
     * 从Network构造矩阵
     * @param netwok
     */
    var buildMatrix = function (netwok) {
        var nodeArray = new Array();
        var linkArray = new Array();


        var dataList = network.getElementBox().getDatas();
        for (var i = 0; i < dataList.size(); i++) {

            var dataItem = dataList.get(i);

            if (dataItem instanceof twaver.Node) {
                dataItem.setClient("the_index", nodeArray.length);
                nodeArray.push(dataItem);
            }

            else if (dataItem instanceof twaver.Link){
                linkArray.push(dataItem);
            }
        }



        var matrix  = new Array(nodeArray.length);
        for (var i = 0; i < matrix.length; i++) {
            matrix[i] = new Array(nodeArray.length);

            for (var j = 0; j < matrix.length; j++) {
                matrix[i][j] = 0;
            }
        }


        for (var i in linkArray) {

            var link = linkArray[i];
            var node1 = link.getFromNode();
            var node2 = link.getToNode();


            var index1 = node1.getClient("the_index");
            var index2 = node2.getClient("the_index");

            matrix[index1][index2] = 1;
            matrix[index2][index1] = 1;
        }

        return matrix;

    };


    /**
     * 构造Node数组
     * @param network
     */
    var buildNodeList = function (network) {

        var nodeList = new Array();
        var dataList = network.getElementBox().getDatas();

        for (var i = 0; i < dataList.size(); i++) {
            var dataItem = dataList.get(i);
            if (dataItem instanceof twaver.Node) {
                nodeList.push(dataItem);
            }
        }

        return nodeList;
    };


    /**
     * 主体部分,
     * from和to都是Node类型
     * g和h是函数，g是实际权值，h是预估权值
     * @param from
     * @param to
     */
    this.go = function (from, to, g, h, businessRoute) {

        var matrix = buildMatrix(network);
        var nodeList = buildNodeList(network);

        return mainPart(from, to, g, h, matrix, nodeList, businessRoute);

    };
    /**
     * 不可检修点业务寻找新路由
     */
    this.findNewRoute= function(from, to, ele, g, h, businessRoute){
        var matrix = buildMatrix(network);
        var nodes = buildNodeList(network);
        //将不可检修点断开
        separateSelectedEle(matrix, ele);
        return mainPart(from, to, g, h, matrix, nodes, businessRoute);
    };
    /**
     * 不可检修点业务寻找新备用路由
     */
    this.findNewBackupRoute= function(from, to, ele, g, h, mainRoute, businessRoute){
        var matrix= buildMatrix(network);
        var nodes = buildNodeList(network);

        //将主用路由断开以便寻找新路由
        separateMainRoute(mainRoute,matrix);
        //将不可检修点断开
        separateSelectedEle(matrix, ele);
        return mainPart(from, to, g, h, matrix, nodes, businessRoute);
    };
    //将不可检修点断开
    var separateSelectedEle= function (matrix, ele){
        //var selectedEle= network.getSelectionModel().getLastData();
        var selectedEle = ele;
        if (selectedEle instanceof twaver.Node){
            var index=selectedEle.getClient("the_index");
            for(var i=0;i<matrix.length;i++){
                matrix[index][i]=0;
                matrix[i][index]=0;
            }
        }else if (selectedEle instanceof twaver.Link){
            var indexA= selectedEle.getFromNode().getClient("the_index");
            var indexZ= selectedEle.getToNode().getClient("the_index");
            matrix[indexA][indexZ]=0;
            matrix[indexZ][indexA]=0;
        }
    };


    /**
     * 算法主体部分
     */
    var mainPart = function (from, to, g, h, matrix, nodeList, businessRoute) {
        open = new Array();
        close = new Array();


        fArray = new Array(matrix.length);
        gArray = new Array(matrix.length);

        pathArray = new Map();

        var fromIndex = from.getClient("the_index");
        var toIndex = to.getClient("the_index");
        gArray[fromIndex] = 0;
        fArray[fromIndex] = 0;

        open.push(fromIndex);

        var fromPath = new Array();
        fromPath.push(fromIndex);
        pathArray.set(fromIndex, fromPath);


        var canFindPath = false;        // 是否能找到路径
        while (open.length != 0) {
            var minIndex = getMinFNode();

            // 查找到终点
            if (minIndex == toIndex) {
                canFindPath = true;
                break;
            }
            var node = minIndex;
            var nodeIndex = open.indexOf(node);
            open.splice(nodeIndex, 1);
            close.push(node);

            pathArray[fromIndex] = new Array();


            for (var i = 0; i < matrix.length; i++) {
                if (matrix[node][i] == 1 && close.indexOf(i) < 0) {


                    // 当 i 不在CLOSE列表中，添加 i 到OPEN中
                    if (open.indexOf(i) == -1) {
                        open.push(i);

                        gArray[i] = gArray[node] + g(nodeList[i], nodeList[node], businessRoute);
                        fArray[i] = gArray[i] + h(nodeList[i], nodeList[toIndex], businessRoute);

                        var path = pathArray.get(node).slice();
                        path.push(i);
                        pathArray.set(i, path);
                    }


                    // 当 i 已在CLOSE列表中，更新g（n）
                    else if (open.indexOf(i) != -1) {

                        var newGValue = gArray[node] + g(nodeList[i], nodeList[node], businessRoute);
                        if (newGValue < gArray[i]) {
                            gArray[i] = newGValue;
                            fArray[i] = newGValue + h(nodeList[i], nodeList[toIndex], businessRoute);

                            var path = pathArray.get(node).slice();
                            path.push(i);
                            pathArray.set(i, path);
                        }
                    }
                }
            }

        }


        // from到to存在路径
        if (canFindPath) {
            var pathValue = gArray[toIndex];
            var pathArray = pathArray.get(toIndex);

            var realNodeArray = new Array();
            for (var i = 0; i < pathArray.length; i++) {
                realNodeArray.push( nodeList[pathArray[i]] );
            }

            var result = new ResultPath(realNodeArray, pathValue);
            return result;
        }


        // from到to不通
        else {
            var result = new ResultPath(new Array(), 0);
            return result;
        }
    }


    /**
     * 寻找备用路由
     */
    this.findBackupRoute = function (from, to, g, h, mainRoute, businessRoute) {

        var matrix = buildMatrix(network);
        var nodeList = buildNodeList(network);
        // 把主路由上全部断开
        separateMainRoute(mainRoute, matrix);
        return mainPart(from, to, g, h, matrix, nodeList, businessRoute);
    };
    var separateMainRoute= function(mainRoute, matrix){
        // 把主路由上全部断开
        for (var i = 0; i < mainRoute.length - 1; i++) {
            var node1Index = mainRoute[i].getClient("the_index");
            var node2Index = mainRoute[i + 1].getClient("the_index");

            matrix[node1Index][node2Index] = 0;
            matrix[node2Index][node1Index] = 0;
        }
    };




    // 获取最小的f值的下标
    var getMinFNode = function () {


        var min = fArray[open[0]];
        var minIndex = open[0];
        for (var i = 1; i < open.length; i++) {
            var index = open[i];
            if (fArray[index] < min) {
                min = fArray[index];
                minIndex = index;;
            }
        }

        return minIndex;
    };


    init();

}


/**
 * 寻路返回的路径信息，经过的节点和总路径的权值之和
 * @param nodeArray_
 * @param pathValue_
 * @constructor
 */
function ResultPath(nodeArray_, pathValue_) {

    var nodeArray;      // 路径经过的节点
    var pathValue;      // 路径上的权值之和


    var init = function () {
        nodeArray = nodeArray_;
        pathValue = pathValue_;
    }


    this.getNodeArray = function () {
        return nodeArray;
    }


    this.getPathValue = function () {
        return pathValue;
    }


    this.setNodeArray = function (newNodeArray) {
        nodeArray = newNodeArray;
    }

    init();
}


/**
 * 路径规划的结果
 * 主路由和备用路由
 * 主路由和备用路由都是ResultPath类型
 * @param mainRoute
 * @param backupRoute
 * @constructor
 */
function ResultRoute(mainRoute_, backupRoute_) {

    var mainRoute, backupRoute;

    var init = function () {
        mainRoute = mainRoute_;
        backupRoute = backupRoute_;
    }


    this.getMainRoute = function () {
        return mainRoute;
    }


    this.getBackupRoute = function () {
        return backupRoute;
    }


    init();
}