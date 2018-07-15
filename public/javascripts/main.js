'use strict';
jQuery(document).ready(function() {

    // "use strict";
    // Init Theme Core
    Core.init();
    // window.history.pushState('forward', null, '#'); //在IE中必须得有这两行

});



var modalLocator=new ModalLocator();
console.dir(modalLocator);
var tabNavigator=NavigateBar.CreateNew($("#tab_page"));
var Core = function(options) {
    var focusFrame;
	var Body = $('body');


	var runSideMenu = function(options) {
		var sbOnLoadCheck = function() {
			if (!$('body.sb-l-o').length && !$('body.sb-l-m').length && !$('body.sb-l-c').length) {
				$('body').addClass(options.sbl);
			}
			if (!$('body.sb-r-o').length && !$('body.sb-r-c').length) {
				$('body').addClass(options.sbr);
			}
			if (Body.hasClass('sb-l-m')) {
				Body.addClass('sb-l-disable-animation');
			} else {
				Body.removeClass('sb-l-disable-animation');
			}
			// if ($(window).width() < 1080) {
			// 	Body.removeClass('sb-r-o').addClass('mobile-view sb-l-m sb-r-c');
			// }
		};
		var sbOnResize = function() {
		// 	if ($(window).width() < 1080 && !Body.hasClass('mobile-view')) {
		// 		Body.removeClass('sb-r-o').addClass('mobile-view sb-l-m sb-r-c');
		// 	} else if ($(window).width() > 1080) {
		// 		Body.removeClass('mobile-view sb-l-m sb-r-c').addClass();
		// 	} else {
		// 		return;
		// 	}
      //      // $('#content_wrapper').width=$(window).width()-$('.sidebar-menu').width();
      //       $("#content_wrapper").width= $(window).width()-$('.sidebar-menu').width();
      //       $("#tab_page").width= $(window).width()-$('.sidebar-menu').width();
      // //      $(focusFrame).width= $(window).width()-$('.sidebar-menu').width();
		};
		var triggerResize = function() {
			setTimeout(function() {
				$(window).trigger('resize');
				if (Body.hasClass('sb-l-m')) {
					Body.addClass('sb-l-disable-animation');
				} else {
					Body.removeClass('sb-l-disable-animation');
				}
			},
			300)
		};
		sbOnLoadCheck();
		var rescale = function() {
			sbOnResize();
		};
		var lazyLayout = _.debounce(rescale, 300);
		$(window).resize(lazyLayout);
		$('#sidebar_left .sidebar-menu').hover(function() {
			if (!$('body.sb-l-m').length) {
				return;
			}
			Body.addClass('sb-subitem-open');
		//	console.log('hover over');
		},
		function() {
			if (!$('body.sb-l-m').length) {
				return;
			}
			Body.removeClass('sb-subitem-open');
		});
		var usermenuItems = $('.user-menu').find('a');
		$('.sidebar-menu-toggle').click(function(e) {
			e.preventDefault();
			$('.user-menu').toggleClass('usermenu-open').slideToggle('fast');
			if ($('.user-menu').hasClass('usermenu-open')) {
				usermenuItems.addClass('animated fadeIn');
			}
		});
		$('.sidebar-menu li a.accordion-toggle').click(function(e) {
		//	e.preventDefault();
			if ($('body').hasClass('sb-l-m') && !$(this).parents('ul.sub-nav').length) {
				return;
			}
			if (!$(this).parents('ul.sub-nav').length) {
				$('a.accordion-toggle.menu-open').next('ul').slideUp('fast', 'swing',
				function() {
					$(this).attr('style', '').prev().removeClass('menu-open');
				});
			} else {
				var activeMenu = $(this).next('ul.sub-nav');
				var siblingMenu = $(this).parent().siblings('li').children('a.accordion-toggle.menu-open').next('ul.sub-nav');
				 activeMenu.slideUp('fast', 'swing',function() {
					$(this).attr('style', '').prev().removeClass('menu-open');});
				siblingMenu.slideUp('fast', 'swing',function() {
					$(this).attr('style', '').prev().removeClass('menu-open');
				});
			}
			if (!$(this).hasClass('menu-open')) {
				$(this).next('ul').slideToggle('fast', 'swing',
				function() {
					$(this).attr('style', '').prev().toggleClass('menu-open');
				});
			}
		});
	};


	var runAnimations = function() {
		setTimeout(function() {
			$('body').addClass('onload-check');
		},
		100);
		$('.animated-delay[data-animate]').each(function() {
			var This = $(this);
			var delayTime = This.data('animate');
			var delayAnimation = 'fadeIn';
			if (delayTime.length > 1 && delayTime.length < 3) {
				delayTime = This.data('animate')[0];
				delayAnimation = This.data('animate')[1];
			}
			var delayAnimate = setTimeout(function() {
				This.removeClass('animated-delay').addClass('animated ' + delayAnimation).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend',
				function() {
					This.removeClass('animated ' + delayAnimation);
				});
			},
			delayTime);
		});
		$('.animated-waypoint').each(function(i, e) {
			var This = $(this);
			var Animation = This.data('animate');
			var offsetVal = '35%';
			if (Animation.length > 1 && Animation.length < 3) {
				Animation = This.data('animate')[0];
				offsetVal = This.data('animate')[1];
			}
			var waypoint = new Waypoint({
				element: This,
				handler: function(direction) {
					console.log(offsetVal);
					if (This.hasClass('animated-waypoint')) {
						This.removeClass('animated-waypoint').addClass('animated ' + Animation).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend',
						function() {
							This.removeClass('animated ' + Animation);
						});
					}
				},
				offset: offsetVal
			});
		});
	};


	var initNetwork=function(){
        $(".sidebar-menu li a").click(function(){
        	var self=this;
            ajaxUtil.newAsyncAjaxRequest("userInfo").then(
            	function (data) {
                    var options={
                        frameContainer:$("#content_wrapper"),
                        tabTitle:$(self).text(),
                        tabUrl:$(self).attr('page'),
                    };
                    //资源同步
                    if(options.tabUrl=="sync")
                    {
                        var bar=modalLocator.initProgressBar();
                        bar.showProgressBar();
                        //没有参数时传默认版本号，蠢毙了
                        new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.version+"synchronize/"+(window.versionId||"100000000373")).then(function (data) {
                                bar.finish(function () {
                                    var modifiedData=[];
                                    var modifyRule={
                                        "businessChange":"业务",
                                        "diskChange":"机盘",
                                        "linkChange":"链路",
                                        "netElementChange":"网元",
                                    };
                                    for (var key in data){
                                        console.log (key);
                                        for(var rule in modifyRule ){
                                            if(rule==key)
                                                modifiedData.push({record_name:modifyRule[rule],record_detail:data[key]})
                                        }
                                    }
                                    $('#modal_sync table').bootstrapTable('load',modifiedData);
                                    $('#modal_sync').modal('show');
                                });
                                new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+DEFAULT_OPTIONS.Prefix.version+"save/"+window.versionId,undefined,"patch")
                                    .then(function (data) {

                                    })
                            },
                            function (reject) {
                                bar.intercept(function () {
                                    modalLocator.showErrMsg("数据同步失败，请检查网络状态及版本字典是否合理");
                                })
                            });
                    }
                    else if(options.tabUrl=="logout"){
                        console.log(window.location.href);
                        window.location.href=window.location.href.replace("main","logout");
                    }
                    else if(options.tabUrl){
                        tabNavigator.addTab(options);
                    }
            },
			function (err) {
				window.location.reload();

			});

        });

    };


    var initMenu=function(){
			$("#resource_contents li a").hide();

	};
	var getUserInfo=function(){
    	ajaxUtil.newAsyncAjaxRequest("userInfo").then(function (data) {
			if(data){
                window.User=data;
                $("#usr-data").text("当前用户："+data.userName);
                return Promise.resolve(data);
			}

			else
                modalLocator.showErrMsg("未知错误，请重试");
        });
	};

	var initTable=function () {
        var syncSpecList=[
            {field:"record_name",title:"同步资源"},
            {field:"record_detail",title:"同步资源数量变化"}
        ];
        tableUtil.createTable($('#modal_sync table'),null,syncSpecList);
    };

    var initObserver=function(){
		window.Observer=(function () {
			var msg={};
			return {
				regist:function (type,fn) {
					typeof msg[type] ==='undefined'?msg[type]=[fn]:msg[type].push(fn);
                },
                /**
				 *
                 * @param type
                 * @param args
                 */
				fire:function (type,args) {
					if(msg[type]){
						var events={
							type:type,
							args:args||{}
						};
					}
					msg[type].forEach(function (fn) {
						fn.call(this,events);
                    })
                },
				remove:function () {

                }

			}
        })();
	};

	return {
		init: function(options) {
			var defaults = {
				sbl: "sb-l-o",
				sbr: "sb-r-c",
				collapse: "sb-l-m",
				siblingRope: true
			};
			var options = $.extend({},
			defaults, options);
			getUserInfo();
			runAnimations();
			runSideMenu(options);
			initObserver();
			initNetwork();
            initTable();
            initMenu();
		},
	}
} ();
