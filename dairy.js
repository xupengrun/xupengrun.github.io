'use strict'

var DiaryItem = function (text) {
    if (text) {
        var obj = JSON.parse(text);
        this.title = obj.title;
        this.content = obj.content;
        this.mode = obj.mode;
        this.address = obj.address;
        this.date = obj.date;
    }

};

DiaryItem.prototype = {
    toString: function () {
        return JSON.stringify(this)
    }
};

var TheDiary = function () {
    LocalContractStorage.defineMapProperty(this, "arrayMap");
    LocalContractStorage.defineMapProperty(this, "dataMap");
    LocalContractStorage.defineProperty(this, "size");
    LocalContractStorage.defineMapProperty(this, "data", {
        parse: function (text) {
            return new DiaryItem(text);
        },
        stringify: function (o) {
            return o.toString();
        }
    });
};

TheDiary.prototype = {
    init: function () {
        this.size = 0;
    },

    save: function (title, mode, address, content) {
        if (!title || !content || !mode || !address) {
            throw new Error("empty title or content")
        }

        if (title.length > 20 || content.length > 500 || address.length > 50 || mode.length > 10) {
            throw new Error("title address mode or content   exceed limit length")
        }
        var date = new Date().Format("yyyy-MM-dd")
        var from = Blockchain.transaction.from;
        var diaryItem = this.data.get(date);
        if (diaryItem) {
            throw new Error("You can record only once a day");
        }

        diaryItem = new DiaryItem();
        diaryItem.author = from;
        diaryItem.title = title;
        diaryItem.content = content;
        diaryItem.date = date;
        diaryItem.mode = mode;
        diaryItem.address = address;

        this.data.put(date, diaryItem);
        this.data.put(title, diaryItem);
    },

    get: function (title) {
        if (!title) {
            throw new Error("empty title")
        }
        return this.data.get(title);
    },
    len:function(){
        return this.size;
    },

    forEach: function(limit, offset){
        limit = parseInt(limit);
        offset = parseInt(offset);
        if(offset>this.size){
            throw new Error("offset is not valid");
        }
        var number = offset+limit;
        if(number > this.size){
            number = this.size;
        }
        var result  = "";
        for(var i=offset;i<number;i++){
            var key = this.arrayMap.get(i);
            var object = this.dataMap.get(key);
            result += "index:"+i+" key:"+ key + " value:" +object+"_";
        }
        return result;
    }

};
Date.prototype.Format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1,                 //月份
        "d+": this.getDate(),                    //日
        "h+": this.getHours(),                   //小时
        "m+": this.getMinutes(),                 //分
        "s+": this.getSeconds(),                 //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds()             //毫秒
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return fmt;
};

module.exports = TheDiary;