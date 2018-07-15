/**
 * Created by yzl on 2017/6/19.
 */
//集成util里所有util使用样例

/**
 *
 * @returns {Promise.<Array>}
 */
async function testasnyc() {
    var recvArr= new Array();
    recvArr.push("xxxx")
    // recvArr.push(await ajaxUtil.newAsyncAjaxRequest("http://192.168.6.198:8080/equips/cordinates/华为"));
    // recvArr.push(await ajaxUtil.newAsyncAjaxRequest("http://192.168.6.198:8080/topolinks/list"));
    return recvArr;
};


var tableList=new Array();
tableList.push({checkbox:true});
tableList.push({field:"linkId",title:"链路序列"});
tableList.push({field:"linkName",title:"链路名称"});
tableUtil.createTable($('#UserList'),DEFAULT_OPTIONS.DB_Interface+"/topolinks/list",tableList);

