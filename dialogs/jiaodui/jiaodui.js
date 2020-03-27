/**
 * Created by zhang.xiaohau.
 * Time: 2017-11-14
 * 将js从html中提出来
 */

(function(){
    function getZChtml(json) {
        var li = "";
        for (var key in json) {
            var Pos = json[key];
            var faultValue = Pos.STOPWORD;
            var rightValue = Pos.SUBSTITUTE;

            li += '<li><span class="label label-default cw">' + faultValue + '</span>&nbsp;推荐正确词：' + rightValue + ' </li>';

        }

        var html = [
            //'<li style=" font-size: 18px;">字词错误有 ' + json.length + '个:</li>',
            '<li style=" font-size: 18px;">字词错误有 :</li>',
            '<br>',
            li,
            '<br><br>'
        ].join("");

        return html;
    }

    function getNullhtml() {
        return '<br><br><li style=" font-size: 18px;">未校对出异常结果！</li>';
    }

    function init() {
        var text = editor.getContentTxt();
        var type = ["字词", "敏感词"];

        //ajax.request("http://govdev.dev3.trs.org.cn/gov/detector/check/text", {
        //ajax.request("http://localhost/jiaodui", {
        $.ajax({
            type: "post",
            url: "/gov/gov.do",
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            headers: {//使参数为formdata形式
                'formdata': '1',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: {
                "serviceid": "gov_stopword",
                "methodname": "checkStopWord",
                "CHECKCONTENT": text
            },
            success: function(_json) {
                try {
                    //var json = JSON.parse(_json);
                    var json = _json;
                    var isSuccess = json.ISSUCCESS;
                    // if (isSuccess && json.data["字词"]) {
                    if (isSuccess && json.DATA) {
                        json.DATA.length > 0 ? $("#jiaodui").html(getZChtml(json.DATA)) : $("#jiaodui").html('未校对出错误');
                    } else {
                        // $("#jiaodui").html("未校对出错误结果！");
                        $("#jiaodui").html(json.MSG);
                    }
                } catch (ex) {
                    alert(ex);
                }
                //editor.execCommand('insertHtml',html);
            },
            error: function() {
                alert("请配置web服务器以解决跨域问题!");
                //document.getElementById("jiaodui").innerHTML = getNullhtml();
            }
        });
        /*ajax.request("/gov/gov.do", {
            'timeout': 10000,
            'dataType': '',
            'data': {
                "serviceid": "gov_stopword",
                "methodname": "checkStopWord",
                "CHECKCONTENT": text
            },
            'method': 'get',
            'onsuccess': function (r) {
               try {
                    var json = JSON.parse(r.responseText);
                    var isSuccess = json.ISSUCCESS;
                    if (isSuccess && json.DATA) {
                        $("#jiaodui").html(getZChtml(json.DATA));
                    } else {
                        $("#jiaodui").html(json.MSG);
                    }
                } catch (ex) {
                    alert(ex);
                }
            },
            'onerror': function () {
                alert("校对失败!");
            }
        });*/
    }
    init();

    dialog.onok = function() {
        var html = editor.getContent();
    };
})();