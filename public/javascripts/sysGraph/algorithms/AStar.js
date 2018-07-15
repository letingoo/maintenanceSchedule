/**
 * Created by zmc on 2017/9/7.
 * AStar算法进行寻路
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
     * 构造矩阵
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
     * 主体部分,
     * 暂定   from和to都是下标
     * @param from
     * @param to
     */
    this.go = function (from, to, g, h) {

        var matrix = buildMatrix(network);
        open = new Array();
        close = new Array();


        fArray = new Array(matrix.length);
        gArray = new Array(matrix.length);

        pathArray = new Map();


        gArray[from] = 0;
        fArray[from] = 0;

        open.push(from);

        var fromPath = new Array();
        fromPath.push(from);
        pathArray.set(from, fromPath);


        var canFindPath = false;        // 是否能找到路径
        while (open.length != 0) {


            var minIndex = getMinFNode();

            // 查找到终点
            if (minIndex == to) {
                canFindPath = true;
                break;
            }
            var node = minIndex;
            var nodeIndex = open.indexOf(node);
            open.splice(nodeIndex, 1);
            close.push(node);

            pathArray[from] = new Array();


            for (var i = 0; i < matrix.length; i++) {
                if (matrix[node][i] == 1 && close.indexOf(i) < 0) {

                    // 当 i 不在CLOSE列表中，添加 i 到OPEN中
                    if (open.indexOf(i) == -1) {
                        open.push(i);
                        gArray[i] = gArray[node] + g(i, node);
                        fArray[i] = gArray[i] + h(i, to);

                        var path = pathArray.get(node).slice();
                        path.push(i);
                        pathArray.set(i, path);
                    }


                    // 当 i 已在CLOSE列表中，更新g（n）
                    else if (open.indexOf(i) != -1) {
                        var newGValue = gArray[node] + g(i, node);
                        if (newGValue < gArray[i]) {
                            gArray[i] = newGValue;
                            fArray[i] = newGValue + h(i, to);

                            var path = pathArray.get(node).slice();
                            path.push(i);
                            pathArray.set(i, path);
                        }
                    }
                }
            }

        }

        if (canFindPath) {
            var pathValue = gArray[to];
            var pathArray = pathArray.get(to);

            var result = new NetworkPath(pathArray, pathValue);
            return result;
        }

        else {
            var result = new NetworkPath(new Array(), 0);
            return result;
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