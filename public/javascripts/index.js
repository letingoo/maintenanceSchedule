/**
 * Created by yzl on 2017/10/11.
 */
'use strict';
var modalLocator=new ModalLocator();
jQuery(document).ready(function() {
    initDom();
    if($('#logincheck').attr("value")==1)
        modalLocator.showErrMsg("用户名或密码错误，请重试");
    lockHistory();
});

var lockHistory=function () {
    $(window).on('popstate', function (e) {
        window.history.pushState('forward', null, '#');
        window.history.forward(1);
    });
    window.history.pushState('forward', null, '#');
    window.history.forward(1);
};

var initDom=function () {
    var codeGraph=getGVerify({parentContainer:$('.code-graph')});
    $('form')[0].onsubmit=function (e) {
        console.log($('.code-graph input').val());
        if(codeGraph.validate($('.code-graph input').val()))
            return true;
        else{
            modalLocator.showErrMsg("验证码错误，请重试");
            return false;
        }
    }

};


