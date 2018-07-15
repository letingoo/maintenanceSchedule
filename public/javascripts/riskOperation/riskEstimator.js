/**
 * Created by zhangminchao on 2017/11/2.
 * 计算系统的业务风险值
 *
 */


var riskEstimator = {


    createNew: function(bussinessRoute_) {

        var riskEstimate = {};
        var busssinessRoute = bussinessRoute_;



        /**
         * 计算风险值
         * @returns {Object}
         */
        riskEstimate.calculate_PRI_sum = function () {


            var businessList = busssinessRoute.getBusIdList();      // 获取业务ID列表
            var PRI_SUM = 0;        // 最后总的PRI之和


            var estimateLogSpec = new Array();
            console.log(businessList.length);
            $.each(businessList, function (index, busId) {

                var itemArr = busssinessRoute.checkInDanger(busId);
                var rValue = calculate_R(itemArr);
                var singlePRI = rValue * calculate_P(itemArr) * calculate_T() * 10;
                if (isNaN(singlePRI))
                    console.log(busId);
                PRI_SUM += singlePRI;
                var spec_route = new Object();
                spec_route.bussinessId = busId;

                var bussinessModel = busssinessRoute.getBusRouteById(busId);
                spec_route.bussinessName = bussinessModel.bussinessName;
                spec_route.mainRoute = bussinessModel.mainRoute;
                spec_route.spareRoute = bussinessModel.spareRoute;
                spec_route.pri = singlePRI.toFixed(4);
                estimateLogSpec.push(spec_route);

            });

            var reportResult = new Object();
            reportResult.pri_sum = PRI_SUM.toFixed(3);
            console.log(PRI_SUM);
            reportResult.estimateLogSpec = estimateLogSpec;

            return reportResult;

        };


        /**
         * 返回预警数据
         * @returns {Array}
         */
        riskEstimate.getCheckReport = function () {
            var businessList = busssinessRoute.getBusIdList();      // 获取业务ID列表

            var riskCheckReport = new Array();
            $.each(businessList, function (index, busId) {

                var itemArr = busssinessRoute.checkInDanger(busId);

                var singleRouteRisk = new Object();
                singleRouteRisk.bussinessId = busId;

                var bussinessModel = busssinessRoute.getBusRouteById(busId);
                singleRouteRisk.bussinessName = bussinessModel.bussinessName;
                singleRouteRisk.elementList = itemArr;
                riskCheckReport.push(singleRouteRisk);
            });

            return riskCheckReport;
        };


        /**
         * 计算R
         * route是具体路由
         * @param route
         */
        function calculate_R(route) {

            if (route.length == 0)
                return 10;


            var equipCount = 0;
            var linkCount = 0;

            var equipSum = 0;
            var linkSum = 0;

            var r_val = 0;

            $.each(route, function (index, itemName) {

                // 如果item是链路
                if (itemName.indexOf('-') != 0) {
                    equipCount++;
                    equipSum += getEquipWeight(itemName);
                }


                // 如果item是设备
                else {
                    linkCount++;
                    linkSum += getLinkWeight(itemName);
                }

            });



            if (linkCount > 0) {
                r_val = equipSum / equipCount + linkSum / linkCount;
            }

            else
                r_val = equipSum / equipCount;

            return r_val;

        }


        
        function calculate_P(route) {

            return 0.001 * route.length;
        }

        
        
        function calculate_T() {
            return 1;
        }
        
        
        

        /**
         * 计算设备权重
         */
        function getEquipWeight(equip) {
            return 10;
        }



        /**
         * 计算链路权重
         */
        function getLinkWeight(link) {
            return 1.25;
        }
        
        

        return riskEstimate;
    }

}
