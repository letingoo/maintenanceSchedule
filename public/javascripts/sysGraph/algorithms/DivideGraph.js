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
