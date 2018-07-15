/**
 * Created by zmc on 2017/9/4.
 * 求一个连通图中关键点的算法
 * 先用Tarjan算法求出关键点，再用其他方法求出关键点所分割的子图
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

        matrix2 = new Array(matrix.length);
        for (var i = 0; i < matrix.length; i++) {
            matrix2[i] = new Array(matrix.length);
        }
    };



    var matrix2;    // 将一个点从matrix中删除后的矩阵
    var subGraphs;
    var subGraphNodes = 0;
    var subGrahsStr;

    /**
     * 求关键点的主体
     * @returns {Array}
     */
    this.go = function () {

        // 先求出所有关键点，存于result数组中
        dfs(0, 0);

        // 结果中可能会有重复值，要清除掉
        var tempArr = new Array();

        for (var i = 0; i < result.length; i++) {
            var num = result[i];
            if (tempArr.indexOf(num) == -1)
                tempArr.push(num);
        }

        result = tempArr;


        subGrahsStr = new Array();

        // 再求出所有关键点的子网规模、子网数量

        for (var i = 0; i < result.length; i++) {
            var index = result[i];

            for (var s = 0; s < matrix.length; s++) {
                for (var t = 0; t < matrix.length; t++) {
                    matrix2[s][t] = matrix[s][t];
                }
            }


            // 删掉该关键点的连线
            for (var j = 0; j < matrix2.length; j++) {
                matrix2[index][j] = 0;
                matrix2[j][index] = 0;
            }


            for (var j = 0; j < visited.length; j++) {
                visited[j] = 0;
            }

            subGraphs = new Array();


            for (var j = 0; j < matrix2.length; j++) {
                if (visited[j] == 0 && j != index) {
                    subGraphNodes = 0;
                    dfs2(j, index);
                    subGraphs.push(subGraphNodes);
                }
            }

            subGrahsStr.push( subGraphs.join(",") );
        }

        return result;
    };


    this.getSubGraphsStr = function () {
        return subGrahsStr;
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


    var dfs2 = function (index, target) {

        if (visited[index] == 1 || index == target)
            return;

        visited[index] = 1;
        subGraphNodes++;

        for (var i = 0; i < matrix2.length; i++) {
            if (matrix2[index][i] == 1 && visited[i] == 0)
                dfs2(i);
        }
    };


    init();

}

module.exports={
    dg:KeyNode
};