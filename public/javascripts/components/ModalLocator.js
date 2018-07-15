/**
 * Created by yzl on 2017/11/23.
 */
var ModalLocator=function () {
    var basicModal=function () {
        this.dom=$('<div class="modal " tabindex="-1" style="width:max-content;height: max-content" role="dialog" aria-labelledby="success" aria-hidden="true">'+
            '<div class="modal-dialog" style=" width: max-content;max-width:768px; " role="dialog">'+
            '<div class="modal-content">'+
            '<div class="panel ">'+
            '<div class="panel-heading">'+
            '<h3 class="panel-title"></h3>'+
            '</div>'+
            '<div class="panel-body" style="font-size:25px;text-align:center;margin:0 auto;background-color: aliceblue;">'+
            '<span aria-hidden="true"> '+
            '</span></div>'+
            '<div class="modal-footer" style="background-color: aliceblue;">'+
            '<button type="button" class="btn btn-primary btn-submit-confirm" data-dismiss="modal">是</button>'+
            '<button type="button" class="btn btn-secondary" data-dismiss="modal">否</button>'+
            '<button type="button"  class="btn btn-default" data-dismiss="modal">确定</button>'+
            '</div>'+
            '</div></div></div>');

        $(this.dom).find('.panel').css({
            margin:0,
        });
        $(this.dom).find('.panel-heading').css({
            height:25,
        })
        $(this.dom).find('.panel-footer').css({
            padding:"5px",

        })
        if(!!window.ActiveXObject || "ActiveXObject" in window){

        }
        $(this.dom).find('.modal-dialog').css({
            width:"inherit",
        })
        $(this.dom).find('span').css({
            "max-width":"768px",
            "text-align":"justify"
        })
        $(this.dom).css({
            'left': '50%',
            'top': '60%',
            'transform': "translate(-50%,-50%)",
        });


        this.transform=function (panelStyle,borderColor,unuseBtn,span) {
            $(this.dom).find('.panel').addClass(panelStyle).css("border-color", borderColor);
            $(this.dom).find(unuseBtn).hide();
            $(this.dom).find('.panel-body span').addClass(span);
        }
    };
    basicModal.prototype={
        showMsg:function (msg) {
            $(this.dom).find('.panel-body span').text(msg);
            $(this.dom).modal({backdrop:false});
        }
    };
    var alertModal=function () {
        basicModal.call(this);
        $(this.dom).find('.panel').addClass("panel-info").css("border-color", '#196EB8');
        $(this.dom).find('.panel-heading').css('background-color','#196EB8');
        $(this.dom).find('.btn-primary,.btn-secondary').hide();
        $(this.dom).find('.panel-body span').addClass("fa fa-times-circle-o ");
    };
    alertModal.prototype=new basicModal();
    var infoModal=function () {
        basicModal.call(this);
        $(this.dom).find('.panel').addClass("panel-info").css("border-color", '#196EB8');
        $(this.dom).find('.panel-heading').css('background-color','#196EB8');
        $(this.dom).find('.btn-primary,.btn-secondary').hide();
        $(this.dom).find('.panel-body span').addClass("fa fa-info-circle info");
    };
    infoModal.prototype=new basicModal();
    var confirmModal=function () {
        basicModal.call(this);
        $(this.dom).find('.panel-heading').css('background-color','#196EB8');
        this.transform("panel-info", '#196EB8','.btn-default',"fa fa-exclamation-circle")
    };
    confirmModal.prototype=new basicModal();
    confirmModal.prototype.showMsg=function (title,msg,fn) {
        $(this.dom).find('.modal-title').text(title);
        basicModal.prototype.showMsg.call(this,msg);
        $(this.dom).find('.btn-submit-confirm').on("click",function () {
            fn?fn():console.log("no confirm fn");
        })
    };
    var successModal=function () {
        basicModal.call(this);
        $(this.dom).find('.panel-heading').css('background-color','#196EB8');
        this.transform("panel-info", '#196EB8','.modal-footer',"fa fa-check-circle");
        //艹你妈的逼ie，连max-content都不支持
        if(!!window.ActiveXObject || "ActiveXObject" in window)  {
            $(this.dom).css({
                width:200
            }).find('.fa').removeClass('fa fa-check-circle');
        }
    }
    successModal.prototype=new basicModal();
    successModal.prototype.showMsg=function (msg) {
        $(this.dom).find('.panel-body span').text(msg);
        $(this.dom).fadeIn(100).modal({backdrop:false}).fadeOut(2500);
    }


    var progressModal=function () {
        this.finFlag=0;
        basicModal.call(this);
        $(this.dom).css({
            width:"auto"
        })
        $(this.dom).find('.modal-footer').hide();
        $(this.dom).find('.panel').remove();
        $(this.dom).find('.modal-content').text("同步中，请稍候").append(
            $('<div class="progress progress-striped active">'+
            ' <div class="progress-bar progress-bar-info" role="progressbar"'+
            'aria-valuenow="60" aria-valuemin="0" aria-valuemax="100">' +
            '  </div> </div> '));
        $(this.dom).find('.modal-content').css("padding","20px");
        $(this.dom).find(".progress-bar").css("width","0%");
    }
    progressModal.prototype=new basicModal();
    /**
     * 弹出进度条并显示
     * 返回一个对象，finish方法用于数据加载完毕后关闭进度条，intercept方法用于中断进度条
     * 如果有传入fn参数，则调用
     */
    progressModal.prototype.showProgressBar=function () {
        var num=0,percentProgress,self=this;//need closure
        var GetRandomNum=function(Min,Max) {
            var Range = Max - Min;
            var Rand = Math.random();
            return(Min + Math.round(Rand * Range));
        };
        $(self.dom).modal({
            backdrop:false,
        }).modal('show');
        var interval= setInterval(function () {
            if(self.finFlag<0){
                window.clearInterval(interval);
                $(self.dom).modal('hide');
            }
            else if(self.finFlag>0){
                percentProgress="100%"
                $(self.dom).delay(2000).modal('hide');
                window.clearInterval(interval);
            }
            else if(num<90){
                num += GetRandomNum(1,10);
                percentProgress=num+"%"
                $(self.dom).find('.progress-bar').css("width",percentProgress);
            }

        },300);
    };
    progressModal.prototype.finish=function (fn) {
        this.finFlag=1;
        fn?fn():null;
    };
    progressModal.prototype.intercept=function (fn) {
        this.finFlag=-1;
        fn?fn():null;
    };

    return{
        showErrMsg:function (msg) {
            return new alertModal().showMsg(msg);
        },
        showSuccessMsg:function(msg){
            return new successModal().showMsg(msg||"操作成功!");
        },
        showInfoMsg:function(msg){
            return new infoModal().showMsg(msg);
        },
        showConfirmMsg:function(title,msg,fn){
            return new confirmModal().showMsg(title,msg,fn);
        },
        initProgressBar:function () {
            return new progressModal();
        }
    };
  //  return modalLocator;
    
};
