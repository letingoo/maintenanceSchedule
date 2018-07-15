/**
 * Created by yzl on 2017/7/10.
 */
var util={};


util.ajaxUtil={
    newAsyncAjaxRequest:function(url,data,options){
        var JsonObj={};
        (data===undefined)?null:JsonObj.data=data;

        return new Promise(function(resolve, reject) {
            console.log("ajax request，url:"+url);
            $.ajax({
                data:data===undefined?null:JSON.stringify(JsonObj),
                dataType: "json",
                crossDomain:true,
                type:(options===undefined)?"get":options,
                url:url,
                timeout:10000,
                success:function(data,status,xhr){
                    console.log("resolve data:"+data);
                    //              console.log(JSON.stringify(data));
                    resolve(data);
                },
                error: function (data, status, e) {
                    if(!data.responseText)
                        data.responseText="后端发生未知错误";
                        reject(data);


                }
            });
        });
    },

};


module.exports = util;

