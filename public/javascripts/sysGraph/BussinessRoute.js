/**
 * Created by zmc on 2017/10/12.
 *
 * 运维检修相关
 * 设备，复用段都要做运维检修
 *
 * 所有公共方法如下:
 * insertBusRoute(busRoute):bool —— 插入一条业务路由
 * updateBusRoute(busRoute):bool —— 更新一条业务路由
 * getBusRouteById(busId):busRoute —— 根据业务 ID 返回一个业务类型
 * getBusRouteByItem(itemId):Array —— 根据 设备/复用段 的ID 返回其影响的业务数组，数字每一项由两位的标志位和业务ID组成
 * isItemOk(itemId):bool —— itemID 设备/复用段 是否可以检修
 * busIdNeedChange(itemId):Array —— 返回该 设备/复用段 上影响的业务（主路由经过这一item就算）
 * checkInDanger(busId) —— 查看busId 业务中不可检修的 设备/复用段
 * getTopoEquip():Array —— 返回设备数组
 * getTopoLink(): Array —— 返回链路数组
 * getBusIdList():Array —— 返回业务ID 数组
 * maintenanceInterruptBusiness(itemArray):Array  —— 如果同时检修itemArray里的item，中断的业务数组，数组里的项目是业务名称和id混合 的对象数组。
 * maintenanceAffectBusiness(itemArray):Array —— 如果同时检修itemArray里的item，影响的业务数组，数组里的项目是业务名称和id混合 的对象数组。
 * recoverToInitialState() —— 把businessRoute恢复到最开始装填
 * deleteBusList(busIdList) —— 删掉busIdList中的业务
 */


function BussinessRoute() {

    var equipList;              // 设备列表
    var topoList;               // 复用段列表
    var busRouteList;           // 业务列表

    var busByItemTable;        // 设备/复用段和对应的业务的Map      key:设备/链路 ID，
                               // value: 数组，该数组第i项是标志位，第i+1项是业务的ID（i为偶数）
                               // 标志位表明该 设备/复用段 对业务的影响。

    var busByItemTableInit;     // 记录busByItemTable的第一次加载后的信息，为了恢复检修信息至最初状态
    var businessTableInit;      // 记录businessTable的第一次加载后的信息，为了恢复检修信息至最初状态

    var businessTable;       // 业务ID和业务模型的Map    key:业务的ID， value;后台取的业务对象
    var equipTable;            // 设备ID和设备的Map        key:设备的ID， value:后台取的设备对象
    var topoTable;             // 链路ID和链路的Map        key:链路的ID， value:后台取的链路对象


    var SEPARATOR = "-";       // 路由字符串的分隔符



    var findNewRoute;           // 用于查看 不可检修点 重新规划路由后的结果


    this.setFindNewRoute = function (newRoute) {
        findNewRoute = newRoute;
    }

    /**
     * 初始化函数
     */
    var init = function () {
        busByItemTable = new Map();
        busByItemTableInit = new Map();
        businessTable = new Map();
        businessTableInit = new Map();
        equipTable = new Map();
        topoTable = new Map();
        equipList = new Array();
        topoList = new Array();
        busRouteList = new Array();

        var getNetElementsUrl = DEFAULT_OPTIONS.DB_Interface + DEFAULT_OPTIONS.Prefix.netElements + parent.versionId;
        if (circleDisplay.getCircleId() != '')
            getNetElementsUrl += "/" + circleDisplay.getCircleId();
        getDataFromBackend(getNetElementsUrl,
            function (data) {
                equipList = data;
            });

        var getLinkUrl = DEFAULT_OPTIONS.DB_Interface + DEFAULT_OPTIONS.Prefix.links + parent.versionId;
        if (circleDisplay.getCircleId() != '')
            getLinkUrl += "/" + circleDisplay.getCircleId();
        getDataFromBackend(getLinkUrl,
            function (data) {
                topoList = data;
            });


        var getBussinessUrl = DEFAULT_OPTIONS.DB_Interface + DEFAULT_OPTIONS.Prefix.bussiness + parent.versionId;
        if (circleDisplay.getCircleId() != '')
            getBussinessUrl += "/" + circleDisplay.getCircleId() + "/";

        getDataFromBackend(getBussinessUrl,
            function (data) {
                busRouteList = data;
            });



        initBusRouteMap();

    };


    /**
     * 从后台获取数据
     * ajax设置为同步
     * @param url
     * @param func
     */
    var getDataFromBackend = function (url, func) {
        $.ajax({
            type: "get",
            url: url,
            dataType: "json",
            async: false,
            success: function (data) {
                func(data);
            }
        });
    };



    var getDataPromise = function (url) {
        return new Promise(function (resolve, reject) {
            $.ajax({
                type: "get",
                url: url,
                dataType: "json",
                async: false,
                success: function (data) {
                    resolve(data);
                },
                error: function (data, status) {
                    reject();
                }
            });
        });
    };



    var getPromiseAll = function () {
        var recvArray = new Array();
        recvArray.push( new getDataPromise(DEFAULT_OPTIONS.DB_Interface + DEFAULT_OPTIONS.Prefix.netElements + parent.versionId) );
        recvArray.push( new getDataPromise(DEFAULT_OPTIONS.DB_Interface + DEFAULT_OPTIONS.Prefix.links + parent.versionId) );
        recvArray.push( new getDataPromise(DEFAULT_OPTIONS.DB_Interface + DEFAULT_OPTIONS.Prefix.bussiness + parent.versionId) );
        return Promise.all(recvArray);
    }


    
    var initBusRouteMap = function () {

        for (var i = 0; i < equipList.length; i++) {
            var equip = equipList[i];

            equip.netElementId = String(equip.netElementId);
            equipTable.set(equip.netElementId, equip);
        }


        for (var i = 0; i < topoList.length; i++) {
            var topo = topoList[i];

            topo.linkId = String(topo.linkId);
            topoTable.set(topo.linkId, topo);
        }


        // 检查业务的路由信息，如果路由信息检查出错误则舍弃这个业务
        for (var i = 0; i < busRouteList.length; i++) {
            var bussiness = busRouteList[i];
            var mainRoute = bussiness.mainRoute;
            var spareRoute = bussiness.spareRoute;

            var flag = false;
            if (mainRoute != null && mainRoute != "") {

                var mainRouteArr = mainRoute.split(SEPARATOR);

                for (var j = 0; j < mainRouteArr.length; j++) {
                    var equipName = mainRouteArr[j];
                    if (itemIdHandler(equipName) == ""){
                        flag = true;
                        busRouteList.splice(i, 1);
                        break;
                    }
                }
            }


            if (!flag && spareRoute != null && spareRoute != "") {

                var spareRouteArr = spareRoute.split(SEPARATOR);

                for (var j = 0; j < spareRouteArr.length; j++) {
                    var equipName = spareRouteArr[j];
                    if (itemIdHandler(equipName) == "") {
                        //console.log(bussiness);
                        busRouteList.splice(i, 1);
                        break;
                    }
                }
            }

        }

        for (var i = 0; i < busRouteList.length; i++) {
            var bussinessRoute = busRouteList[i];
            bussinessRoute.bussinessId = String(bussinessRoute.bussinessId);

            if (bussinessRoute.mainRoute != null && bussinessRoute.mainRoute != "") {
                if (!businessTable.has(bussinessRoute.bussinessId))
                    insertFunction(bussinessRoute);
            }
        }

        // 复制busByItemTable，深度复制，这里写的不好，希望能有更好的方式
        busByItemTable.forEach(function (value, key) {
           var originalArray = value;
           var copyArray = new Array();
           for (var i = 0; i < originalArray.length; i++)
               copyArray.push(originalArray[i]);

           busByItemTableInit.set(key, copyArray);
        });

        // 复制businessTable，深度复制，写法也不好
        businessTable.forEach(function (value, key) {
            var newBusinessObj = JSON.parse(JSON.stringify(value));
            businessTableInit.set(key, newBusinessObj);
        });

    };


    /**
     * 将busByItemTable,businessTable恢复最开始状态
     * 写的都不太好
     */
    this.recoverToInitialState = function () {

        // 都是深度复制

        busByItemTableInit.forEach(function (value, key) {
            var originalArray = value;
            var copyArray = new Array();
            for (var i = 0; i < originalArray.length; i++)
                copyArray.push(originalArray[i]);

            busByItemTable.set(key, copyArray);
        });


        businessTableInit.forEach(function (value, key) {
            var newBusinessObj = JSON.parse(JSON.stringify(value));
            businessTable.set(key, newBusinessObj);
        });

    }




    /**
     * 将输入的code类型路由转化为由中文站点组成的路由
     * @param routeStr
     */
    this.translateRoute = function (routeStr) {
        var result = "";

        if (routeStr == null || routeStr == "" || routeStr == "null")
            return result;


        var node_array = routeStr.split(SEPARATOR);
        for (var i = 0; i < node_array.length; i++) {
            var node = itemIdHandler(node_array[i]);

            if ( equipTable.has(node) ) {
                var equip = equipTable.get(node);
                result = result + equip.netElementName + SEPARATOR;
            }
        }

        return result.slice(0, result.length - 1);
    };


    /**
     * 返回 busId 业务上不可检修的设备/复用段
     * @param busId
     */
    this.checkInDanger = function (busId) {

        if (typeof busId == 'number')
            busId = String(busId);
        var result = new Array();

        try {

            if (businessTable.has(busId)) {
                // 先对设备进行处理
                var mainRoute = businessTable.get(busId).mainRoute;
                var itemArray = businessTable.get(busId).mainRoute.split(SEPARATOR);
                for (var i = 0; i < itemArray.length; i++) {
                    var equipId = itemIdHandler(itemArray[i]);

                    var busByItem = busByItemTable.get(equipId);
                    var labelIndex = busByItem.indexOf(busId) - 1;
                    var label = busByItem[labelIndex];

                    if (label == "1#" || label == "11" || label == "!1#" || label == "!11")
                        result.push(equipTable.get(equipId).netElementName);
                }


                // 再处理复用段
                for (var i = 0; i < itemArray.length - 1; i++) {
                    var linkId = itemIdHandler(itemArray[i] + SEPARATOR + itemArray[i + 1]);

                    var busByItem = busByItemTable.get(linkId);
                    var labelIndex = busByItem.indexOf(busId) - 1;
                    var label = busByItem[labelIndex];

                    if (label == "1#" || label == "11" || label == "!1#" || label == "!11")
                        result.push(topoTable.get(linkId).linkName);
                }

            }

        } catch (err) {
            //console.dir("业务"+busId+"存在问题，忽略");
          //  console.log("wrong?" + busId);
        }
        return result;
    }




    /**
     * 插入业务路由表
     * @param busRouteModel
     */
    this.insertBusRoute = function (busRouteModel) {
        if (businessTable.has(busRouteModel.bussinessId)) {
            return false;
        }

        else
            return insertFunction(busRouteModel);
    }


    /**
     * 更新业务路由
     * @param busRouteModel
     * @returns {boolean}
     */
    this.updateBusRoute = function (busRouteModel) {
        if (businessTable.has(busRouteModel.bussinessId)) {
            if (deleteItemBusByBusId(busRouteModel.bussinessId))
                return insertFunction(busRouteModel);
            else
                return false;
        }

        else
            return false;

    }




    /**
     * 根据业务ID 寻找业务路由，返回业务路由模型
     * @param busId
     * @returns {*}
     */
    this.getBusRouteById = function (busId) {

        var result = null;
        if (busId == "" || busId == null)
            return result;

        if (typeof busId == 'number')
            busId = String(busId);

        return businessTable.get(busId);


    }


    /**
     * 根据 设备/链路 的ID 取得其影响的业务数组
     * 数组每一项都是字符串 由两位标识符和业务的id组成。
     * 标识符每一位由1或0或#组成。
     * @param itemId
     * @returns {null}
     */
    this.getBusRouteByItem = function (itemId) {

        if (itemId == "" || itemId == null)
            return null;

        if (typeof itemId == 'number')
            itemId = String(itemId);


        itemId = itemIdHandler(itemId);
        if (itemId == "")
            return null;

        if (busByItemTable.has(itemId)) {
            var busArray = busByItemTable.get(itemId);

            var result = new Array();
            for (var i = 0; i < busArray.length; i += 2) {
                var label;
                if (busArray[i].length == 2)        // 标记字段不含有 ! 的情况
                    label = busArray[i];
                else if (busArray[i].length == 3)   // 标记字段含有 ! 的情况
                    label = busArray[i].slice(1);

                var str = label + busArray[i + 1];

                //if (label[0] == '1')
                result.push(str);
            }

            return result;
        }

        else {
            return new Array();
        }
    }


    /**
     * 根据 设备/复用段ID 查看该设备是否可以检修
     * 返回值为Number
     * 0 —— 该 设备/复用段 可以检修
     * 1 —— 有业务的主路由经过该 设备/复用段 且该业务没有备用路由
     * 2 —— 有业务的主路由和备用路由都经过该 设备/复用段
     * 3 —— 该 设备/复用段 是某一业务的 起点或者终点
     * @param itemId
     */
    this.isItemOK = function (itemId) {

        if (typeof itemId == 'number')
            itemId = String(itemId);

        itemId = itemIdHandler(itemId);
        if (itemId == "" || itemId == null)
            return null;

        if (busByItemTable.has(itemId)) {
            var busArray = busByItemTable.get(itemId);
            for (var i = 0; i < busArray.length; i += 2) {
                var label = busArray[i];
                if (label[0] == '!')
                    return 3;

                if (label == "1#")
                    return 1;
                else if (label == "11")
                    return 2;
            }
        }

        return 0;
    }


    /**
     * 根据 设备ID 返回该设备下需要更改主路由的业务id数组，包括标记字段
     * @param itemId
     */
    this.busIdNeedChange = function (itemId) {

        if (typeof itemId == 'number')
            itemId = String(itemId);

        itemId = itemIdHandler(itemId);
        var result = new Array();

        if (itemId == null || itemId == "")
            return result;


        if (!busByItemTable.has(itemId))
            return result;

        else {
            var busArray = busByItemTable.get(itemId);

            for (var i = 0; i < busArray.length; i += 2) {
                var label = busArray[i];
                if (label[0] == '!')
                    return new Array();
                if (label[0] == '1') {
                    result.push(busArray[i] + busArray[i + 1]);
                }
            }

            return result;
        }
    }


    /**
     * 返回设备ID数组
     */
    this.itemList = function () {
        var result = new Array();

        busByItemTable.forEach(function(value,key){
            result.push(key);
        });

        return result;
    }


    /**
     * 返回业务ID数组
     */
    this.busidList = function () {
        var result = new Array();

        businessTable.forEach(function(value,busId){
            result.push(busId);
        });

        return result;
    }


    /**
     * 返回链路数组
     */
    this.getTopoLink = function () {
        return topoList;
    }


    /**
     * 返回设备数组
     */
    this.getTopoEquip = function () {
        return equipList;
    }



    this.getBusIdList = function () {
        var result = new Array();

        businessTable.forEach(function(value,key){
            result.push(key);
        })
        return result;
    }


    /**
     * 判断检修 itemArray 这一数组的话，造成中断的业务列表
     * 返回一个对象数组，busId -- 业务id。  busName -- 业务名称。
     * @param itemArray
     */
    this.maintenanceInterruptBusiness = function (itemArray) {

        var businessIdArray;
        if (itemArray.length == 1)
            businessIdArray = getBreakBusiness(itemArray[0]);
        else if (itemArray.length == 2)
            businessIdArray = bothInterruptBusiness(itemArray[0], itemArray[1]);


        var resultArray = new Array();
        for (var i = 0; i < businessIdArray.length; i++) {
            var resultItem = new Object();
            resultItem.busId = businessIdArray[i];
            resultItem.busName = businessTable.get(businessIdArray[i]).bussinessName;
            resultArray.push(resultItem);
        }

        return resultArray;
    }


    /**
     * 如果检修 itemArray 这一数组的话，影响的业务数组
     * 返回一个对象数组，busId -- 业务id。  busName -- 业务名称。
     * @param itemArray
     */
    this.maintenanceAffectBusiness = function (itemArray) {

        var businessIdArray = new Array();
        if (itemArray.length == 1)
            businessIdArray =  getAffectedBusiness(itemArray[0]);
        else if (itemArray.length == 2)
            businessIdArray = bothAffectBusiness(itemArray[0], itemArray[1]);

        var resultArray = new Array();
        for (var i = 0; i < businessIdArray.length; i++) {
            var resultItem = new Object();
            resultItem.busId = businessIdArray[i];
            resultItem.busName = businessTable.get(businessIdArray[i]).bussinessName;
            resultArray.push(resultItem);
        }

        return resultArray;

    }


    /**
     * 判断equipId是否是businessId的起点或者终点
     * @param businessId
     * @param equipId
     */
    this.isStartOrEndOfBusiness = function (businessId, equipId) {


        businessId = String(businessId);
        equipId = String(equipId);

        var theRoute = businessTable.get(businessId).mainRoute;

        var equip = equipTable.get(equipId);
        if (equip == undefined)
            return false;

        var equipArray = theRoute.split(SEPARATOR);
        if (equipArray[0] == equip.netElementName || equipArray[equipArray.length - 1] == equip.netElementName)
            return true;

        return false;

    }


    /**
     * 如果检修单个 itemID，那么造成中断的业务列表
     * @param itemId
     */
    var getBreakBusiness = function (itemId) {
        var resultMap = interruptBusinessHelper(itemId);
        return resultMap.get('interruptBusiness');
    }


    /**
     * 同时检修item1和item2时，中断的业务
     * 这里要考虑如果item刚开始不能检修的情况，这时候其“备用路由”相当于取规划后的路由
     * @param item1
     * @param item2
     */
    var bothInterruptBusiness = function (item1, item2) {


        var item1ResultMap = interruptBusinessHelper(item1);
        var item2ResultMap = interruptBusinessHelper(item2);

        var item1BreakBusiness = item1ResultMap.get("interruptBusiness");
        var item2BreakBusiness = item2ResultMap.get("interruptBusiness");


        var setMap = new Map();
        // 先检查item1，item2直接造成中断的业务
        for (var i = 0; i < item1BreakBusiness.length; i++) {
            setMap.set(item1BreakBusiness[i], "dump");
        }

        for (var i = 0; i < item2BreakBusiness.length; i++) {
            setMap.set(item2BreakBusiness[i], "dump");
        }


        item1 = String(item1);
        item2 = String(item2);
        // 再检查item1，item2 同时检修造成中断的业务。

        var item1Name = "";
        var item2Name = "";
        var item1AnotherName = "cannot be";  // 如果item1是链路
        var item2AnotherName = "cannot be";  // 如果item2是链路
        if (isLinkOrElement(item1) == 0)
            item1Name = equipTable.get(item1).netElementName;
        else {
            var startEquipName = topoTable.get(item1).endAName;
            var endEquipName = topoTable.get(item1).endZName;
            item1Name = startEquipName + SEPARATOR + endEquipName;
            item1AnotherName = endEquipName + SEPARATOR + startEquipName;
        }

        if (isLinkOrElement(item2) == 0)
            item2Name = equipTable.get(item2).netElementName;
        else {
            var startEquipName = topoTable.get(item2).endAName;
            var endEquipName = topoTable.get(item2).endZName;
            item2Name = startEquipName + SEPARATOR + endEquipName;
            item2AnotherName = endEquipName + SEPARATOR + startEquipName;
        }


        var item1BackRouteMap = item1ResultMap.get("backRouteMap");
        item1BackRouteMap.forEach(function (value, key) {
            if (value.indexOf(item2Name) >= 0) {
                setMap.set(key, "dump");
            }

            else if (value.indexOf(item2AnotherName) >= 0) {
                setMap.set(key, "dump");
            }
        });



        var item2BackRouteMap = item2ResultMap.get("backRouteMap");
        item2BackRouteMap.forEach(function (value, key) {
            if (value.indexOf(item1Name) >= 0) {
                setMap.set(key, "dump");
            }

            else if (value.indexOf(item1AnotherName) >= 0) {
                setMap.set(key, "dump");
            }
        });

        var result = new Array();
        setMap.forEach(function (value, key) {
           result.push(key);
        });
        return result;
    }


    /**
     * 分析检修itemId会造成的 结果
     * 两项 —— 第一项是 中断的业务列表，第二项是切换至备用路由的Map。Map的形式是 业务id——业务切换的备用路由
     * @param itemId
     * @returns {Map}
     */
    var interruptBusinessHelper = function (itemId) {
        if (typeof itemId == 'number')
            itemId = String(itemId)
        itemId = itemIdHandler(itemId);


        var backRouteMap = new Map();
        var interruptBusinessArray = new Array();
        if (busByItemTable.has(itemId)) {
            var busArray = busByItemTable.get(itemId);

            for (var i = 0; i < busArray.length; i += 2) {
                var label = busArray[i];
                if (label == '10') {
                    var theBusId = busArray[i + 1];
                    var busInfo = businessTable.get(busArray[i + 1]);
                    backRouteMap.set(busArray[i + 1], businessTable.get(busArray[i + 1]).spareRoute);
                }

                else if (label[0] == '!')
                    interruptBusinessArray.push(busArray[i + 1]);
            }
        }

        /**
         * 从晓峰那里取数据
         */

        var eqiup = getNodeOrLinkById(itemId)
        var findNewRouteResult = findNewRoute.busRouteFindRes(eqiup);
        theFound = findNewRouteResult.found;
        theNotFound = findNewRouteResult.notFound;


        for (var i = 0; i < theNotFound.length; i++) {
            if (interruptBusinessArray.indexOf(theNotFound[i].busId) < 0)
                interruptBusinessArray.push(theNotFound[i].busId);
        }

        for (var i = 0; i < theFound.length; i++) {
            backRouteMap.set(theFound[i].busId, theFound[i].route);
        }

        var resultMap = new Map();
        resultMap.set("interruptBusiness", interruptBusinessArray);
        resultMap.set("backRouteMap", backRouteMap);
        return resultMap;

    }



    /**
     * 同时检修item1，item2  所影响的业务
     * @param item1
     * @param item2
     */
    var bothAffectBusiness = function (item1, item2) {

        if (typeof item1 == 'number')
            item1 = String(item1)
        item1 = itemIdHandler(item1)

        if (typeof item2 == 'number')
            item2 = String(item2)
        item2 = itemIdHandler(item2)

        var setMap = new Map();
        var item1Array = bothAffectBusinesssHelper(item1);
        for (var i = 0; i < item1Array.length; i++)
            setMap.set(item1Array[i], 'dump');

        var item2Array = bothAffectBusinesssHelper(item2);
        for (var i = 0; i < item2Array.length; i++)
            setMap.set(item2Array[i], 'dump');

        var result = new Array();
        setMap.forEach(function (value, key) {
            result.push(key);
        })

        return result;
    }


    var bothAffectBusinesssHelper = function (item1) {

        var result = new Array();
        if (busByItemTable.has(item1)) {
            var busArray = busByItemTable.get(item1);
            for (var i = 0; i < busArray.length; i += 2) {
                var label = busArray[i];
                if (label[0] == '!' || label[0] == '1')
                    result.push(busArray[i + 1]);
            }
        }

        return result;
    }



    /**
     * 如果检修 itemID，将会影响的业务列表
     * 这里定义“影响”为业务的主路由经过itemID
     * @param itemId
     */
    var getAffectedBusiness = function (itemId) {
        if (typeof itemId == 'number')
            itemId = String(itemId);
        itemId = itemIdHandler(itemId);


        var result = new Array();
        if (busByItemTable.has(itemId)) {
            var busArray = busByItemTable.get(itemId);
            for (var i = 0; i < busArray.length; i += 2) {
                var label = busArray[i];
                if (label[0] == '!' || label[0] == '1')
                    result.push(busArray[i + 1])
            }
        }

        return result;
    }




    /**
     * 具体的插入路由
     * @param busRouteModel
     * @returns {boolean}
     */
    var insertFunction = function (busRouteModel) {
        if (busRouteModel.bussinessId == null || busRouteModel.bussinessId == "" ||
            busRouteModel.mainRoute == null || busRouteModel.mainRoute == "")
            return false;


        try {
            businessTable.set(busRouteModel.bussinessId, busRouteModel);

            var routeArray = new Array();
            routeArray.push(busRouteModel.mainRoute);
            if (busRouteModel.spareRoute != "" && busRouteModel.spareRoute != null)
                routeArray.push(busRouteModel.spareRoute);

            for (var i = 0; i < routeArray.length; i++) {

                var nodeItems = routeArray[i].split(SEPARATOR);

                // 先将设备插入到busByItem表中
                for (var j = 0; j < nodeItems.length; j++) {
                    var node = nodeItems[j];
                    node = itemIdHandler(node);
                    if (node == "" || node == null)
                        continue;
                    if (insertBusByItem(node, busRouteModel.bussinessId, i, routeArray.length))
                        continue;
                    else
                        return false;
                }


                // 再将复用段插入到busByItem表中
                for (var j = 0; j < nodeItems.length - 1; j++) {
                    var linkName = nodeItems[j] + SEPARATOR + nodeItems[j + 1];
                    var linkId = itemIdHandler(linkName);
                    if (linkId == "") {
                        linkName = nodeItems[j + 1] + SEPARATOR + nodeItems[j];
                        linkId = itemIdHandler(linkName);
                    }

                    if (linkId == "" || linkId == null)
                        continue;

                    if (insertBusByItem(linkId, busRouteModel.bussinessId, i, routeArray.length))
                        continue;
                    else
                        return false;
                }

            }


            // 给起点和终点打上标记, 标记符为  "!"
            var nodeArray = routeArray[0].split(SEPARATOR);
            var start = nodeArray[0];
            var end = nodeArray[nodeArray.length - 1];
            start = itemIdHandler(start);
            end = itemIdHandler(end);

            var startRoute = busByItemTable.get(start);
            var endRoute = busByItemTable.get(end);

            var index1 = startRoute.indexOf(busRouteModel.bussinessId) - 1;
            startRoute[index1] = "!" + startRoute[index1];

            var index2 = endRoute.indexOf(busRouteModel.bussinessId) - 1;
            endRoute[index2] = "!" + endRoute[index2];

            return true;
        } catch (err) {
            //console.log(busRouteModel);
        }
    }


    /**
     * 将业务ID插入到busByItemTable中
     * @param item      设备/复用段ID
     * @param busId     业务ID
     * @param i         该设备/复用段 在该业务的主路由（0）或备用路由（1）
     * @param l         业务的路由数量，1或2
     * @returns {boolean}
     */
    var insertBusByItem = function (item, busId, i, l) {


        item = itemIdHandler(item);
        if (busByItemTable.has(item)) {
            var index = busByItemTable.get(item).indexOf(busId);

            // 设备/复用段 表项没有该业务ID
            if (index == -1) {
                var mark = "" + i + l;

                switch (mark) {
                    case "01":
                        var label = "1#";       // 业务busId主路由经过item，业务没有备用路由
                        var busArray = busByItemTable.get(item);
                        busArray.push(label);
                        busArray.push(busId);
                        return true;
                        break;

                    case '02':
                        var label = "10";        // 业务busId主路由经过item，备用路由不经过item
                        var busArray = busByItemTable.get(item);
                        busArray.push(label);
                        busArray.push(busId);
                        return true;
                        break;

                    case '11':
                        return false;
                        break;

                    case '12':
                        var label = "01";       // 业务busId的备用路由经过item，主用路由不经过item
                        var busArray = busByItemTable.get(item);
                        busArray.push(label);
                        busArray.push(busId);
                        return true;
                        break;

                }
            }

            else {
                var busArray = busByItemTable.get(item);
                var label = busArray[index - 1];
                if (i == 0)
                    label = '1' + label.substr(1);
                else if (i == 1)
                    label = label.substr(0, 1) + '1';
                busArray[index - 1] = label;

                return true;
            }
        }


        else {
            var mark = "" + i + l;

            switch (mark) {
                case "01":
                    var busArray = new Array();
                    var label = "1#";
                    busArray.push(label);
                    busArray.push(busId);
                    busByItemTable.set(item, busArray);
                    return true;
                    break;

                case "02":
                    var busArray = new Array();
                    var label = "10";
                    busArray.push(label);
                    busArray.push(busId);
                    busByItemTable.set(item, busArray);
                    return true;
                    break;

                case "11":
                    return false;
                    break;

                case "12":
                    var busArray = new Array();
                    var label = "01";
                    busArray.push(label);
                    busArray.push(busId);
                    busByItemTable.set(item, busArray);
                    return true;
                    break;
            }
        }

        return false;
    }


    /**
     * 删除 业务id数组
     * @param busIdArray
     */
    this.deleteBusList = function (busIdArray) {
        for (var i = 0; i < busIdArray.length; i++) {
            var busId = busIdArray[i];
            busByItemTable.forEach(function(value,key){
                var busArray = value;
                var busIndex = busArray.indexOf(busId);
                if (busIndex >= 0)
                    busArray.splice(busIndex - 1, 2);
            });
        }
    }



    // 在busByItemTable 中删除业务记录
    var deleteItemBusByBusId = function (busId) {

        busByItemTable.forEach(function(value,key){
            var busArray = value;
            var busIndex = busArray.indexOf(busId);
            if (busIndex >= 0)
                busArray.splice(busIndex - 1, 2);
        });

        return true;
    }



    /**
     * 处理itemId字符串
     * 将输入的itemId无论是中文还是code都同一成为code
     * @param itemId
     */
    var itemIdHandler = function (itemId){

        if (itemId == null || itemId == "")
            return "";

        if (typeof itemId == 'number')
            itemId = String(itemId);

        if (equipTable.has(itemId) || topoTable.has(itemId))
            return itemId;


        for (var i = 0; i < equipList.length; i++) {
            var equip = equipList[i];
            if (itemId == equip.netElementName)
                return equip.netElementId;
        }



        for (var i = 0; i < topoList.length; i++) {
            var topo = topoList[i];
            if (itemId == topo.linkName)
                return topo.linkId;
        }



        if (itemId.indexOf(SEPARATOR) != -1) {

            for (var i = 0; i < topoList.length; i++) {
                var topo = topoList[i];

                if (topo.endAName + SEPARATOR + topo.endZName == itemId)
                    return topo.linkId;

                if (topo.endZName + SEPARATOR + topo.endAName == itemId)
                    return topo.linkId;
            }
        }

        return "";

    }


    /**
     * 判断itemId是复用段还是网元
     * 网元返回0，复用段返回1，其他返回2
     * @param itemId
     */
    var isLinkOrElement = function (itemId) {
        if (equipTable.has(itemId))
            return 0;

        if (topoTable.has(itemId))
            return 1;

        return 2;
    }


    /**
     * 判断item这个能不能检修，true表示可以检修，false表示不能检修
     */
    var canMaintenanceItem = function (itemId) {
        if (typeof itemId == 'number')
            itemId = String(itemId);
        itemId = itemIdHandler(itemId);

        if (busByItemTable.has(itemId)) {
            var busArray = busByItemTable.get(itemId);
            for (var i = 0; i < busArray.length; i += 2) {
                var label = busArray[i];
                if (label[0] == '!' || label[0] == '1')
                    return false;
            }
        }

        return true;

    }


    /**
     *
     * 根据 itemId 返回一个 Node 或者 Link 的类型
     * @param itemId
     * @returns {*}
     */
    var getNodeOrLinkById = function (itemId) {
        var elementType = isLinkOrElement(itemId);


        // 设备
        if (elementType == 0) {
            var dataList = box.getDatas();
            for (var i = 0; i < dataList.size(); i++) {
                var dataItem = dataList.get(i);
                if (dataItem instanceof twaver.Node) {
                    var nodeId = dataItem.getClient('netElementId');
                    if (String(nodeId) == itemId)
                        return dataItem;
                }
            }
        }


        // 复用段
        else if (elementType == 1) {
            var dataList = box.getDatas();
            for (var i = 0; i < dataList.size(); i++) {
                var dataItem = dataList.get(i);
                if (dataItem instanceof twaver.Link && dataItem.getClient('linkId') == itemId) {
                    return dataItem;
                }
            }
        }
    }


    init();

}
