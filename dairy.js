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
    LocalContractStorage.defineMapProperty(this, "accountMap",{
        parse: function (text) {
            return JSON.parse(text);
        },
        stringify: function (o) {
            return JSON.stringify(o);
        }
    });
    LocalContractStorage.defineMapProperty(this, "openPrivacyMap");
    LocalContractStorage.defineMapProperty(this, "arrayMap");
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
        this.openPrivacySize = 0;
    },

    save: function (title, mode, address, content, account, privacy) {
        if (!title || !content || !mode || !address) {
            throw new Error("empty title or content")
        }
        if (!account) {
            throw new Error("empty account")
        }

        if (title.length > 20 || content.length > 500 || address.length > 50 || mode.length > 10) {
            throw new Error("title address mode or content   exceed limit length")
        }
        var date = new Date().Format("yyyy-MM-dd")
        var from = Blockchain.transaction.from;

        this.size += 1;
        this.diaryItem = new DiaryItem();
        this.diaryItem.author = from;
        this.diaryItem.title = title;
        this.diaryItem.content = content;
        this.diaryItem.date = date;
        this.diaryItem.mode = mode;
        this.diaryItem.address = address;
        //从账户map取出用户内容
        var accountObj = this.accountMap.get(account);
        //用户内容index 数组,用于遍历
        var indexs = []
        var indexsMap = {};
        if (accountObj === null) {
            accountObj = [];
            accountObj.push(indexs);
            accountObj.push(indexsMap);

        }
        indexs = accountObj[0];
        indexsMap = accountObj[1];
        if (indexs === null) {
            indexs = [];
        }
        if (indexsMap === null) {
            indexsMap = {};
        }
        var diaryItem = this.arrayMap.get(indexsMap[date]);
        if (diaryItem) {
            throw new Error("You can record only once a day");
        }
        indexs.push(this.size);
        //将日期保存
        indexsMap[date] = diaryItem;

        privacy = parseInt(privacy);
        this.arrayMap.put(this.size, diaryItem);
        //公开的日记,保存索引
        if (privacy === 1) {
            this.openPrivacySize += 1;
            this.openPrivacyMap.put(this.openPrivacySize, this.size);
        }
        this.accountMap.put(accountObj);
        return accountObj;
    },

    get: function (date, account) {
        if (!date || !account) {
            throw new Error("empty date or account")
        }
        var accountObj = this.accountMap.get(account);
        if (accountObj === null) {
            throw new Error("account has no data");
        }
        var indexsMap = accountObj.get[1];
        return this.arrayMap.get(indexsMap[date]);
    },
    randomGet: function (account) {
        if (!account) {
            throw new Error("empty account")
        }
        var accountObj = this.accountMap.get(account);
        if (accountObj === null) {
            throw new Error("account has no data");
        }
        var indexs = accountObj.get[0];
        var randomIndex = parseInt(indexs.length * Math.random())
        return this.arrayMap.get(indexs[randomIndex]);
    },
    len: function () {
        return this.size;
    },
    openLen: function () {
        return this.openPrivacySize;
    },
    //遍历个人日记记录
    forEachAccount: function (limit, offset, account) {
        var accountObj = this.accountMap.get(account);
        var indexs = accountObj.get[0];
        limit = parseInt(limit);
        offset = parseInt(offset);
        if (accountObj === null) {
            throw new Error("account has no data");
        }
        if (offset > indexs.length) {
            throw new Error("offset is not valid");
        }
        var number = offset + limit;
        if (number > indexs.length) {
            number = indexs.length;
        }
        var result = "";
        for (var i = offset; i < number; i++) {
            var key = indexs.get(i);
            var object = this.arrayMap.get(key);
            result += "index:" + i + " key:" + key + " value:" + object + "_";
        }
        return result;
    },
    //遍历所有公开的日记
    forEachOpen: function (limit, offset) {
        limit = parseInt(limit);
        offset = parseInt(offset);
        if (offset > this.openPrivacySize) {
            throw new Error("offset is not valid");
        }
        var number = offset + limit;
        if (number > this.openPrivacySize) {
            number = this.openPrivacySize;
        }
        var result = "";
        for (var i = offset; i < number; i++) {
            var key = this.openPrivacyMap.get(i);
            var object = this.arrayMap.get(key);
            result += "index:" + i + " key:" + key + " value:" + object + "_";
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