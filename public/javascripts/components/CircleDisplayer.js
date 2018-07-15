/**
 * Created by yzl on 2018/3/15.
 */
function circleDisplayer(parentContainer,box) {
    this.box=box;
    this.circleName=undefined;
    this.container=parentContainer;
    this.circleSelector=$(
     ' <li role="presentation" class="active">'  +
     '<a class="dropdown-toggle" value="" data-toggle="dropdown" href="#" role="button" aria-haspopup="true" aria-expanded="false">'   +
     '  </a>'+
     '<ul class="dropdown-menu circle-display">'   +
     '  <li><a href="#" >北环</a></li>' +
    '<li><a href="#" >东环</a></li>'+
    '<li><a href="#" >西环</a></li>'+
    '<li><a href="#" >全网</a></li>'+
    '</ul> </li>'
    );
}

circleDisplayer.prototype.changeCircleGraph=function (circleName) {

    var self=this;
    this.circleName=circleName;
    $(this.circleSelector).find('.dropdown-toggle ').html('环路选择:'+circleName+' <span class="caret"></span> ');
    var recvArr= [];
    recvArr.push(new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+ DEFAULT_OPTIONS.Prefix.links+parent.versionId+"/"+(circleName=="全网"?"":circleName)));
    recvArr.push(new ajaxUtil.newAsyncAjaxRequest(DEFAULT_OPTIONS.DB_Interface+
        DEFAULT_OPTIONS.Prefix.netElements+parent.versionId+"/"+(circleName=="全网"?"":circleName)));
    return Promise.all(recvArr).then(function(GraphData){
        graphUtil.initBoxFromJson(self.box,GraphData[1],GraphData[0]);
    });
};

circleDisplayer.prototype.getCircleId=function () {
    if(this.circleName=="全网")
        return "";
    else
        return this.circleName;
};

circleDisplayer.prototype.init=function () {
    var self=this;
    $(this.circleSelector).find('.dropdown-menu').on('click',function (e) {
        self.changeCircleGraph(e.target.innerText);
    });
    $(this.container).append(this.circleSelector);
};
