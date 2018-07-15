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

        //console.log(matrix);
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

        //console.log("H");
        //console.dir(infoArray);

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