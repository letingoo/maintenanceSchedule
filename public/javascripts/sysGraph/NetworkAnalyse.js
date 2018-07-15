/**
 * Created by zmc on 2017/9/3.
 * 对twaver.Network进行分析，分析其  成环率、关键点、未成环设备
 * commonjs form
 */

var divideGraphImport=require('./algorithms/DivideGraph');
var floyedImport=require('./algorithms/Floyed');
var keyNodeImport=require('./algorithms/KeyNode');
var circuitRateImport=require('./algorithms/CircuitRate');


window.NetworkAnalyse = {
    CreateNew: function (net) {
        var analyse = {};

        var nodeArray = new Array();        // 设备数组
        var linkArray = new Array();        // 复用段数组
        var infoArray = new Array();        // 邻接矩阵


        var network;

        var subGraphs2 = new Array();
        var subGraphStr;

        network = net;


        var dataList = network.getElementBox().getDatas();

        for (var i = 0; i < dataList.size(); i++) {

            var dataItem = dataList.get(i);

            if (dataItem instanceof twaver.Node) {
                dataItem.setClient("the_index", nodeArray.length);
                nodeArray.push(dataItem);
            }

            else if (dataItem instanceof twaver.Link) {
                linkArray.push(dataItem);
            }
        }

        infoArray = new Array(nodeArray.length);
        for (var i = 0; i < infoArray.length; i++) {
            infoArray[i] = new Array(nodeArray.length);

            for (var j = 0; j < infoArray.length; j++) {
                infoArray[i][j] = 0;
            }
        }


        for (var i in linkArray) {

            var link = linkArray[i];
            var node1 = link.getFromNode();
            var node2 = link.getToNode();


            var index1 = node1.getClient("the_index");
            var index2 = node2.getClient("the_index");

            infoArray[index1][index2] = 1;
            infoArray[index2][index1] = 1;
        }

        /**
         * 求关键点
         * @returns {Array}
         */
        analyse.keyNode = function () {
            var keyPoints = new Array();
            divide();
            subGraphStr = new Array();

            for (var i = 0; i < subGraphs2.length; i++) {
                var sub = subGraphs2[i];
                var subMatrix = buildSubMatrix(sub);

                var keyNode = new keyNodeImport.dg(subMatrix, sub);
                var tempResult = keyNode.go();
                var subGraph_temp = keyNode.getSubGraphsStr();

                for (var j = 0; j < tempResult.length; j++) {
                    keyPoints.push(sub[tempResult[j]]);
                    subGraphStr.push( subGraph_temp[j] );
                }
            }


            var result = new Array();
            for (var i = 0; i < keyPoints.length; i++) {
                result.push(nodeArray[keyPoints[i]]);
            }
            return result;
        };

        analyse.getSubGraphInfo = function () {
            return subGraphStr;
        };

        analyse.diameter = function () {
            divide();

            var pathArray = new Array();

            var maxLength = 0;

            // 对每个子图进行分析
            for (var i = 0; i < subGraphs2.length; i++) {
                var sub = subGraphs2[i];

                var subMatrix = buildSubMatrix(sub);

                var floyedAl = new floyedImport.dg(subMatrix);
                var resultPath = floyedAl.minPath();

                if (resultPath == undefined || resultPath.length == 0)
                    continue;
                if (resultPath[0].length > maxLength) {
                    pathArray = new Array();
                    maxLength = resultPath[0].length;
                    for (var s = 0; s < resultPath.length; s++) {
                        for (var t = 0; t < resultPath[0].length; t++) {
                            var tmp = resultPath[s][t];
                            resultPath[s][t] = sub[tmp];
                        }
                    }

                    for (var s = 0; s < resultPath.length; s++) {
                        pathArray.push(resultPath[s]);
                    }
                }

                else if (resultPath[0].length == maxLength) {
                    for (var s = 0; s < resultPath.length; s++) {
                        for (var t = 0; t < resultPath[0].length; t++) {
                            var tmp = resultPath[s][t];
                            resultPath[s][t] = sub[tmp];
                        }
                    }

                    for (var s = 0; s < resultPath.length; s++) {
                        pathArray.push(resultPath[s]);
                    }
                }
            }


            var result = new Array();
            for (var i = 0; i < pathArray.length; i++) {

                var path = pathArray[i];
                var tempArray = new Array();
                for (var j = 0; j < path.length; j++) {
                    tempArray.push(nodeArray[path[j]]);
                }
                var netPath = new NetworkPath(tempArray);
                //alert(netPath.getPathLength());
                result.push(netPath);
            }


            return result;
        };


        /**
         * 求未成环节点
         * @returns {Array}
         */
        analyse.circuitRate = function () {

            divide();

            var weiChengHuanList = new Array();         // 未成环节点的列表


            // 对每个联通的子图进行求未成环设备
            for (var i = 0; i < subGraphs2.length; i++) {
                var sub = subGraphs2[i];
                var subMatrix = buildSubMatrix(sub);

                var circuitRate = new circuitRateImport.dg(subMatrix);
                var result = circuitRate.calculateRate();

                for (var j = 0; j < result.length; j++) {
                    weiChengHuanList.push(sub[result[j]]);
                }
            }


            var result = new Array();
            for (var i = 0; i < weiChengHuanList.length; i++) {
                result.push(nodeArray[weiChengHuanList[i]]);
            }

            return result;
        };


        /**
         * 划分子图
         */
        var divide = function () {

            var di = new divideGraphImport.dg();
            di.readData(infoArray, nodeArray);
            subGraphs2 = di.divide();
        };


        /**
         * 对子图构建对应的邻接矩阵
         * @param subArr
         * @returns {Array}
         */
        var buildSubMatrix = function (subArr) {
            var matrix = new Array(subArr.length);

            for (var i = 0; i < subArr.length; i++) {
                matrix[i] = new Array(subArr.length);
                for (var j = 0; j < subArr.length; j++)
                    matrix[i][j] = 0;
            }


            for (var i = 0; i < subArr.length; i++) {
                var real_i = subArr[i];
                for (var j = 0; j < subArr.length; j++) {
                    var real_j = subArr[j];
                    matrix[i][j] = infoArray[real_i][real_j];
                }
            }

            return matrix;

        };


        return analyse;
    }
}



/**
 * 求网络直径返回的结果
 * @param nodeArray
 * @constructor
 */
function NetworkPath(nodeArray) {

    var nodeList = new Array();
    var pathLength = 0;

    var init = function () {
        nodeList = nodeArray;
        pathLength = nodeArray.length - 1;
    };


    this.getNodeList = function () {
        return nodeList;
    }


    this.getPathLength = function () {
        return  pathLength;
    }


    init();
}

