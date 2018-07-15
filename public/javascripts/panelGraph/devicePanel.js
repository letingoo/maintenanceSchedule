/**
 * Created by yzl on 2017/7/28.
 */


jQuery(document).ready(function() {
    init();
});

var init= function () {
    var box = new twaver.ElementBox();
    var network = new twaver.vector.Network(box);
    var baseI=twaver.vector.interaction.BaseInteraction ( network );
    var  ports = new twaver.List();
    var cards = new twaver.List();
    var popupMenu = graphUtil.createMenu(network);
   new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.disk+parent.versionId+"/"+$("input[name='netElementId']").val()).then(
       function (data) {
           console.dir(data);
           initBtn();
           initNetwork();
           initListener();
           registImages();
           initBox(data);
           console.log("1111");
          console.dir(network.getInteractions());
           network.setToolTipEnabled(false);

       }
   );

    /**
     * 初始化页面按钮响应
     */
    function initBtn () {
        $('.btn-submit').on('click',function () {
            var data=$('.modal-form').serializeArray();
            console.dir(this);
            if($(this).hasClass("btn-edit-submit")){
                ajaxUtil.submitResource(DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.disk+parent.versionId+"/"+$('input[name="netElementId"]').val()+
                    '/'+$('input[name="diskId"]').val(),data,"patch")
                    .then(function (data) {
                        parent.modalLocator.showSuccessMsg();
                    })
                    .catch(function(err){
                        parent.modalLocator.showErrMsg(err.responseText);
                    });
            }
            else if($(this).hasClass("btn-add-submit")){
                var flag=true;
                //检查是否已存在对应槽位
                cards.forEach(function (data) {
                    if(data.getClient("slotId")==$('select[name="slotId"]').val())
                        flag=false;
                })
                if(flag){
                    ajaxUtil.submitResource(DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.disk+parent.versionId+"/"+$('input[name="netElementId"]').val(),data,"post")
                        .then(function (data) {
                            createCard(cardContainer,data);
                            parent.modalLocator.showSuccessMsg();
                        })
                        .catch(function(err){
                            parent.modalLocator.showErrMsg(err.responseText);
                        });
                }
                else{
                    parent.modalLocator.showErrMsg("该槽位已存在机盘，请重新选择槽位");
                }


            }
        })
    }

    /**
     * 初始化network监听
     */
    function  initListener() {
        var graphListener=function(e){
            popupMenu.clearMenu();
            if(e.element){
                if((e.element).getClient("type")=="card"){
                    popupMenu.addMenuItems(1,'Node',"查看详细信息",showSpec);
                    popupMenu.addMenuItems(1,'Node',"删除机盘",deleteDisk);
                    popupMenu.addMenuItems(1,'Node',"修改机盘属性",modDisk);
                }
                else{
                    popupMenu.addMenuItems(1,'Node',"添加机盘",addDisk);
                }
            }
            popupMenu.generateMenus();
        };
        network.addInteractionListener(graphListener);

        // network.getView().addEventListener('mouseover', function (e) {
        //     console.log("xxxx");
        // });

    }
    function modDisk(cardData) {
        initModalDataList().then(function () {
            $("#modal_disk").modal("toggle").find(".modal-footer").show();
            $('.btn-submit').addClass('btn-edit-submit').removeClass('btn-add-submit');
            $("#modal_disk input[type='text'],#modal_disk select").removeAttr("disabled");
            formUtil.fillJsonToForm($("#modal_disk"), cardData._clientMap);
        });
    }
    function addDisk(cardData) {
        initModalDataList().then(function () {
            $("#modal_disk").modal("toggle").find(".modal-footer").show();
            //  $("#modal_disk input[type='text']")

            $("#modal_disk input[type='text'],#modal_disk select").val("").removeAttr("disabled");
            $("#modal_disk select[name='slotId']").val(cardData.getName());

            $('.btn-submit').addClass('btn-add-submit').removeClass('btn-edit-submit');
        });
    }
    function showSpec(cardData) {
        initModalDataList().then(function () {
            $("#modal_disk").modal("toggle").find(".modal-footer").hide();
            $("#modal_disk input[type='text'],#modal_disk select").attr("disabled","disabled");
            formUtil.fillJsonToForm($("#modal_disk"),cardData._clientMap);
        })
    }
    /**
     * 初始化模态框内所需远程信息
     */
    function initModalDataList() {
        if(!$("#modal_disk select[name='slotId']")[0].options.length){
            for(var i=0;i<15;i++)
                $("#modal_disk select[name='slotId']")[0].options.add(new Option((i+1)+"",(i+1)+""));
        }
        return new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.amplifier+parent.versionId).then(function (data) {
            $("#modal_disk select[name='diskType']")[0].options.length=0;
            $.each(data,function (index,element) {
                $("#modal_disk select[name='diskType']")[0].options.add(new Option(element.amplifierName,element.amplifierName));
            });
        })

    }
    function deleteDisk(cardData) {
        //for ie
        var deleteList=new Array();
        deleteList.push(cardData.getClient("diskId"));

        new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.disk+parent.versionId+
            "/"+cardData.getClient("netElementId"),deleteList,"delete")
            .then(function () {
                cards.remove(cardData);
                box.remove(cardData);
                parent.modalLocator.showSuccessMsg();
            })
            .catch(function(err){
                parent.modalLocator.showErrMsg(err.responseText);
            });
    }
    function initBox(cardData){
        box.clear();
        var first = createNode(null, 16, 11, "chassis9");
        first.setStyle('outer.padding', 1);
        cardContainer = createNode(first, 44, 27, null, 638, 269);
        cardContainer.setStyle('vector.fill.color', '#AAAAAA');
        cardContainer.setStyle('outer.padding', -1);
        cardContainer.setStyle('vector.deep', -4);
        cards.clear();
        for(var i=1;i<=15;i++){
            createCard(cardContainer, i);
        }
        $.each(cardData,function (index,element) {
            cards.add(createCard(cardContainer, element));
        })

    }
    function initNetwork(){
        //   $('body').height= $('#content_wrapper').width();
        var toolbar=graphUtil.createNetworkToolbar(network);
        var networkPane = new twaver.controls.BorderPane(network, toolbar);
        networkPane.setTopHeight(25);
        $('body').append(networkPane.getView());
        networkPane.adjustBounds({x:0,y:0,width:document.documentElement.clientWidth,height:document.documentElement.clientHeight});
        window.onresize = function (e) {
            networkPane.adjustBounds({x:0,y:0,width:document.documentElement.clientWidth,height:document.documentElement.clientHeight});
        };



    }
    function registImages() {
        graphUtil.registerImage("../images/chassis/bolt01.png",network);
        for (var i = 1; i <= 10; i++) {
            graphUtil.registerImage("../../images/chassis/chassis" + i + ".png",network);
        }
    }

    /**
     * 请通过createcard使用，而不是直接调用此接口
     * @param parent
     * @param x
     * @param y
     * @param image
     * @param w
     * @param h
     * @param name
     * @param type
     * @returns {Follower}
     */
    function createNode(parent, x, y, image, w, h,name,type) {
        var node = new twaver.Follower();
        node.setName(name);
        node.setClient("type",type||"");
        // node.setStyle('outer.padding', 2);
        // node.setStyle('select.color', '#6A6A6A');

        node.setStyle('alarm.position', 'center');
        node.setParent(parent);
        node.setMovable(false);
        node.setHost(parent);
        node.setLocation(x, y);
        if (w) node.setWidth(w);
        if (h) node.setHeight(h);
        if (image != null) {
            node.setImage(image);
        } else {

            node.setStyle('body.type', 'vector');
            node.setStyle('vector.gradient', 'none');
            node.setStyle('vector.shape', 'rectangle');
            node.setStyle('vector.cap', 'round');
            node.setStyle('vector.deep', 1);

        }
        if(type=="card"){
            node.setStyle('inner.color', '#6A6A6A');
            node.setStyle('outer.color', '#B5B5B5');
            node.setStyle('vector.fill.color','#B5B5B5');
        }
        else if(type=="blank"){
            node.setStyle('inner.color', '#202222');
            node.setStyle('outer.color', '#000000');
            node.setStyle('vector.fill.color','#000000');
        }
        box.add(node);
        return node;
    }

    /**
     * network上创建机盘，
     * @param parent
     * @param cardData
     * @returns {*}
     */
    function createCard(parent, cardData) {


        if(cardData instanceof Object){
            var node = createNode(parent, 44 + 43 * (cardData.slotId-1), 27, null, 43, 268,cardData.slotId,"card");
            for(var key in cardData) {
                node.setClient(key, cardData[key]);
            }
            createNode(node, node.getX() + 16, node.getY() + 10, "bolt01");
            createNode(node, node.getX() + 16, node.getY() + node.getHeight() - 27, "bolt01");
            return node;
        }
        else{
            var node = createNode(parent, 44 + 43 * (cardData-1), 27, null, 43, 268,cardData,"blank");
        }
    }

}






