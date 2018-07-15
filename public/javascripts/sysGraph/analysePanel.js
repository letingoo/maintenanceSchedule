/**
 * Created by zmc on 2017/9/14.
 *
 * 生成显示网络分析结果的面板
 */





var AnalysePanel = {

    createNew: function () {
        var analysePanel = {};


        var resultPanel;        // 整个结果的面板
        var title;
        var tableGongNengName;
        var closeButton;        // 关闭按钮

        var resultTable;       // 表格
        var resultTableBody;   // 表格的body
        var flashUtil = FlashUtil.createNew();


        analysePanel.CreateAnalysePanel = function () {

            resultPanel = document.createElement('div');
            // resultPanel.style.background = "#F8F8FF";
            // resultPanel.style.padding = "2px";
            // resultPanel.style.height = "90%";
            // resultPanel.style.borderColor = "#337AB7";
            // resultPanel.style.borderWidth = "1px";
            // resultPanel.style.borderStyle = "solid";
            resultPanel.setAttribute("class", "table-responsive panel panel-primary");



            var titleDiv = document.createElement("div");
            titleDiv.setAttribute("class", "panel-heading");
            title = document.createElement('h5');
            title.setAttribute("align", "left");
            title.setAttribute("class", "panel-title");
            title.style.width = "50%";
            title.style.fontSize = "14px";
            title.style.display = "inline";
            title.innerHTML = "功能名称";




            closeButton = document.createElement("div");
            closeButton.setAttribute("id", "closePanelButton");
            closeButton.innerHTML = "<<";
            closeButton.style.display = "inline";
            closeButton.style.width = "20%";
            closeButton.style.marginLeft = "30%";

            titleDiv.appendChild(title);
            titleDiv.appendChild(closeButton);
            resultPanel.appendChild(titleDiv);


            resultTable = document.createElement("table");
            resultTable.setAttribute("class", "table");
            resultTable.style.marginBottom = "100px";

            var thead = document.createElement("thead");
            var tr1 = document.createElement("tr");
            tableGongNengName = document.createElement("th");
            tableGongNengName.innerHTML = "数据项"
            resultTableBody = document.createElement("tbody");

            tr1.appendChild(tableGongNengName);
            thead.appendChild(tr1);
            resultTable.appendChild(thead);
            resultTable.appendChild(resultTableBody);

            resultPanel.appendChild(resultTable)

            return resultPanel;
        };


        analysePanel.KeyNode = function (nodeArray, subGraphStr) {
            resultTableBody.innerHTML = "";
            title.innerHTML = "<b>关键点分析</b>";
            tableGongNengName.innerHTML = "割点";
            $("#rateLabel").remove();

            for (var i = 0; i < nodeArray.length; i++) {
                var tr = document.createElement("tr");
                var th = document.createElement("th");

                th.innerHTML = nodeArray[i].getName();
                th.setAttribute("name", nodeArray[i].getName());
                th.setAttribute("subGraph", subGraphStr[i]);
                th.setAttribute("class", "equipClass");

                tr.appendChild(th);

                resultTableBody.appendChild(tr);
            }

            setCloseButtonHandler();
            setEquipClickHandler();
        };


        analysePanel.CircuitRate = function (nodeArray, value) {
            resultTableBody.innerHTML = "";
            title.innerHTML = "<b>成环率分析</b>";
            tableGongNengName.innerHTML = "未成环节点"
            $("#rateLabel").remove();

            var rateLabel = document.createElement("h5");
            rateLabel.setAttribute("id", "rateLabel");
            rateLabel.innerHTML = "成环率： " + value;
            //rateLabel.style.marginTop = "40px";

            resultPanel.insertBefore(rateLabel, resultTable);

            for (var i = 0; i < nodeArray.length; i++) {
                var tr = document.createElement("tr");
                var th = document.createElement("th");

                th.innerHTML = nodeArray[i].getName();
                th.setAttribute("name", nodeArray[i].getName());
                th.setAttribute("class", "equipClass");

                tr.appendChild(th);
                resultTableBody.appendChild(tr);
            }

            setCloseButtonHandler();
            setEquipClickHandler();
        };


        analysePanel.Diameter = function (pathArray) {
            resultTableBody.innerHTML = "";
            title.innerHTML = "<b>网络直径分析</b>";
            tableGongNengName.innerHTML = "网络直径";
            $("#rateLabel").remove();

            for (var i = 0; i < pathArray.length; i++) {

                var path = pathArray[i].getNodeList();
                var pathStr = "";
                for (var j = 0; j < path.length - 1; j++) {
                    pathStr += path[j].getName();
                    pathStr += " -- ";
                }

                pathStr += path[path.length - 1].getName();

                var tr = document.createElement("tr");
                var th = document.createElement("th");
                th.setAttribute("class", "pathClass");

                th.innerHTML = path[0].getName() + " -- " + path[path.length - 1].getName();
                th.setAttribute("the_path", pathStr);

                tr.appendChild(th);
                resultTableBody.appendChild(tr);
            }

            setCloseButtonHandler();
            setPathClickHandler();
        }


        /**
         * 设置分析结果面板上关闭的触发函数，将结果面板隐蔽
         */
        function setCloseButtonHandler() {
            $("#closePanelButton").click(function () {
                networkPane.setLeft(null);
                networkPane.setBottom(null);
            });
        }


        /**
         * 设置分析结果面板上点击某一设备的触发函数，
         * 效果是 2.network上有闪烁效果
         */
        function setEquipClickHandler() {
            $(".equipClass").click(function () {

                // 将拓扑图上的元素的颜色恢复原状
                var dataList = network.getElementBox().getDatas();
                for (var i = 0; i < dataList.size(); i++) {
                    var dataItem = dataList.get(i);
                    dataItem.setStyle("inner.color", null);
                }


                $("#clickItem").css("background", '');
                $("#clickItem").attr("id", null);
                $(this).attr("id", "clickItem");
                $(this).css("background", "#D3D3D3");




                var equipName = $(this).attr("name");
                var subGapphStr = $(this).attr("subGraph");

                if (title.innerHTML == "<b>关键点分析</b>") {
                    networkPane.setBottom(analyseInfoPanel);
                    networkPane.setBottomHeight(100);
                    analyseInfoPanelManager.KeyNode(equipName, subGapphStr);
                }

                var dataList = network.getElementBox().getDatas();
                var targetNode;
                for (var i = 0; i < dataList.size(); i++) {
                    if (dataList.get(i).getName() == equipName) {
                        targetNode = dataList.get(i);
                        break;
                    }
                }

                // 将点击的设备放于拓扑图中央
                ///network.centerByLogicalPoint(targetNode.getX(), targetNode.getY(), true);

                FlashUtil.createNew().flashOneNode(targetNode, "#FF0000", true, false);


            });
        }


        /**
         * 设置分析结果面板上点击某一路径的触发函数
         * 效果是  1.network的中心移至该路径起点设备的坐标    2.整条路径闪烁
         */
        function setPathClickHandler() {

            $(".pathClass").click(function () {

                var dataList = network.getElementBox().getDatas();
                for (var i = 0; i < dataList.size(); i++) {
                    var dataItem = dataList.get(i);
                    dataItem.setStyle("inner.color", null);
                }


                $("#clickItem").css("background", '');
                $("#clickItem").attr("id", null);
                $(this).attr("id", "clickItem");
                $(this).css("background", "#D3D3D3");

                var path = $(this).attr("the_path");
                var nodeArray = path.split(" -- ");

                networkPane.setBottom(analyseInfoPanel);
                networkPane.setBottomHeight(100);
                analyseInfoPanelManager.Diameter(nodeArray);



                var flashNodes = analysePanel.getNodeByName(network, nodeArray);
                var flashLinks = analysePanel.getLinkByName(network, nodeArray);


                //network.centerByLogicalPoint(flashNodes[0].getX(), flashNodes[0].getY(), true);


                // 进行闪烁
                FlashUtil.createNew().flashPath(flashNodes.concat(flashLinks), "#FF0000", true, false);
            });
        }


        analysePanel.getNodeByName=function (network,nodeArray) {
            // 找到需要闪烁的节点
            var dataList = network.getElementBox().getDatas();
            var flashNodes = new Array();
            for (var i = 0; i < dataList.size(); i++) {

                if (dataList.get(i) instanceof twaver.Node) {

                    if (nodeArray.indexOf(dataList.get(i).getName()) != -1)
                        flashNodes.push(dataList.get(i));
                }
            }
            return flashNodes;
        }
        analysePanel.getLinkByName=function (network,nodeArray) {
            var dataList = network.getElementBox().getDatas();
            // 找到需要闪烁的连线
            var flashLinks = new Array();

            var allLinkList = new Array();

            for (var i = 0; i < dataList.size(); i++) {
                if (dataList.get(i) instanceof twaver.Link)
                    allLinkList.push(dataList.get(i));
            }
            for (var i = 0; i < nodeArray.length - 1; i++) {

                var nodeAName = nodeArray[i];
                var nodeZName = nodeArray[i + 1];

                for (var j = 0; j < allLinkList.length; j++) {
                    var link = allLinkList[j];
                    if (link.getClient("endAName") == nodeAName && link.getClient("endZName") == nodeZName ||
                        link.getClient("endAName") == nodeZName && link.getClient("endZName") == nodeAName) {
                        flashLinks.push(link);
                        break;
                    }
                }
            }
            return flashLinks;

        }
        return analysePanel;
    },




    createInfoNew: function () {
        var infoPanelManager = {};


        var infoPanel;          // 详细信息面板
        var closeButton;        // 关闭按钮

        var infoTable;          // 信息表格
        var infoTableBody;

        var column1;
        var column2;
        var column3;

        infoPanelManager.CreateInfoPanel = function () {
            infoPanel = document.createElement("div");
            infoPanel.style.width = "100%";

            infoTable = document.createElement("table");
            infoTable.setAttribute("class", "table table-bordered");
            infoTable.style.tableLayout = "fixed";
            infoTable.style.marginBottom = "40px";
            infoTable.style.width = "97%";
            infoTable.style.table = "table-responsive";

            infoPanel.appendChild(infoTable);
            infoPanel.style.background = "#F8F8FF";
            var thead = document.createElement("thead");
            var tr1 = document.createElement("tr");


            column1 = document.createElement("th");
            column2 = document.createElement("th");
            column3 = document.createElement("th");


            tr1.appendChild(column1);
            tr1.appendChild(column2);
            tr1.appendChild(column3);
            thead.appendChild(tr1);

            infoTableBody = document.createElement("tbody");
            infoTable.appendChild(thead);
            infoTable.appendChild(infoTableBody);


            closeButton = document.createElement("div");
            //closeButton.setAttribute("type", "button");
            //closeButton.style.backgroundImage = "url(images/closeButton.jpg)";

            var span = document.createElement("span");
            span.innerHTML = "×";
            closeButton.appendChild(span);
            closeButton.style.height = "20px";
            closeButton.style.float = "right";
            closeButton.onclick = function () {
                networkPane.setBottom(null);
            };


            //column3.appendChild(closeButton);
            return infoPanel;
        }


        infoPanelManager.Diameter = function (nodeArray) {
            column1.innerHTML = "网络直径";
            column2.innerHTML = "直径端点";
            column3.innerHTML = "直径路径";

            column1.style.width = "10%";
            column2.style.width = "20%";
            column3.style.width = "70%";

            column3.appendChild(closeButton);
            infoTableBody.innerHTML = "";

            var tr = document.createElement("tr");
            var td1 = document.createElement("td");
            var td2 = document.createElement("td");
            var td3 = document.createElement("td");
            td3.style.wordWrap = "break-word";

            td1.innerHTML = "" + nodeArray.length - 1;
            td2.innerHTML = nodeArray[0] + " -- " + nodeArray[nodeArray.length - 1];
            td3.innerHTML = nodeArray.join(" -- ");

            tr.appendChild(td1);
            tr.appendChild(td2);
            tr.appendChild(td3);

            infoTableBody.appendChild(tr);


        }


        infoPanelManager.KeyNode = function (point, subGraphInfo) {
            column1.innerHTML = "关键点";
            column2.innerHTML = "子网数量";
            column3.innerHTML = "子网规模";

            column3.appendChild(closeButton);
            column1.style.width = "20%";
            column2.style.width = "10%";
            column3.style.width = "70%";

            infoTableBody.innerHTML = "";

            var tr = document.createElement("tr");
            var td1 = document.createElement("td");
            var td2 = document.createElement("td");
            var td3 = document.createElement("td");

            td1.innerHTML = "" + point;
            td2.innerHTML = subGraphInfo.split(",").length;
            td3.innerHTML = subGraphInfo;

            tr.appendChild(td1);
            tr.appendChild(td2);
            tr.appendChild(td3);
            infoTableBody.appendChild(tr);

        }




        infoPanelManager.CircuitRate = function () {
            column1.innerHTML = "关键点";
            column2.innerHTML = "子网数量";
            column3.innerHTML = "子网规模";

            column1.style.width = "50px";
            column2.style.width = "200px";
            column3.style.width = "300px";
            column3.appendChild(closeButton);

            infoTableBody.innerHTML = "";

            var tr = document.createElement("tr");
            var td1 = document.createElement("td");
            var td2 = document.createElement("td");
            var td3 = document.createElement("td");

            td1.innerHTML = "" + point;
            td2.innerHTML = subGraphInfo.split(",").length;
            td3.innerHTML = subGraphInfo;

            tr.appendChild(td1);
            tr.appendChild(td2);
            tr.appendChild(td3);
            infoTableBody.appendChild(tr);
        }

        return infoPanelManager;
    }

}