/**
 * Created by yzl on 2017/8/16.
 */

/**
 * 主页选项卡导航条,create 返回一个navibar对象，里面集成了对应方法
 * @type {{CreateNew: NavigateBar.CreateNew}}
 */
var NavigateBar={
    CreateNew:function (parentElement) {

        var naviBar={};
        //private args
        var Tablist=[];
        var focusFrame;
        var bar=document.createElement("ul");

        $(bar).addClass("nav nav-tabs");
        $(bar).css({
            // "margin-left": "60px",
        "flex":"0 0 88%",
        "order":"-1",
        "height": "100%",
        "border-bottom":"0px"
        });
        $(parentElement).append(bar);

        function escapeJquery(srcString) {
            // 转义之后的结果
            var escapseResult = srcString;

            // javascript正则表达式中的特殊字符
            var jsSpecialChars = ["\\", "^", "$", "*", "?", ".", "+", "(", ")", "[",
                "]", "|", "{", "}"];

            // jquery中的特殊字符,不是正则表达式中的特殊字符
            var jquerySpecialChars = ["~", "`", "@", "#", "%", "&", "=", "'", "\"",
                ":", ";", "<", ">", ",", "/"];

            for (var i = 0; i < jsSpecialChars.length; i++) {
                escapseResult = escapseResult.replace(new RegExp("\\"
                    + jsSpecialChars[i], "g"), "\\"
                    + jsSpecialChars[i]);
            }

            for (var i = 0; i < jquerySpecialChars.length; i++) {
                escapseResult = escapseResult.replace(new RegExp(jquerySpecialChars[i],
                    "g"), "\\" + jquerySpecialChars[i]);
            }

            return escapseResult;
        }

        naviBar.closeTab=function(event) {
           // 通过该button找到对应li标签的id
            let li_id = $(this).parent().attr('id');
            let frameId = li_id.replace("tab_a_","");
            //如果关闭的是当前激活的TAB，激活他的前一个TAB
            if ($(bar).find("li.active").find("a").attr('id') == li_id) {
                     $(bar).find("li.active").prev().addClass("active");
            }
            //关闭TAB
            console.log(escapeJquery(li_id));
            $('#'+escapeJquery(li_id)).remove();
            removeFrame(frameId);
        };


        /**
         * 关闭所有选项卡，若需要打开新的选项卡，则按照option格式填写next对象
         * @param next
         */
        naviBar.closeAll=function (next) {
            $.each(Tablist,function (index,frame) {
                $(frame).remove();
            });

            Tablist.splice(0,Tablist.length);
            $(bar).empty();
            if(next)
                naviBar.addTab(next);
        };


        //option:
        //tabName:当前tab的名称
        //tabTitle:当前tab的标题
        //tabUrl:当前tab所指向的URL地址,frameID,tabID标识
        naviBar.addTab=function(options){
          //  console.dir(options);
            $(Tablist).each(function(index,ele){
                $(ele).hide();
            });
            if(options){
                if(checkTabIsExists(options.tabUrl)){
                    $("#"+"tab_a_"+escapeJquery(options.tabUrl)).click();
                }
                else{
                    $(".nav-tabs li").removeClass("active");
                    let liId="tab_a_"+options.tabUrl;
                    var newTab=$('<li  class="active" ><a href="#tab_content_" style=" float: left;white-space: nowrap" data-toggle="tab" id="'+liId+'">' +
                        '<button class="close closeTab"  type="button" ">×' +
                        '</button>'+options.tabTitle+'</a></li>');
                    newTab.find("button").on("click",naviBar.closeTab);
                    newTab.find("a").on("click",tabClick);
                    $(bar).append(newTab);
                    addFrame(options);
                }
            }




        };

        var tabClick=function(event){
            event.preventDefault();
            let frameId = this.id.replace("tab_a_","");
            changeFrame(frameId);
        };
        //iframe切换
        var changeFrame=function(frameId) {
            $(Tablist).each(function(index,ele){
                if(ele.id==frameId){
                    $(ele).show();
                   // 受不了了，只能写这么丑陋了，因为box添加数据时要是iframe处于hide状态貌似会报错，dispathevent都不一定能行
                    if(ele.id=="osnrGraph"&&window.sessionStorage.getItem("refreshFlag")&&window[ele.id].circleDisplay.getCircleId()==window.sessionStorage.getItem("refreshCircle")){
                        window[ele.id].circleDisplay.changeCircleGraph(window.sessionStorage.getItem("refreshCircle"));
                        window.localStorage.setItem("refreshFlag",undefined);
                    }

                }

                else
                    $(ele).hide();
            });
        };
        var removeFrame=function(frameId) {
         //   alert(focusFrame.id+"xxx"+frameId);
            $(Tablist).each(function(index,ele){
                if(ele.id==frameId){
                    $(ele).remove();
                    Tablist.splice(index,1);
                    if(index>0&&(frameId==focusFrame.id)){
                        focusFrame=Tablist[index-1];
                        $(focusFrame).show();
                    }

                    return false;
                }
            });
        };
        //选项卡关闭事件

        var addFrame=function(options){
            var centerFrame = document.createElement('iframe');
            centerFrame.id=options.tabUrl;
            centerFrame.name=options.tabUrl;
            centerFrame.setAttribute('width', '100%');
            centerFrame.setAttribute('height', '100%');
            centerFrame.setAttribute('frameBorder', 0);
            centerFrame.setAttribute('scrolling', 'yes');
            centerFrame.setAttribute('allowfullscreen', true);
            centerFrame.setAttribute('webkitAllowfullscreen', true);
            centerFrame.setAttribute('mozAllowfullscreen', true);
            centerFrame.setAttribute('position', 'absolute');
            centerFrame.setAttribute('src',options.tabUrl);

            $(options.frameContainer).append($(centerFrame));
            Tablist.push(centerFrame);
            focusFrame=centerFrame;
        };
        function checkTabIsExists(frameId){
            let flag=false;
            $(Tablist).each(function(index,ele){
                if(ele.id==frameId){
                    flag=true;
                    return false;//break;
                }
            });
            return flag;
        }

        return naviBar;

    }
};
