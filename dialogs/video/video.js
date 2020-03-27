/**
 * Created by JetBrains PhpStorm.
 * User: taoqili
 * Date: 12-2-20
 * Time: 上午11:19
 * To change this template use File | Settings | File Templates.
 */

(function () {
    var video = {},
        uploadVideoList = [],
        isModifyUploadVideo = false,
        uploadFile,
        fileConfig;

    window.onload = function () {
        $focus($G("videoUrl"));
        initTabs();
        fileConfig = initUploadFileConfig();
        initVideo();
        initUpload();
    };
    //初始化上传文件配置信息（支持上传的大小和格式）
    function initUploadFileConfig() {
        var fileconfig = '';
        ajax.request("/gov/gov.do", {
            'timeout': 10000,
            'dataType': '',
            'async': false,
            'data': {
                "serviceid": "gov_config",
                "methodname": "queryUploadFileConfig",
                "TYPE": 3
            },
            'method': 'get',
            'onsuccess': function (r) {
                r = JSON.parse(r.responseText);
                fileconfig = r.DATA;
            },
            'onerror': function () {
                alert("获取文件上传白名单及大小失败!");
            }
        });
        return fileconfig;
    }
    /* 初始化tab标签 */
    function initTabs() {
        var tabs = $G('tabHeads').children;
        for (var i = 0; i < tabs.length; i++) {
            domUtils.on(tabs[i], "click", function (e) {
                var j, bodyId, target = e.target || e.srcElement;
                for (j = 0; j < tabs.length; j++) {
                    bodyId = tabs[j].getAttribute('data-content-id');
                    if (tabs[j] == target) {
                        domUtils.addClass(tabs[j], 'focus');
                        domUtils.addClass($G(bodyId), 'focus');
                    } else {
                        domUtils.removeClasses(tabs[j], 'focus');
                        domUtils.removeClasses($G(bodyId), 'focus');
                    }
                }
            });
        }
    }

    function initVideo() {
        createAlignButton(["videoFloat", "upload_alignment"]);
        addUrlChangeListener($G("videoUrl"));
        addOkListener();
        /* 自定义自动播放选项的事件绑定 */
        $('#upload_autoplay').find('[type=radio]').on('change', function () {
            if ($(this).index() === 2) {
                $('.ap-group').show();
            } else {
                $('.ap-group').hide();
            }
        });

        //编辑视频时初始化相关信息
        (function () {
            var img = editor.selection.getRange().getClosedNode(),
                url;
            if (img && img.className) {
                var hasFakedClass = (img.className == "edui-faked-video"),
                    hasUploadClass = img.className.indexOf("edui-upload-video") != -1;
                if (hasFakedClass || hasUploadClass) {
                    $G("videoUrl").value = url = img.getAttribute("_url");
                    $G("videoWidth").value = img.width;
                    $G("videoHeight").value = img.height;
                    $G("videoMasid").value = img.masid;
                    var align = domUtils.getComputedStyle(img, "float"),
                        parentAlign = domUtils.getComputedStyle(img.parentNode, "text-align");
                    updateAlignButton(parentAlign === "center" ? "center" : align);
                }
                if (hasUploadClass) {
                    isModifyUploadVideo = true;
                }
            }
            createPreviewVideo(url);
        })();
    }

    /**
     * 监听确认和取消两个按钮事件，用户执行插入或者清空正在播放的视频实例操作
     */
    function addOkListener() {
        dialog.onok = function () {
            $G("preview").innerHTML = "";
            var currentTab = findFocus("tabHeads", "tabSrc");
            switch (currentTab) {
                case "video":
                    return insertSingle();
                    break;
                case "videoSearch":
                    return insertSearch("searchList");
                    break;
                case "upload":
                    return insertUpload();
                    break;
            }
        };
        dialog.oncancel = function () {
            $G("preview").innerHTML = "";
        };
    }

    /**
     * 依据传入的align值更新按钮信息
     * @param align
     */
    function updateAlignButton(align) {
        var aligns = $G("videoFloat").children;
        for (var i = 0, ci; ci = aligns[i++];) {
            if (ci.getAttribute("name") == align) {
                if (ci.className != "focus") {
                    ci.className = "focus";
                }
            } else {
                if (ci.className == "focus") {
                    ci.className = "";
                }
            }
        }
    }

    /**
     * 将单个视频信息插入编辑器中
     */
    function insertSingle() {
        var width = $G("videoWidth"),
            height = $G("videoHeight"),
            masid = $G("videoMasid"),
            url = $G('videoUrl').value,
            align = findFocus("videoFloat", "name");
        if (!url) return false;
        if (!checkNum([width, height])) return false;
        editor.execCommand('insertvideo', {
            url: url,
            width: width.value,
            height: height.value,
            masid: masid ? masid.value : '',
            align: align
        }, isModifyUploadVideo ? 'upload' : null);
    }

    /**
     * 将元素id下的所有代表视频的图片插入编辑器中
     * @param id
     */
    function insertSearch(id) {
        var imgs = domUtils.getElementsByTagName($G(id), "img"),
            videoObjs = [];
        for (var i = 0, img; img = imgs[i++];) {
            if (img.getAttribute("selected")) {
                videoObjs.push({
                    url: img.getAttribute("ue_video_url"),
                    width: 420,
                    height: 280,
                    align: "none",
                    masid: ''
                });
            }
        }
        editor.execCommand('insertvideo', videoObjs);
    }

    /**
     * 找到id下具有focus类的节点并返回该节点下的某个属性
     * @param id
     * @param returnProperty
     */
    function findFocus(id, returnProperty) {
        var tabs = $G(id).children,
            property;
        for (var i = 0, ci; ci = tabs[i++];) {
            if (ci.className == "focus") {
                property = ci.getAttribute(returnProperty);
                break;
            }
        }
        return property;
    }

    function convert_url(url) {
        if (!url) return '';
        url = utils.trim(url)
            .replace(/v\.youku\.com\/v_show\/id_([\w\-=]+)\.html/i, 'player.youku.com/player.php/sid/$1/v.swf')
            .replace(/(www\.)?youtube\.com\/watch\?v=([\w\-]+)/i, "www.youtube.com/v/$2")
            .replace(/youtu.be\/(\w+)$/i, "www.youtube.com/v/$1")
            .replace(/v\.ku6\.com\/.+\/([\w\.]+)\.html.*$/i, "player.ku6.com/refer/$1/v.swf")
            .replace(/www\.56\.com\/u\d+\/v_([\w\-]+)\.html/i, "player.56.com/v_$1.swf")
            .replace(/www.56.com\/w\d+\/play_album\-aid\-\d+_vid\-([^.]+)\.html/i, "player.56.com/v_$1.swf")
            .replace(/v\.pps\.tv\/play_([\w]+)\.html.*$/i, "player.pps.tv/player/sid/$1/v.swf")
            .replace(/www\.letv\.com\/ptv\/vplay\/([\d]+)\.html.*$/i, "i7.imgs.letv.com/player/swfPlayer.swf?id=$1&autoplay=0")
            .replace(/www\.tudou\.com\/programs\/view\/([\w\-]+)\/?/i, "www.tudou.com/v/$1")
            .replace(/v\.qq\.com\/cover\/[\w]+\/[\w]+\/([\w]+)\.html/i, "static.video.qq.com/TPout.swf?vid=$1")
            .replace(/v\.qq\.com\/.+[\?\&]vid=([^&]+).*$/i, "static.video.qq.com/TPout.swf?vid=$1")
            .replace(/my\.tv\.sohu\.com\/[\w]+\/[\d]+\/([\d]+)\.shtml.*$/i, "share.vrs.sohu.com/my/v.swf&id=$1");

        return url;
    }

    /**
     * 检测传入的所有input框中输入的长宽是否是正数
     * @param nodes input框集合，
     */
    function checkNum(nodes) {
        for (var i = 0, ci; ci = nodes[i++];) {
            var value = ci.value;
            if (!isNumber(value) && value) {
                alert(lang.numError);
                ci.value = "";
                ci.focus();
                return false;
            }
        }
        return true;
    }

    /**
     * 数字判断
     * @param value
     */
    function isNumber(value) {
        return /(0|^[1-9]\d*$)/.test(value);
    }

    /**
     * 创建图片浮动选择按钮
     * @param ids
     */
    function createAlignButton(ids) {
        for (var i = 0, ci; ci = ids[i++];) {
            var floatContainer = $G(ci),
                nameMaps = {
                    "none": lang.default,
                    "left": lang.floatLeft,
                    "right": lang.floatRight,
                    "center": lang.block
                };
            for (var j in nameMaps) {
                var div = document.createElement("div");
                div.setAttribute("name", j);
                if (j == "none") div.className = "focus";
                div.style.cssText = "background:url(images/" + j + "_focus.jpg);";
                div.setAttribute("title", nameMaps[j]);
                floatContainer.appendChild(div);
            }
            switchSelect(ci);
        }
    }

    /**
     * 选择切换
     * @param selectParentId
     */
    function switchSelect(selectParentId) {
        var selects = $G(selectParentId).children;
        for (var i = 0, ci; ci = selects[i++];) {
            domUtils.on(ci, "click", function () {
                for (var j = 0, cj; cj = selects[j++];) {
                    cj.className = "";
                    cj.removeAttribute && cj.removeAttribute("class");
                }
                this.className = "focus";
            })
        }
    }

    /**
     * 监听url改变事件
     * @param url
     */
    function addUrlChangeListener(url) {
        if (browser.ie) {
            url.onpropertychange = function () {
                createPreviewVideo(this.value);
            }
        } else {
            url.addEventListener("input", function () {
                createPreviewVideo(this.value);
            }, false);
        }
    }

    /**
     * 根据url生成视频预览
     * @param url
     */
    function createPreviewVideo(url) {//GOV-5668
        if (!url) return;

        var conUrl = url;
        if (conUrl.indexOf('.swf') != -1) {//如果为swf格式视频，使用embed标签
            var html = '<div class="previewMsg"><span>视频地址解析中......</span></div>' +
            '<embed class="previewVideo" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer"' +
            ' src="' + conUrl + '"' +
            ' width="' + 420 + '"' +
            ' height="' + 280 + '"' +
            ' wmode="transparent" play="true" loop="false" menu="false" allowscriptaccess="never" allowfullscreen="true" >' +
            '</embed>';
        } else {
            var html =
            '<iframe frameborder="0"' +
            ' src=" '+ conUrl + '"' +
            ' width="' + 420 + '"' +
            ' height="' + 280 + '"' +
            ' allowFullScreen="true"></iframe>';
        }
        $G("preview").innerHTML = html;
        setTimeout(function () {
            $(".previewMsg span").html(lang.urlError);
        }, 8000);
    }
    /**
     * 从后端获取上传到Mas的URL
     * @return String 上传地址URL
     */
    function getUploadVideoURL() {
        var uploadDir = '';
        ajax.request("/gov/gov.do", {
            'timeout': 10000,
            'dataType': '',
            'async': false,
            'data': {
                "serviceid": "gov_mas",
                "methodname": "getUploadVideoURL"
            },
            'method': 'get',
            'onsuccess': function (r) {
                r = JSON.parse(r.responseText);
                uploadDir = r.DATA;
                // uploadDir = 'http://localhost/mas/service/upload?appKey=dev';
            },
            'onerror': function () {
                alert("请求mas的URL失败!");
            }
        });
        return uploadDir;
    }


    /**
     * 获取提交到表单的URL
     * @return String   表单URL
     */
    function getFormURL() {
        var formUrl = '';
        ajax.request("/gov/gov.do", {
            'timeout': 10000,
            'dataType': '',
            'async': false,
            'data': {
                "serviceid": "gov_mas",
                "methodname": "getFormURL"
            },
            'method': 'get',
            'onsuccess': function (r) {
                r = JSON.parse(r.responseText);
                formUrl = r.DATA;
                // formUrl = 'http://localhost/mas/service/masJobSubmit?appKey=dev&';
            },
            'onerror': function () {
                alert("请求mas的URL失败!");
            }
        });
        return formUrl;
    }

    /**
     * 提交表单信息，获取MasId
     * @param formURL   表单URL，通过getFormURL函数获得
     * @param token     上传完后MAS返回的token值
     * @param title     视频标题，需要作url编码
     * @return String   返回MasId
     */
    function getMasId(formURL, token, title) {
        var masId = '';
        ajax.request(formURL, {
            'timeout': 10000,
            'dataType': '',
            'async': false,
            'data': {
                "token": token,
                "isLightIntegrate": true,
                "title": title
            },
            'method': 'post',
            'onsuccess': function (r) {
                r = JSON.parse(r.responseText);
                masId = r.masId;
            },
            'onerror': function () {
                alert("获取视频的MasId失败!");
            }
        });
        return masId;
    }

    /**
     * 获取视频播放地址
     * @param videoId   视频的MasId
     */
    function getPreviousURL(videoId) {
        var previousData = '';
        ajax.request("/gov/gov.do", {
            'timeout': 10000,
            'dataType': '',
            'async': false,
            'data': {
                "serviceid": "gov_mas",
                "methodname": "getPreviousURL",
                "videoId": videoId,
                "isFromEditor": "true"
            },
            'method': 'get',
            'onsuccess': function (r) {
                previousData = JSON.parse(r.responseText);;
            },
            'onerror': function () {
                alert("请求mas的URL失败!");
            }
        });
        return previousData;
    }

    /**
     * 获取视频的下载地址
     * @param masId     视频ID
     * @return String   视频下载地址
     */
    function getVideoDownloadURL(masId) {
        ajax.request("/gov/gov.do", {
            'timeout': 10000,
            'dataType': '',
            'async': false,
            'data': {
                "serviceid": "gov_mas",
                "methodname": "getDownLoadVideoURL",
                "videoId": masId
            },
            'method': 'get',
            'onsuccess': function (r) {
                return r.DATA;
            },
            'onerror': function () {}
        });
    }

    /* 插入上传视频 */
    function insertUpload() {
        var videoObjs = [],
            videoList = [],
            // uploadDir = editor.getOpt('videoUrlPrefix'),
            uploadDir = '',
            width = $G('upload_width').value || 420,
            height = $G('upload_height').value || 280,
            masid = '',
            align = findFocus("upload_alignment", "name") || 'none';

        for(i in uploadVideoList) {
            videoList.push(uploadVideoList[i]);//GOV-7665 重装数组对象，防止length跟数组个数不一致
        }
        for (var key = 0; key < videoList.length; key++) {
            var file = videoList[key];
            var vObj = {
                url: uploadDir + file.url,
                width: width,
                height: height,
                align: align,
                masid: file.masid,
                name: file.name,
                originName:file.original
            };
            if ($('[name=autoplay]').eq(0).is(':checked')) { //全部关闭
                vObj.autoplay = false;
            } else if ($('[name=autoplay]').eq(1).is(':checked')) { //全部开启
                vObj.autoplay = true;
            } else { //自定义
                vObj.autoplay = file.autoplay;
            }
            videoObjs.push(vObj);
        }
        //若没有视频
        if (videoObjs && videoObjs.length == 0) {
            window.parent.angular.element(window.parent.document.body).injector().get("trsconfirm").errorModel("请上传视频！");
            return false;
        }
        var count = uploadFile.getQueueCount();
        if (count) {
            $('.info', '#queueList').html('<span style="color:red;">' + '还有2个未上传文件'.replace(/[\d]/, count) + '</span>');
            return false;
        } else {
            editor.execCommand('insertvideo', videoObjs, 'upload');
        }
    }

    /*初始化上传标签*/
    function initUpload() {
        uploadFile = new UploadFile('queueList');
    }


    /* 上传附件 */
    function UploadFile(target) {
        this.$wrap = target.constructor == String ? $('#' + target) : $(target);
        this.init();
    }
    UploadFile.prototype = {
        init: function () {
            this.fileList = [];
            this.initContainer();
            this.initUploader();
        },
        initContainer: function () {
            this.$queue = this.$wrap.find('.filelist');
        },
        /* 初始化容器 */
        initUploader: function () {
            var _this = this,
                $ = jQuery, // just in case. Make sure it's not an other libaray.
                $wrap = _this.$wrap,
                // 图片容器
                $queue = $wrap.find('.filelist'),
                // 状态栏，包括进度和控制按钮
                $statusBar = $wrap.find('.statusBar'),
                // 文件总体选择信息。
                $info = $statusBar.find('.info'),
                // 上传按钮
                $upload = $wrap.find('.uploadBtn'),
                // 上传按钮
                $filePickerBtn = $wrap.find('.filePickerBtn'),
                // 上传按钮
                $filePickerBlock = $wrap.find('.filePickerBlock'),
                // 没选择文件之前的内容。
                $placeHolder = $wrap.find('.placeholder'),
                // 总体进度条
                $progress = $statusBar.find('.progress').hide(),
                // 添加的文件数量
                fileCount = 0,
                // 添加的文件总大小
                fileSize = 0,
                // 优化retina, 在retina下这个值是2
                ratio = window.devicePixelRatio || 1,
                // 缩略图大小
                thumbnailWidth = 113 * ratio,
                thumbnailHeight = 113 * ratio,
                // 可能有pedding, ready, uploading, confirm, done.
                state = '',
                // 所有文件的进度信息，key为file id
                percentages = {},
                supportTransition = (function () {
                    var s = document.createElement('p').style,
                        r = 'transition' in s ||
                        'WebkitTransition' in s ||
                        'MozTransition' in s ||
                        'msTransition' in s ||
                        'OTransition' in s;
                    s = null;
                    return r;
                })(),
                // WebUploader实例
                uploader,
                actionUrl = editor.getActionUrl(editor.getOpt('videoActionName')),
                fileMaxSize = fileConfig ? fileConfig.SIZE : editor.getOpt('videoMaxSize'),
                acceptExtensions = fileConfig ? fileConfig.ALLOWSUFFIX : (editor.getOpt('videoAllowFiles') || []).join('').replace(/\./g, ',').replace(/^[,]/, '');

            if (!WebUploader.Uploader.support()) {
                $('#filePickerReady').after($('<div>').html(lang.errorNotSupport)).hide();
                return;
            } else if (!editor.getOpt('videoActionName')) {
                $('#filePickerReady').after($('<div>').html(lang.errorLoadConfig)).hide();
                return;
            }
            $('#fileSupportTips').html('支持格式' + acceptExtensions + ' 文件大小不超过' + fileMaxSize);

            uploader = _this.uploader = WebUploader.create({
                pick: {
                    id: '#filePickerReady',
                    label: lang.uploadSelectFile
                },
                accept: {
                    title: 'videos',
                    extensions: acceptExtensions,
                    mimeTypes: 'video/avi,video/flv,video/mp4,video/rmvb,video/wmv,video/rm,video/mov'
                },
                swf: '../../third-party/webuploader/Uploader.swf',
                server: actionUrl,
                fileVal: editor.getOpt('videoFieldName'),
                duplicate: true,
                fileSingleSizeLimit: fileMaxSize,
                compress: false
            });
            uploader.addButton({
                id: '#filePickerBlock'
            });
            uploader.addButton({
                id: '#filePickerBtn',
                label: lang.uploadAddFile
            });

            setState('pedding');

            // 当有文件添加进来时执行，负责view的创建
            function addFile(file) {
                var $li = $('<li id="' + file.id + '">' +
                        '<p class="title">' + file.name + '</p>' +
                        '<p class="imgWrap"></p>' +
                        '<p class="progress"><span></span></p>' +
                        '</li>'),

                    $btns = $('<div class="file-panel">' +
                        '<span class="cancel">' + lang.uploadDelete + '</span>' +
                        '<span class="rotateRight">' + lang.uploadTurnRight + '</span>' +
                        '<span class="rotateLeft">' + lang.uploadTurnLeft + '</span></div>').appendTo($li),
                    $prgress = $li.find('p.progress span'),
                    $wrap = $li.find('p.imgWrap'),
                    $info = $('<p class="error"></p>').hide().appendTo($li),

                    showError = function (code) {
                        switch (code) {
                            case 'exceed_size':
                                text = lang.errorExceedSize;
                                break;
                            case 'interrupt':
                                text = lang.errorInterrupt;
                                break;
                            case 'http':
                                text = lang.errorHttp;
                                break;
                            case 'not_allow_type':
                                text = lang.errorFileType;
                                break;
                            default:
                                text = lang.errorUploadRetry;
                                break;
                        }
                        $info.text(text).show();
                    };

                if (file.getStatus() === 'invalid') {
                    showError(file.statusText);
                } else {
                    $wrap.text(lang.uploadPreview);
                    if ('|png|jpg|jpeg|bmp|gif|'.indexOf('|' + file.ext.toLowerCase() + '|') == -1) {
                        $wrap.empty().addClass('notimage').append('<label class="ap-group"><input type="checkbox" name="ap-inp" disabled>自动播放</label><i class="file-preview file-type-' + file.ext.toLowerCase() + '"></i>' +
                            '<span class="file-title">' + file.name + '</span>');
                        /* 单独设置自动播放的值 */
                        $wrap.on('change','[type=checkbox]', function () {
                            uploadVideoList[$(this).closest('li').index()].autoplay = $(this).is(':checked');
                        });
                    } else {
                        if (browser.ie && browser.version <= 7) {
                            $wrap.text(lang.uploadNoPreview);
                        } else {
                            uploader.makeThumb(file, function (error, src) {
                                if (error || !src || (/^data:/.test(src) && browser.ie && browser.version <= 7)) {
                                    $wrap.text(lang.uploadNoPreview);
                                } else {
                                    var $img = $('<img src="' + src + '">');
                                    $wrap.empty().append($img);
                                    $img.on('error', function () {
                                        $wrap.text(lang.uploadNoPreview);
                                    });
                                }
                            }, thumbnailWidth, thumbnailHeight);
                        }
                    }
                    percentages[file.id] = [file.size, 0];
                    file.rotation = 0;

                    /* 检查文件格式 */
                    if (!file.ext || acceptExtensions.indexOf(file.ext.toLowerCase()) == -1) {
                        showError('not_allow_type');
                        uploader.removeFile(file); //这会导致上传文件格式不正确时整体文件个数计算错误
                        fileCount++;
                        fileSize += file.size;
                    }
                }

                file.on('statuschange', function (cur, prev) {
                    if (prev === 'progress') {
                        $prgress.hide().width(0);
                    } else if (prev === 'queued') {
                        $li.off('mouseenter mouseleave');
                        $btns.remove();
                    }
                    // 成功
                    if (cur === 'error' || cur === 'invalid') {
                        showError(file.statusText);
                        percentages[file.id][1] = 1;
                    } else if (cur === 'interrupt') {
                        showError('interrupt');
                    } else if (cur === 'queued') {
                        percentages[file.id][1] = 0;
                    } else if (cur === 'progress') {
                        $info.hide();
                        $prgress.css('display', 'block');
                    } else if (cur === 'complete') {}

                    $li.removeClass('state-' + prev).addClass('state-' + cur);
                });

                $li.on('mouseenter', function () {
                    $btns.stop().animate({
                        height: 30
                    });
                });
                $li.on('mouseleave', function () {
                    $btns.stop().animate({
                        height: 0
                    });
                });

                $btns.on('click', 'span', function () {
                    var index = $(this).index(),
                        deg;

                    switch (index) {
                        case 0:
                            uploader.removeFile(file);
                            return;
                        case 1:
                            file.rotation += 90;
                            break;
                        case 2:
                            file.rotation -= 90;
                            break;
                    }

                    if (supportTransition) {
                        deg = 'rotate(' + file.rotation + 'deg)';
                        $wrap.css({
                            '-webkit-transform': deg,
                            '-mos-transform': deg,
                            '-o-transform': deg,
                            'transform': deg
                        });
                    } else {
                        $wrap.css('filter', 'progid:DXImageTransform.Microsoft.BasicImage(rotation=' + (~~((file.rotation / 90) % 4 + 4) % 4) + ')');
                    }

                });

                $li.insertBefore($filePickerBlock);
            }

            // 负责view的销毁
            function removeFile(file) {
                var $li = $('#' + file.id);
                delete percentages[file.id];
                updateTotalProgress();
                $li.off().find('.file-panel').off().end().remove();
            }

            function updateTotalProgress() {
                var loaded = 0,
                    total = 0,
                    spans = $progress.children(),
                    percent;

                $.each(percentages, function (k, v) {
                    total += v[0];
                    loaded += v[0] * v[1];
                });

                percent = total ? loaded / total : 0;

                spans.eq(0).text(Math.round(percent * 100) + '%');
                spans.eq(1).css('width', Math.round(percent * 100) + '%');
                updateStatus();
            }

            function setState(val, files) {

                if (val != state) {

                    var stats = uploader.getStats();

                    $upload.removeClass('state-' + state);
                    $upload.addClass('state-' + val);

                    switch (val) {

                        /* 未选择文件 */
                        case 'pedding':
                            $queue.addClass('element-invisible');
                            $statusBar.addClass('element-invisible');
                            $placeHolder.removeClass('element-invisible');
                            $progress.hide();
                            $info.hide();
                            uploader.refresh();
                            break;

                        /* 可以开始上传 */
                        case 'ready':
                            $placeHolder.addClass('element-invisible');
                            $queue.removeClass('element-invisible');
                            $statusBar.removeClass('element-invisible');
                            $progress.hide();
                            $info.show();
                            $upload.text(lang.uploadStart);
                            uploader.refresh();
                            break;

                        /* 上传中 */
                        case 'uploading':
                            $progress.show();
                            $info.hide();
                            $upload.text(lang.uploadPause);
                            break;

                        /* 暂停上传 */
                        case 'paused':
                            $progress.show();
                            $info.hide();
                            $upload.text(lang.uploadContinue);
                            break;

                        case 'confirm':
                            $progress.show();
                            $info.hide();
                            $upload.text(lang.uploadStart);

                            stats = uploader.getStats();
                            if (stats.successNum && !stats.uploadFailNum) {
                                setState('finish');
                                return;
                            }
                            break;

                        case 'finish':
                            $progress.hide();
                            $info.show();
                            if (stats.uploadFailNum) {
                                $upload.text(lang.uploadRetry);
                            } else {
                                $upload.text(lang.uploadStart);
                            }
                            break;
                    }

                    state = val;
                    updateStatus();

                }

                if (!_this.getQueueCount()) {
                    $upload.addClass('disabled')
                } else {
                    $upload.removeClass('disabled')
                }

            }

            function updateStatus() {
                var text = '',
                    stats;

                if (state === 'ready') {
                    text = lang.updateStatusReady.replace('_', fileCount).replace('_KB', WebUploader.formatSize(fileSize));
                } else if (state === 'confirm') {
                    stats = uploader.getStats();
                    if (stats.uploadFailNum) {
                        text = lang.updateStatusConfirm.replace('_', stats.successNum).replace('_', stats.successNum);
                    }
                } else {
                    stats = uploader.getStats();
                    text = lang.updateStatusFinish.replace('_', fileCount).
                    replace('_KB', WebUploader.formatSize(fileSize)).
                    replace('_', stats.successNum);

                    if (stats.uploadFailNum) {
                        text += lang.updateStatusError.replace('_', stats.uploadFailNum);
                    }
                }

                $info.html(text);
            }

            uploader.on('fileQueued', function (file) {
                fileCount++;
                fileSize += file.size;

                if (fileCount === 1) {
                    $placeHolder.addClass('element-invisible');
                    $statusBar.show();
                }

                addFile(file);
                //手动上传改为自动上传 GOV-6110
                setTimeout(function () {
                    // 1.从后端获取上传到Mas的URL
                    var masUrl = getUploadVideoURL();
                    // 2.上传视频到Mas
                    uploader.option('server', masUrl);
                    //必须让name命名为uf
                    uploader.option('fileVal', 'uf');
                    uploader.upload();
                }, 100);
            });

            uploader.on('fileDequeued', function (file) {
                fileCount--;
                fileSize -= file.size;

                removeFile(file);
                updateTotalProgress();
            });

            uploader.on('filesQueued', function (file) {
                if (!uploader.isInProgress() && (state == 'pedding' || state == 'finish' || state == 'confirm' || state == 'ready')) {
                    setState('ready');
                }
                updateTotalProgress();
            });

            uploader.on('all', function (type, files) {
                switch (type) {
                    case 'uploadFinished':
                        setState('confirm', files);
                        break;
                    case 'startUpload':
                        /* 添加额外的GET参数 */
                        var params = utils.serializeParam(editor.queryCommandValue('serverparam')) || '',
                            url = utils.formatUrl(actionUrl + (actionUrl.indexOf('?') == -1 ? '?' : '&') + 'encode=utf-8&' + params);
                        /*// 1.从后端获取上传到Mas的URL
                        var masUrl = getUploadVideoURL();
                        // 2.上传视频到Mas
                        // uploadVideo(masUrl, files);
                        uploader.option('server', masUrl);
                        //必须让name命名为uf
                        uploader.option('fileVal', 'uf');*/
                        // uploader.option('server', url);
                        setState('uploading', files);
                        break;
                    case 'stopUpload':
                        setState('paused', files);
                        break;
                }
            });

            uploader.on('uploadBeforeSend', function (file, data, header) {
                //这里可以通过data对象添加POST参数
                header['X_Requested_With'] = 'XMLHttpRequest';
            });

            uploader.on('uploadProgress', function (file, percentage) {
                var $li = $('#' + file.id),
                    $percent = $li.find('.progress span');

                $percent.css('width', percentage * 100 + '%');
                percentages[file.id][1] = percentage;
                updateTotalProgress();
            });

            uploader.on('uploadSuccess', function (file, ret) {
                var $file = $('#' + file.id);
                var responseText = (ret._raw || ret),
                    json = utils.str2json(responseText);
                //获取mas表单url
                var formURL = getFormURL();
                //获取masid
                var masid = getMasId(formURL, json.token, json.originName);
                // /获取视频播放地址
                var videoData = getPreviousURL(masid);
                try {
                    if (videoData.ISSUCCESS == 'true') {
                        uploadVideoList[$file.index()]={
                            'url': videoData.DATA,
                            'original': json.originName,
                            'masid': masid,
                            'autoplay': false,
                            'name': json.token
                        };
                        $file.append('<span class="success"></span>');
                        $file.find('[type=checkbox]').removeAttr("disabled");
                    } else {
                        $file.find('.error').text(videoData.MSG).show();
                    }
                } catch (e) {
                    $file.find('.error').text(lang.errorServerUpload).show();
                }
            });

            uploader.on('uploadError', function (file, code) {});
            uploader.on('error', function (code, file) {
                if (code == 'Q_TYPE_DENIED' || code == 'F_EXCEED_SIZE') {
                    addFile(file);
                }
            });
            uploader.on('uploadComplete', function (file, ret) {});

            $upload.on('click', function () {
                if ($(this).hasClass('disabled')) {
                    return false;
                }

                if (state === 'ready') {
                    uploader.upload();
                } else if (state === 'paused') {
                    uploader.upload();
                } else if (state === 'uploading') {
                    uploader.stop();
                }
            });

            $upload.addClass('state-' + state);
            updateTotalProgress();
        },
        getQueueCount: function () {
            var file, i, status, readyFile = 0,
                files = this.uploader.getFiles();
            for (i = 0; file = files[i++];) {
                status = file.getStatus();
                if (status == 'queued' || status == 'uploading' || status == 'progress') readyFile++;
            }
            return readyFile;
        },
        refresh: function () {
            this.uploader.refresh();
        }
    };

})();