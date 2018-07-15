/**
 * Created by yzl on 2017/6/22.
 * 写的比较早，没封装
        */



var formUtil={
    /**
     * 将表格序列数据转换为json
     * @param data
     * @returns {{}}
     * @constructor
     */
    SerializeArrayToJson:function (data) {
        var Info = {};
        for (var item in data) {
            Info[data[item].name] = data[item].value;
        }
        return Info;
    },
    /**
     * 将json数据填充到form input中
     * @param formElement 表单或含单个表单元素的节点
     * @param jsonData
     */
    fillJsonToForm:function (formElement,jsonData) {
        for(var key in jsonData){
            if($(formElement).find("input[name="+key+"]").length>0)
                $(formElement).find("input[name="+key+"]").val(jsonData[key]);
            else if($(formElement).find("select[name="+key+"]").length>0)
               // $(formElement).find("select[name="+key+"]").find("option[text="+key+"]").attr("selected", true);
               $(formElement).find("select[name="+key+"]").val(jsonData[key]);
            else if($(formElement).find("textarea[name="+key+"]").length>0){
                $(formElement).find("textarea[name="+key+"]").val(jsonData[key]);
            }
        }
    },
    /**
     * 表单验证，返回promise
     * @param elementContainsForm 一个仅含一个验证表单的元素
     * @returns {Promise}
     */
    validateForm:function (elementContainsForm) {
        var errData={};
        return new Promise(function (resolve,reject) {
            // console.log($(elementContainsForm).find(' input[type="text"], select').length);
            /**
             * 非空验证，若以后有添加其他需验证，可以进一步封装
             */
            $(elementContainsForm).find('input[type="text"], select').each(function (index,element) {
                if(!$(element).hasClass("formData-nullValid")){
                    if($(element).val()==null||""){

                        errData.errMsg="表单内存在空项，请检查输入";
                        errData.errElement=$(element);
                        reject(errData);
                        return false;

                    }
                }
            });
            resolve();
        });
    }

};



/**
 * 封装ajax请求，返回一个promise，与async配合使用风味更佳
 * 理论上应该只有一个options，奈何当时傻逼了hhh
 * @type {{newAsyncAjaxRequest: ajaxUtil.newAsyncAjaxRequest, newAsyncTextRequest: ajaxUtil.newAsyncTextRequest}}
 */
var ajaxUtil={
    myDate:new Date(),
/**
     * 将serializearray类型转为服务端dto对象
     * @param url
     * @param data seralizeArray类型数据
     * @param method ajax方法
     * @param appendArgs 附加值，用于内嵌对象，请用array类型
     * @returns {ajaxUtil.newAsyncAjaxRequest}
     */
    submitResource:function(url,data,method,appendArgs){

        var jsonData=formUtil.SerializeArrayToJson(data);
        if(appendArgs)
            $.extend(true,jsonData,appendArgs);
        console.dir("forminfo:"+JSON.stringify(jsonData));
        return new ajaxUtil.newAsyncAjaxRequest(url,jsonData,method);
    },
    /**
     *
     * @param url
     * @param data
     * @param method
     * @param options 参数，现在可设置强行resolve
     * @returns {Promise}
     */
    newAsyncAjaxRequest:function(url,data,method,options){
        document.body.style.cursor = "wait";
        console.log(ajaxUtil.myDate.toLocaleTimeString()+"url:"+url);
    if(data)
            console.log(JSON.stringify(data));
        return new Promise(function(resolve,reject) {
                $.ajax({
                    data:data?JSON.stringify(data):undefined,
                    dataType: "json",
                    crossDomain:true,
                    contentType:"application/json;charset=UTF-8",
                    method:!method?undefined:method,
                    type:!method?"get":"post",
                    url:url,
                    success:function(data,status,xhr){
                        if(xhr.status>400){
                            console.dir(data);
                            reject(data);
                        }
                        else
                            resolve(data);
                        document.body.style.cursor = "default";
                    },
                    error: function (data, status, e) {
                        console.log("responseData:",data);
                        document.body.style.cursor = "default";
                        if(options&&options.forceResolve){
                            resolve(data.responseText);
                        }
                        else
                            reject(data);
                    }
                });

        });
    },
};


var UIUtil={
    setAllModalDraggable:function (windowElement) {
        $(windowElement).on("show.bs.modal", ".modal", function(){
            $(this).draggable({
                // containment:"window",
                iframeFix: true,//
            });
            var userAgent = window.navigator.userAgent;
            if (userAgent.indexOf('WOW') < 0 && userAgent.indexOf("Edge") < 0){
                $(this).css({"overflow":"hidden","max-width":"1000px","max-height":"700px"});

                $(this).find(".modal-content").css({"overflow-y":"hidden","overflow-x":"hidden","max-height":"650px"});
            }
            else{
                $(this).css({"overflow":"hidden","max-width":"1000px","max-height":"700px"});

                $(this).find(".modal-content").css({"overflow-y":"hidden","overflow-x":"hidden","max-height":"650px"});
            }

        });
    },
    appendCloseBtn:function (parentElement,fn) {
        var newBtn=$('<div style="text-align: right; padding-right: 10px" > <button class="close " type="button">×</button> </div>');
        $(newBtn).click=fn();
        $(parentElement).prepend(newBtn);
    },
    /**
     * option需传入ajax方法对应值，以及select所需的key，val值
     * @param options
     * @param selectElement
     */
    adaptSelectList:function (options,selectElement) {
        $(selectElement)[0].options.length=0;
       return new ajaxUtil.newAsyncAjaxRequest(options.url,options.data,options.method).then(function (dataList) {
           if(options.blank){
               $(selectElement)[0].options.add(new Option());
           }
            $.each(dataList,function (index,ele) {
                $(selectElement)[0].options.add(options.key?new Option(ele[options.key],ele[options.val]):new Option(ele,ele));
            });
        })

    }
};

var generalUtil={
    /**
     * 版本保存
     */
    saveVersion:function (versionId,modalLocator) {
        new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.version+"save/"+versionId,undefined,"patch").then(function () {
                modalLocator.showSuccessMsg("保存成功");
            },
            function (msg) {
                modalLocator.showErrMsg(msg.responseText);
            });

    }
}

//table生成工具，请先引用bootstrap-table
//使用表格导出相关功能时，请使用前先引入tableExport.js、bootstrap-table-export.js
var tableUtil={
    /**
     *
     * @param table 对应table节点
     * @param sourceUrl 连接
     * @param tableAttrList 展示属性键值对，请参照mock接口表匹配所需数据
     * @param options //暂时无用
     */
    createTable:function(table,sourceUrl,tableAttrList,options){
        table.bootstrapTable('destroy');
        table.bootstrapTable({
                url: sourceUrl?sourceUrl:undefined,// 请求后台的URL（*）
                method: 'get', //请求方式（*）
                locale:'zh-CN',
                checkbox:'true',
                singleSelect:options?options.singleSelect: true,
                showPaginationSwitch:options?options.showToolbar:true,
                 onClickRow:options?options.Click:undefined,
                onDblClickRow:options?options.doubleClick:null,
                showToggle:options?options.showToolbar:true,
                showRefresh:options?options.showToolbar:true,
                data:options?options.data:undefined,
            //表格导出相关配置
            exportDataType: 'all',  //导出表格方式（默认basic：只导出当前页的表格数据；
                                    // all：导出所有数据；selected：导出选中的数据）
            showExport:options&&'showExport' in  options?options.showExport:false,  //是否显示导出按钮
            buttonsAlign:"right",  //按钮位置
            exportTypes:['excel'],  //导出文件类型
            Icons:'glyphicon-export',
            exportOptions:{
                ignoreColumn: [],  //忽略某一列的索引
                worksheetName: 'sheet1',  //表格工作区名称
                tableName: '导出数据',
            },

                search:options?options.searchBar:true,//搜索
             strictSearch:false,
                striped: true,                      //是否显示行间隔色
                cache: false,                       //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
                pagination:options?options.pagination:true,                   //是否显示分页（*）
                sortable: false,                     //是否启用排序
                sortOrder: "asc",                   //排序方式
                //  queryParams: oTableInit.queryParams,//传递参数（*）
                sidePagination: "client",           //分页方式：client客户端分页，server服务端分页（*）好像现在不支持server分页233
                pageNumber:1,                       //初始化加载第一页，默认第一页
                pageSize: 10,                       //每页的记录行数（*）
                pageList: [10, 25, 50, 100,1000,'All'],        //可供选择的每页的行数（*）
                clickToSelect: true,                //是否启用点击选中行
                uniqueId: "id",                     //每一行的唯一标识，一般为主键列
                cardView: false,                    //是否显示详细视图
                detailView: false,                   //是否显示父子表
                columns:tableAttrList,

            }
        );
    }
};


//拓扑图生成工具,请先引入twaver
var graphUtil={
    registerImage: function (url, svg) {
        var image = new Image();
        image.src = url;
        var views = arguments;
        image.onload = function () {
            twaver.Util.registerImage(graphUtil.getImageName(url), image, image.width, image.height, svg === true);
            image.onload = null;
            for (var i = 1; i < views.length; i++) {
                var view = views[i];
                if (view.invalidateElementUIs) {
                    view.invalidateElementUIs();
                }
                if (view.invalidateDisplay) {
                    view.invalidateDisplay();
                }
            }
        };
    },
    getImageName: function (url) {
        var index = url.lastIndexOf('/');
        var name = url;
        if (index >= 0) {
            name = url.substring(index + 1);
        }
        index = name.lastIndexOf('.');
        if (index >= 0) {
            name = name.substring(0, index);
        }
        return name;
    },
    addButton:function(toolbar, label, src, handler) {
        var button = document.createElement('input');
        button.value = label;
        button.onclick = handler;
        button.setAttribute('type', src ? 'image' : 'button');

        if (src) {
            button.style.padding = '4px 4px 4px 4px';
            //button.style.padding = '4px 4px 4px 4px';
            if (src.indexOf('/') < 0) {
                src = '../images/toolbar/' + src + '.png';
            }
            button.setAttribute('src', src);
        } else {
            button.style.verticalAlign='top';
            button.value = label;
        }
        toolbar.appendChild(button);
    },
    createNetworkToolbar:function (network,extraFunc) {
        var toolbar= document.createElement('div');
        graphUtil.addButton(toolbar, 'Pan', 'pan', function () {
        });
        graphUtil.addButton(toolbar, 'Zoom In', 'zoomIn', function () {
            network.zoomIn();
        });
        graphUtil.addButton(toolbar, 'Zoom Out', 'zoomOut', function () {
            network.zoomOut();
        });
        graphUtil.addButton(toolbar, 'Zoom Overview', 'zoomOverview', function () {
            network.zoomOverview();
        });
        graphUtil.addButton(toolbar, 'Zoom Reset', 'zoomReset', function () {
            network.zoomReset();
        });
        if(extraFunc!==undefined){
            alert("loadingextrafunc");
            extraFunc();
        }

        return toolbar;
    },


    /**
     * graph菜单
     * @param network
     * @returns {PopupMenu}
     */
    createMenu:function (network) {
        var popupMenu= new twaver.controls.PopupMenu(network);
        popupMenu.network=network;
        popupMenu.lastData=null;
        popupMenu.items=[];
        popupMenu.clearMenu=function () {
            popupMenu.items.length=0;
        };
        popupMenu.isVisible = function(menuItem) {
            if (this.lastData) {
                if ( this.lastData instanceof twaver.SubNetwork && menuItem.group === 'SubNetwork') {
                    return true;
                }
                if ( this.lastData instanceof twaver.Group && menuItem.group === 'Group') {
                    return true;
                }
                if ( this.lastData instanceof twaver.Link && menuItem.group === 'Link') {
                    return true;
                }
                if ( this.lastData instanceof twaver.Node && menuItem.group === 'Node') {
                    return true;
                }
            } else {
                return menuItem.group === 'none';
            }
        };
        /**
         *
         * @param menuId
         * @param menuGroup 所属组,请对应isVisible内的属性
         * @param menuLabel 标签
         * @param fn 对应功能
         */
        popupMenu.addMenuItems=function(menuId, menuGroup, menuLabel,fn) {
            var self = this;
            var Item = {
                label: menuLabel,
                group: menuGroup,
                //设计这个的怕不是脑子有坑
                action:fn?function () {
                    fn(popupMenu.lastData);
                }:null,
            };
            this.items.push(Item);
        };
        popupMenu.generateMenus=function() {
            if (this.items.length == 0) {
                return;
            }
            this.setMenuItems(this.items);
        };
        popupMenu.onMenuShowing=function(e) {
            popupMenu.lastData = this.network.getSelectionModel().getLastData();
            return true;
        };
        return popupMenu;
    },

    createNode:function(nodeData){
        var node = new twaver.Node();
        node.setName(nodeData.netElementName);
        for(var key in nodeData) {
            node.setClient(key, nodeData[key]);
        }
        if(node.getClient("netElementType").indexOf("OTM")>0)
            node.setImageUrl("images/otm.png");
        else if(node.getClient("netElementType").indexOf("OLA")>0)
            node.setImageUrl("images/ola.png");
        node.setLocation(nodeData.coordinateX, nodeData.coordinateY);
       return node;
    },
    createLink:function (linkData,box) {
        var  nodeA = new twaver.Node();
        var  nodeZ = new twaver.Node();
        box.forEach(function(item){
            if(item instanceof twaver.Node){
                if(item.getClient("netElementId")==linkData.endAId)
                    nodeA=item;
                if(item.getClient("netElementId")==linkData.endZId)
                    nodeZ=item;
            }
        });
        //待修改，很冗余
        if(nodeA.getName()&&nodeZ.getName()){
            var link = new twaver.Link(nodeA, nodeZ);
            for(var key in linkData) {
                link.setClient(key, linkData[key]);
            }
        }
        return link;

    },

    /**
     *
     * @param box
     * @param NodeData
     * @param LinkData
     */
    initBoxFromJson:function (box,NodeData,LinkData){
        box.clear();
        console.log("initBox:linkdata:"+LinkData.length+"\tnodeata:"+NodeData.length);
        //node生成，存储所有json内部属性
        $.each(NodeData,function(index,element){
            box.add(graphUtil.createNode(element));
        });
        //link生成，找到端点设备的链路才生成链路，存储所有json内部属性
        $.each(LinkData,function(index,element){
            box.add(graphUtil.createLink(element,box));
        });
    }
};


/**
 *
 * @type {{createNew: FlashUtil.createNew}}
 */
var FlashUtil = {
     createNew:function () {

         var flashNode;           // 需要闪烁的节点
         var flashPath;           // 需要闪烁的路径
         var flashTimer;
         var flashTimes;          // 闪烁的次数
         var flashColor;          // 闪烁的颜色
         var flashEnd = true;    // 上一次闪烁是否闪烁完毕，暂时不能多个选中目标同时闪烁



         var flashUtilInstance={};



         /**
          * 单点闪烁
          */
         flashUtilInstance.flashOneNode=function (node, color, staticFlag, flashFlag) {
             // if (!flashEnd)
             //     return;

             // 只变色不闪烁的情况
             if (!flashFlag && staticFlag)
                 node.setStyle("inner.color", color);

             else if (flashFlag) {
                 flashNode = node;
                 flashColor = color;
                 flashTimes = 0;
                 changeOneNodeColor();
                 flashTimer = setInterval(function() { changeOneNodeColor(staticFlag); }, 1000);
             }


             //flashEnd = false;

         };
         /**
          * 单点闪烁的变色函数
          */
         var changeOneNodeColor=function(staticFlag) {
             flashNode.setStyle("inner.color", flashColor);
             setTimeout(function() {checkOneNodeTimes(staticFlag); }, 500);
         };

         /**
          * 还原network样式
          * @param network
          */
         flashUtilInstance.clearNetwork=function (network) {
             network.getElementBox().forEach(function (element) {
                 if(element instanceof twaver.Node)
                     element.setStyle("inner.color",undefined);
                 else if(element instanceof twaver.Link){
                     element .setStyle("inner.color", undefined);
                     element .setStyle("link.pattern", undefined);

                 }

             });

         };


         /**
          * 闪烁一条路径
          * @param itemArray —— 需要变色或闪烁的 设备/链路
          * @param color —— 闪烁或变色的颜色
          * @staticFlag —— 最终是否变色
          * @flashFlag —— 是否闪烁
          */
         flashUtilInstance.flashPath=function (itemArray, color,staticFlag, flashFlag) {
             // if (!flashEnd)
             //     return;

             // 只需要变色
            if (!flashFlag && staticFlag) {
                for (var i = 0; i < itemArray.length; i++)
                    itemArray[i].setStyle("inner.color", color);


            }


            else if (flashFlag) {

                flashColor = color;
                flashEnd = false;
                flashTimes = 0;
                flashPath = itemArray;


                // 进行闪烁
                changePathColor();
                flashTimer = setInterval(function () { changePathColor(staticFlag); }, 1000);
            }
         };
         /**
          * 路径闪烁的变色函数
          */
         var changePathColor=function(staticFlag) {
             for (var i = 0; i < flashPath.length; i++) {
                 flashPath[i].setStyle("inner.color", flashColor);
             }

             setTimeout(function(){ checkPathTimes(staticFlag); }, 500);
         };

         /**
          * 单点闪烁时检查闪烁次数
          */
         var checkOneNodeTimes=function(staticFlag) {
             flashNode.setStyle("inner.color", undefined);
             flashTimes++;
             if (flashTimes == 3) {
                 clearInterval(flashTimer);
                 if (staticFlag)
                     flashNode.setStyle("inner.color", flashColor);
                 flashEnd = true;
             }
         };


         /**
          * 路径闪烁时检查闪烁次数
          */
         var checkPathTimes=function(staticFlag) {

             for (var i = 0; i < flashPath.length; i++) {
                 flashPath[i].setStyle("inner.color", undefined);
             }

             flashTimes++;
             if (flashTimes == 3) {
                 clearInterval(flashTimer);
                 flashEnd = true;

                 if (staticFlag) {
                     for (var i = 0; i < flashPath.length; i++)
                         flashPath[i].setStyle("inner.color", flashColor);
                 }
             }
         };

         return flashUtilInstance;
     },

};
