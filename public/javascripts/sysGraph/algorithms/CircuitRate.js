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