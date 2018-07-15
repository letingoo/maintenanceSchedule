/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 4);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

/**
 * Created by zmc on 2017/9/6.
 *
 * 计算一个连通图的未成环节点
 */


function CircuitRate(matrix) {

    var infoArray;       // 邻接矩阵
    var du;              // 记录每个定点的度


    /**
     * 初始化
     */
    var init = function () {

        infoArray = new Array(matrix.length);
        du = new Array(matrix.length);

        for (var i = 0; i < matrix.length; i++) {
            infoArray[i] = new Array(matrix.length);
            for (var j = 0; j < matrix.length; j++) {
                infoArray[i][j] = matrix[i][j];
            }
        }

        for (var i = 0; i < infoArray.length; i++) {
            var sum = 0;
            for (var j = 0; j < infoArray.length; j++) {
                if (infoArray[i][j] == 1)
                    sum++;
            }
            du[i] = sum;
        }
        
    };
    

    var weiChengHuan;           // 未成环的节点


    /**
     * 求未成环节点的主体
     * 返回未成环节点的下标
     * @returns {Array}
     */
    this.calculateRate = function () {

        weiChengHuan = new Array();
        while (true) {

            var waitForDelete = new Array();

            for (var i = 0; i < du.length; i++) {

                if (du[i] == -1)
                    continue;

                else if (du[i] == 0) {
                    weiChengHuan.push(i);
                    du[i] = -1;
                }

                else if (du[i] == 1) {
                    waitForDelete.push(i);
                }

            }

            if (waitForDelete.length == 0)
                return weiChengHuan;

            for (var s = 0; s < waitForDelete.length; s++) {
                var element = waitForDelete[s];

                // 删掉element相连的所有边
                for (var i = 0; i < infoArray.length; i++) {
                    if (infoArray[element][i] == 1) {
                        infoArray[element][i] = 0;
                        infoArray[i][element] = 0;

                        du[i]--;
                    }
                }

                du[element] = 0;
            }

        }
    };
    

    
    
    init();
}

module.exports={
  dg:CircuitRate
};

/***/ }),
/* 1 */
/***/ (function(module, exports) {

/**
 * Created by zmc on 2017/9/4.
 * 将一个图划分成若个联通子图
 */


function DivideGraph() {


    var infoArray;          // 邻接矩阵
    var nodeArray;


    // 0 代表未访问，1代表已访问
    var visited;


    var subGraphs = new Array();            // 子图的结果


    /**
     * 初始化
     * @param matrix
     * @param nodeList
     */
    this.readData = function (matrix, nodeList) {

        nodeArray = nodeList;

        infoArray = new Array(matrix.length);

        for (var i = 0; i < matrix.length; i++) {

            infoArray[i] = new Array(matrix.length);
            for (var j = 0; j < matrix.length; j++) {
                infoArray[i][j] = matrix[i][j];
            }
        }


        visited = new Array(nodeList.length);
        for (var i = 0; i < matrix.length; i++)
            visited[i] = 0;

    };


    /**
     * 划分子网主体部分
     * @returns {Array}
     */
    this.divide = function () {

        for (var i = 0; i < infoArray.length; i++) {

            if (visited[i] == 0) {
                var graph = new Array();
                newGraph = graph;
                subGraphs.push(graph);

                dfs(i);
            }
        }

        return subGraphs;
    };


    var newGraph;


    /**
     * 深度优先遍历
     * @param index
     */
    var dfs = function (index) {

        newGraph.push(index);
        visited[index] = 1;

        for (var i = 0; i < nodeArray.length; i++) {
            if (infoArray[index][i] == 1 && visited[i] == 0)
                dfs(i);
        }
    }

}
module.exports={
    dg:DivideGraph
};


/***/ }),
/* 2 */
/***/ (function(module, exports) {

/**
 * Created by zmc on 2017/9/5.
 * Floyed算法，求网络直径
 */



function Floyed(matrix) {

    var INF = 1000;

    var infoArray;
    var path;


    /**
     * 构造函数
     */
    var init = function () {

        console.log(matrix);
        infoArray = new Array(matrix.length);
        path = new Array(matrix.length);
        for (var i = 0; i < infoArray.length; i++) {
            infoArray[i] = new Array(infoArray.length);
            for (var j = 0; j < infoArray.length; j++)
                if (i == j)
                    infoArray[i][j] = 0;
                else if (matrix[i][j] == 0)
                    infoArray[i][j] = INF;
                else
                    infoArray[i][j] = 1;
        }

        console.log("H");
        console.dir(infoArray);

        for (var i = 0; i < infoArray.length; i++) {
            path[i] = new Array(matrix.length);
            for (var j = 0; j < infoArray.length; j++)
                if (matrix[i][j] == 0) {
                    path[i][j] = -1;
                }

                else
                    path[i][j] = j;
        }

    };


    /**
     * Floyed算法主体
     * @returns {*}
     */
    this.minPath = function () {

        // 求出最短路径的长度
        for (var k = 0; k < infoArray.length; k++) {
            for (var i = 0; i < infoArray.length; i++) {
                for (var j = 0; j < infoArray.length; j++) {
                    if (infoArray[i][j] > infoArray[i][k] + infoArray[k][j]) {
                        infoArray[i][j] = infoArray[i][k] + infoArray[k][j];
                        path[i][j] = k;
                    }
                }
            }
        }


        // 求出网络直径的具体路径
        var max = 0;
        for (var i = 0; i < infoArray.length; i++) {
            for (var j = i + 1; j < infoArray.length; j++) {
                if (infoArray[i][j] > max)
                    max = infoArray[i][j];
            }
        }


        var target_x = new Array();
        var target_y = new Array();
        for (var i = 0; i < infoArray.length; i++) {
            for (var j = i + 1; j < infoArray.length; j++) {
                if (infoArray[i][j] == max) {
                    target_x.push(i);
                    target_y.push(j);
                }
            }
        }


        resultPath = new Array();
        for (var i = 0; i < target_x.length; i++) {
            //var longPath = getPath(target_x[i], target_y[i]);
            var longPath = new Array();
            longPath.push(target_x[i]);
            getPath(target_x[i], target_y[i], longPath);
            resultPath.push(longPath);
        }

        //this.longResultPath = resultPath;
        return resultPath;
    };



    var resultPath = new Array();

    /**
     * 获取路径
     */
    var getPath = function (i, j, onePath) {

        if (i == j)
            return;

        if (path[i][j] == -1)
            return;

        if (path[i][j] == j)
            onePath.push(j);

        else {
            getPath(i, path[i][j], onePath);
            getPath(path[i][j], j, onePath);
        }

        // var longPath = new Array(infoArray[i][j] + 1);
        // longPath[0] = i;
        // longPath[longPath.length - 1] = j;
        //
        // for (var s = 0; s < longPath.length - 2; s++) {
        //     var next = path[i][j];
        //     longPath[longPath.length - 2 - s] = next;
        //     j = next;
        // }
        //
        // return longPath;

    };


    init();
}

module.exports={
    dg:Floyed
};

/***/ }),
/* 3 */
/***/ (function(module, exports) {

/**
 * Created by zmc on 2017/9/4.
 * 求一个连通图中关键点的算法
 * Tarjan算法
 */


function KeyNode(matrix, nodeArray) {

    var infoArray;      // 邻接矩阵

    var result = new Array();       // 关键点的结果

    var nodeList;


    var num;
    var low;
    var visited;
    var index = 0;

    /**
     * 初始化
     */
    var init = function () {
        infoArray = matrix;
        nodeList = nodeArray;

        num = new Array(nodeList.length);
        low = new Array(nodeList.length);
        visited = new Array(nodeList.length);
        result = new Array();

        for (var i = 0; i < visited.length; i++)
            visited[i] = 0;
    };


    /**
     * 求关键点的主体
     * @returns {Array}
     */
    this.go = function () {

        dfs(0, 0);
        return result;
    }


    var dfs = function (cur, father) {

        var child = 0;

        index++;
        num[cur] = index;
        low[cur] = index;
        visited[cur] = 1;
        for (var i = 0; i < nodeList.length; i++) {
            if (infoArray[cur][i] == 1) {
                if (visited[i] == 0) {
                    child++;
                    dfs(i, cur);

                    if (low[i] < low[cur])
                        low[cur] = low[i];

                    if (cur != 0 && low[i] >= num[cur])
                        result.push(cur);

                    if (cur == 0 && child == 2)
                        result.push(cur);
                }

                else if (i != father) {
                    if (num[i] < low[cur])
                        low[cur] = num[i];
                }
            }
        }

    };




    init();

}

module.exports={
    dg:KeyNode
};

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * Created by yzl on 2017/8/28.
*/
//webpack打包入口，有需要时再用吧hhh

__webpack_require__(0);
__webpack_require__(1);
__webpack_require__(2);
__webpack_require__(3);
__webpack_require__(5);
// require('../public/javascripts/sysGraph/DivideGraph');
// require('../public/javascripts/lib/twaver');


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * Created by zmc on 2017/9/3.
 * 对twaver.Network进行分析，分析其  成环率、关键点、未成环设备
 */

var divideGraphImport=__webpack_require__(1);
var floyedImport=__webpack_require__(2);
var keyNodeImport=__webpack_require__(3);
var circuitRateImport=__webpack_require__(0);


window.NetworkAnalyse = {
    CreateNew: function (net) {
        var analyse = {};

        var nodeArray = new Array();        // 设备数组
        var linkArray = new Array();        // 复用段数组
        var infoArray = new Array();        // 邻接矩阵


        var network;

        var subGraphs;


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


            for (var i = 0; i < subGraphs.length; i++) {
                var sub = subGraphs[i];
                var subMatrix = buildSubMatrix(sub);

                var keyNode = new keyNodeImport.dg(subMatrix, sub);
                var tempResult = keyNode.go();

                for (var j = 0; j < tempResult.length; j++)
                    keyPoints.push(sub[tempResult[j]]);
            }


            var result = new Array();
            for (var i = 0; i < keyPoints.length; i++) {
                result.push(nodeArray[keyPoints[i]]);
            }
            return result;
        };


        analyse.diameter = function () {
            divide();

            var pathArray = new Array();

            var maxLength = 0;

            // 对每个子图进行分析
            for (var i = 0; i < subGraphs.length; i++) {
                var sub = subGraphs[i];

                var subMatrix = buildSubMatrix(sub);

                var floyedAl = new floyedImport.dg(subMatrix);
                var resultPath = floyedAl.minPath();

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
            for (var i = 0; i < subGraphs.length; i++) {
                var sub = subGraphs[i];
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
            subGraphs = di.divide();
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





// function NetworkAnalyse(net) {

// window.NetworkAnaluse = function(net) {
//
//
//     var nodeArray = new Array();        // 设备数组
//     var linkArray = new Array();        // 复用段数组
//     var infoArray = new Array();        // 邻接矩阵
//
//
//     var network;
//
//     var subGraphs;
//
//     /**
//      * 求网络的关键点
//      * @returns {Array}
//      */
//     this.keyNode = function () {
//
//         var keyPoints = new Array();
//         divide();
//
//
//         for (var i = 0; i < subGraphs.length; i++) {
//             var sub = subGraphs[i];
//             var subMatrix = buildSubMatrix(sub);
//
//             var keyNode = new KeyNode(subMatrix, sub);
//             var tempResult = keyNode.go();
//
//             for (var j = 0; j < tempResult.length; j++)
//                 keyPoints.push( sub[tempResult[j]] );
//         }
//
//
//         var result = new Array();
//         for (var i = 0; i < keyPoints.length; i++) {
//             result.push( nodeArray[keyPoints[i]] );
//         }
//         return result;
//     };
//
//
//     /**
//      * 求网络直径
//      */
//     this.diameter = function () {
//
//         divide();
//
//         var pathArray = new Array();
//
//         var maxLength = 0;
//
//         // 对每个子图进行分析
//         for (var i = 0; i < subGraphs.length; i++) {
//             var sub = subGraphs[i];
//             var subMatrix = buildSubMatrix(sub);
//
//             var floyed = new Floyed(subMatrix);
//             var resultPath = floyed.minPath();
//
//             if (resultPath[0].length > maxLength) {
//                 pathArray = new Array();
//                 maxLength = resultPath[0].length;
//                 for (var s = 0; s < resultPath.length; s++) {
//                     for (var t = 0; t < resultPath[0].length; t++) {
//                         var tmp = resultPath[s][t];
//                         resultPath[s][t] = sub[tmp];
//                     }
//                 }
//
//                 for (var s = 0; s < resultPath.length; s++) {
//                     pathArray.push(resultPath[s]);
//                 }
//             }
//
//             else if (resultPath[0].length == maxLength) {
//                 for (var s = 0; s < resultPath.length; s++) {
//                     for (var t = 0; t < resultPath[0].length; t++) {
//                         var tmp = resultPath[s][t];
//                         resultPath[s][t] = sub[tmp];
//                     }
//                 }
//
//                 for (var s = 0; s < resultPath.length; s++) {
//                     pathArray.push(resultPath[s]);
//                 }
//             }
//         }
//
//
//         var result = new Array();
//         for (var i = 0; i < pathArray.length; i++) {
//
//             var path = pathArray[i];
//             var tempArray = new Array();
//             for (var j = 0; j < path.length; j++) {
//                 tempArray.push( nodeArray[path[j]] );
//             }
//             var netPath = new NetworkPath(tempArray);
//             alert(netPath.getPathLength());
//             result.push(netPath);
//         }
//
//         return result;
//     };
//
//
//     /**
//      * 求Network的成环率
//      */
//     this.circuitRate = function () {
//         divide();
//
//         var weiChengHuanList = new Array();         // 未成环节点的列表
//
//         // 对每个联通的子图进行求未成环设备
//         for (var i = 0; i < subGraphs.length; i++) {
//             var sub = subGraphs[i];
//             var subMatrix = buildSubMatrix(sub);
//
//             var circuitRate = new CircuitRate(subMatrix);
//             var result = circuitRate.calculateRate();
//
//             for (var j = 0; j < result.length; j++) {
//                 weiChengHuanList.push( sub[result[j]] );
//             }
//         }
//
//
//         var result = new Array();
//         for (var i = 0; i < weiChengHuanList.length; i++) {
//             result.push( nodeArray[weiChengHuanList[i]] );
//         }
//
//         return result;
//     };
//
//
//
//
//
//     /**
//      *  从NetWork构造出邻接矩阵
//      */
//     var init = function () {
//         network = net;
//
//         var dataList = network.getElementBox().getDatas();
//
//         for (var i = 0; i < dataList.size(); i++) {
//
//             var dataItem = dataList.get(i);
//
//             if (dataItem instanceof twaver.Node) {
//                 dataItem.setClient("the_index", nodeArray.length);
//                 nodeArray.push(dataItem);
//             }
//
//             else if (dataItem instanceof twaver.Link){
//                 linkArray.push(dataItem);
//             }
//         }
//
//
//         infoArray = new Array(nodeArray.length);
//         for (var i = 0; i < infoArray.length; i++) {
//             infoArray[i] = new Array(nodeArray.length);
//
//             for (var j = 0; j < infoArray.length; j++) {
//                 infoArray[i][j] = 0;
//             }
//         }
//
//
//         for (var i in linkArray) {
//
//             var link = linkArray[i];
//             var node1 = link.getFromNode();
//             var node2 = link.getToNode();
//
//
//             var index1 = node1.getClient("the_index");
//             var index2 = node2.getClient("the_index");
//
//             infoArray[index1][index2] = 1;
//             infoArray[index2][index1] = 1;
//         }
//
//     };
//
//
//     /**
//      * 划分子图
//      */
//     var divide = function () {
//         var di = new DivideGraph();
//         di.readData(infoArray, nodeArray);
//         subGraphs = di.divide();
//     };
//
//
//     /**
//      * 对子图构建对应的邻接矩阵
//      * @param subArr
//      * @returns {Array}
//      */
//     var buildSubMatrix = function (subArr) {
//         var matrix = new Array(subArr.length);
//
//         for (var i = 0; i < subArr.length; i++) {
//             matrix[i] = new Array(subArr.length);
//             for (var j = 0; j < subArr.length; j++)
//                 matrix[i][j] = 0;
//         }
//
//
//         for (var i = 0; i < subArr.length; i++) {
//             var real_i = subArr[i];
//             for (var j = 0; j < subArr.length; j++) {
//                 var real_j = subArr[j];
//                 matrix[i][j] = infoArray[real_i][real_j];
//             }
//         }
//
//         return matrix;
//
//     };
//
//
//     init();
//
// }
//
//
// /**
//  * 求网络直径返回的结果
//  * @param nodeArray
//  * @constructor
//  */
// function NetworkPath(nodeArray) {
//
//     var nodeList = new Array();
//     var pathLength = 0;
//
//     var init = function () {
//         nodeList = nodeArray;
//         pathLength = nodeArray.length - 1;
//     };
//
//
//     this.getNodeList = function () {
//         return nodeList;
//     }
//
//
//     this.getPathLength = function () {
//         return  pathLength;
//     }
//
//
//     init();
// }


/***/ })
/******/ ]);