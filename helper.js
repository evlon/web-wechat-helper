
function loadSetting() {
    return JSON.parse(localStorage.getItem('-=#setting#=-')) || {
        showUI: false,
        debug: true,
        sendToChatroom: true,
        sendToUser: true,
        mode: 0,//0：仅发送， 1：排除发送
        except: '',
        only: '',
        interval: 3
    };
}

function saveSetting(setting) {
    if (angular.isObject(setting))
        localStorage.setItem('-=#setting#=-', JSON.stringify(setting));
}


function initHelper() {
    var $chatSenderScope = $('div[ng-controller="chatSenderController"]').scope();
    $chatSenderScope.$watch('currentUser', function (currentUser, preUser) {
       
        if (currentUser == 'filehelper') {
            console.log('found filehelper');
            var btnSendAll = $('div[ng-controller="chatSenderController"] div.action a.btn_sendall');
            if (btnSendAll.length == 0) {
                $('div[ng-controller="chatSenderController"]').injector().invoke(["$rootScope", "$compile", "ngDialog", "confFactory", "accountFactory", "contactFactory", "chatFactory", 'chatroomFactory', "mmpop", "utilFactory", function ($rootScope, $compile, ngDialog, confFactory, accountFactory, contactFactory, chatFactory, chatroomFactory, mmpop, utilFactory) {
                    var _accountFactory = accountFactory;
                    var _contactFactory = contactFactory;
                    window._contactFactory = contactFactory;
                    window._accountFactory = accountFactory;
                    window._ngDialog = ngDialog;
                    window._chatFactory = chatFactory;
                    window._chatroomFactory = chatroomFactory;

                    $chatSenderScope.workingStatus = {
                        work: 'none',
                        isWorking: false,
                        total: 0,
                        finished: 0
                    };

                    function getDelay() {
                        return Math.random() * 1000 + $chatSenderScope.$setting.interval*1000
                    }

                    function appendLogger(msg) {
                        var e = chatFactory.createMessage({
                            MsgType: 10000,
                            Content: msg
                        });
                        e.ToUserName = 'filehelper';
                        chatFactory.appendMessage(e);
                        e.MMStatus = 2
                    }

                    function sendToOthers(msg, targetUser) {
                        if (msg.MsgType != confFactory.MSGTYPE_SYS) {
                            var a = angular.copy(msg);
                            a.ToUserName = targetUser.UserName,
                                a.FromUserName = accountFactory.getUserName(),
                                a.isTranspond = !0,
                                a.MsgIdBeforeTranspond = msg.MsgIdBeforeTranspond || msg.MsgId,
                                a._h = void 0,
                                a._offsetTop = void 0,
                                a.MMSourceMsgId = msg.MsgId,
                                a.Scene = 2,
                                a = chatFactory.createMessage(a),
                                a.sendByLocal = !1,
                                a.Content = utilFactory.htmlDecode(a.Content.replace(/^@\w+:<br\/>/, "").replace(/\[某某\]/g, targetUser.getDisplayName())),
                                a.MMActualSender = accountFactory.getUserName(),
                                a.MMSendContent && (a.MMSendContent = a.MMSendContent.replace(/^@\w+:\s/, "").replace(/\[某某\]/g, targetUser.getDisplayName())),
                                a.MMDigest && (a.MMDigest = a.MMDigest.replace(/^@\w+:/, "").replace(/\[某某\]/g, targetUser.getDisplayName())),
                                a.MMActualContent && (a.MMActualContent = utilFactory.clearHtmlStr(a.MMActualContent.replace(/^@\w+:<br\/>/, "").replace(/\[某某\]/g, targetUser.getDisplayName())));

                            if ($chatSenderScope.$setting.debug) {
                                appendLogger('发送：' + targetUser.getDisplayName());
                            }
                            else {
                                chatFactory.appendMessage(a);
                                chatFactory.sendMessage(a);
                                appendLogger('发送：' + targetUser.getDisplayName());
                            }
                        }
                    }

                    function getContactFilter() {
                        var setting = $chatSenderScope.$setting;
                        var brandContact = {};
                        contactFactory.getAllBrandContact().forEach(function (d, i) {
                            brandContact[d.UserName] = true;
                        });

                        if (setting.mode == 0) { //仅发送
                            var cache = {};
                            var only = setting.only.split(',');
                            for (var i = 0, c = only.length; i < c; i++) {
                                cache[only[i]] = true;
                            }
                            return function (contact) {
                                return !brandContact[contact.UserName] && cache[contact.getDisplayName()]
                            }
                        }
                        else if (setting.mode == 1) { //排除发送
                            var cache = {};
                            var except = setting.except.split(',');
                            for (var i = 0, c = except.length; i < c; i++) {
                                cache[except[i]] = true;
                            }
                            return function (contact) {
                                return !brandContact[contact.UserName] && !cache[contact.getDisplayName()];
                            }
                        }
                        else {
                            return function (contact) {
                                return false;
                            }
                        }
                    }

                    function sendAllTextMessage() {

                        if ($chatSenderScope.workingStatus.isWorking) {
                            if ($chatSenderScope.workingStatus.work == 'sendtext') {
                                $chatSenderScope.workingStatus.isWorking = false;
                            }

                            return;
                        }

                        $chatSenderScope.workingStatus = {
                            work: 'sendtext',
                            isWorking: true,
                            total: 0,
                            finished: 0
                        };
                        var content = $chatSenderScope.editAreaCtn;

                        if (content.replace(/<br\/?>/g, "").match(/^\s*$/)) {
                            appendLogger('请先输入要群发的内容哦');
                            $chatSenderScope.workingStatus.isWorking = false;
                            return;
                        }

                        mmpop.close();

                        var filterFuncation = getContactFilter();
                        // var noSendUserName = getNonSendContactNames(_contactFactory);
                        var queFun = [];
                        var contacts = [];
                        if($chatSenderScope.$setting.sendToUser){
                            contacts = _contactFactory.getAllFriendContact();
                        }

                        if($chatSenderScope.$setting.sendToChatroom){
                            contacts = contacts.concat(_contactFactory.getAllChatroomContact());
                        }

                        contacts.forEach(function (d, i) {
                            // if (!noSendUserName[d.UserName]) {

                            if (d.isContact()) {
                                // var $filterOnly= $chatSenderScope.$setting.only;
                                // //console.log(d, d.isContact(), d.isShieldUser(), d.isSpContact(), d.isNewsApp(), d.isReadOnlyContact(), d.isBrandContact());
                                // if($filterOnly.length > 0 && $filterOnly.indexOf(d.NickName) == -1){
                                //     return;
                                // }
                                if (!filterFuncation(d)) {
                                    return;
                                }

                                var e = chatFactory.createMessage({
                                    MsgType: confFactory.MSGTYPE_TEXT,
                                    Content: content.replace(/\[某某\]/g, d.getDisplayName())
                                });
                                e.ToUserName = d.UserName;
                                // '@1ea16a5e05e2e9f1737bb05a69d54e45';
                                if ($chatSenderScope.$setting.debug) {
                                    queFun.push(function () {
                                        appendLogger('发送：' + d.getDisplayName())
                                    })

                                }
                                else {
                                    queFun.push(function () {
                                        chatFactory.appendMessage(e);
                                        chatFactory.sendMessage(e);
                                        appendLogger('发送：' + d.getDisplayName())

                                        ngDialog[d.UserName] = "";
                                    });
                                }
                            }
                            //}

                        })

                        ngDialog[chatFactory.getCurrentUserName()] = "";
                        $chatSenderScope.editAreaCtn = "";

                        $chatSenderScope.workingStatus = {
                            work: 'sendtext',
                            isWorking: true,
                            total: queFun.length,
                            finished: 0
                        };
                        function sendMsgTask() {
                            var obj = queFun.shift();
                            if (obj) {
                                obj();
                                $chatSenderScope.workingStatus.finished++;
                                if ($chatSenderScope.workingStatus.isWorking) {
                                    setTimeout(sendMsgTask, getDelay());
                                }
                                else {
                                    appendLogger('已经停止发送');
                                }
                            }
                            else {
                                $chatSenderScope.workingStatus.isWorking = false;
                                appendLogger('发送完成');
                            }

                        }
                        sendMsgTask();

                    }

                    function reSendAllTextMessage() {
                        if ($chatSenderScope.workingStatus.isWorking) {
                            if ($chatSenderScope.workingStatus.work == 'resend') {
                                $chatSenderScope.workingStatus.isWorking = false;
                            }

                            return;
                        }

                        $chatSenderScope.workingStatus = {
                            work: 'resend',
                            isWorking: true,
                            total: 0,
                            finished: 0
                        };
                        var msg = null;
                        if ($chatSenderScope.chatContent.length > 0) {

                            for (var i = $chatSenderScope.chatContent.length - 1; i >= 0; i--) {
                                var cc = $chatSenderScope.chatContent[i];
                                if (cc.MsgType != 10000) {
                                    msg = cc;
                                    break;
                                }
                            }
                        }
                        if (msg == null) {
                            appendLogger('没有找到可发送的消息');
                            $chatSenderScope.workingStatus.isWorking = false;
                            return;
                        }
                        //var noSendUserName = getNonSendContactNames(_contactFactory);
                        var filterFuncation = getContactFilter();
                        var queueSend = [];
                        var contacts = [];
                        if($chatSenderScope.$setting.sendToUser){
                            contacts = _contactFactory.getAllFriendContact();
                        }

                        if($chatSenderScope.$setting.sendToChatroom){
                            contacts = contacts.concat(_contactFactory.getAllChatroomContact());
                        }

                        contacts.forEach(function (d, i) {
                            if (!filterFuncation(d)) {
                                return;
                            }


                            queueSend.push({ msg: msg, target: d });


                        });

                        $chatSenderScope.workingStatus = {
                            work: 'resend',
                            isWorking: true,
                            total: queueSend.length,
                            finished: 0
                        };



                        function sendMsgTask() {
                            var obj = queueSend.shift();
                            if (obj) {
                                sendToOthers(obj.msg, obj.target);
                                $chatSenderScope.workingStatus.finished++;
                                if ($chatSenderScope.workingStatus.isWorking) {
                                    setTimeout(sendMsgTask, getDelay());
                                } else {
                                    appendLogger('已经停止发送');
                                }
                            }
                            else {
                                $chatSenderScope.workingStatus.isWorking = false;
                                appendLogger('发送完成');
                            }
                        }
                        sendMsgTask();


                    }

                    function getActionText(work, defaultName) {
                        var ws = $chatSenderScope.workingStatus;
                        if (ws.isWorking && ws.work == work) {
                            return ws.finished + '/' + ws.total;
                        }
                        else {
                            return defaultName;
                        }
                    }

                    function switchSettingUI() {
                        setTimeout(function () {

                            var innerTotalHeight = 0; jQuery.each($('div.box_ft').children(), function (i, d) { innerTotalHeight += d.clientHeight + 5; });
                            $('div.box_ft').height(innerTotalHeight);
                        }, 500);
                    }

                    $chatSenderScope.getActionText = getActionText;
                    $chatSenderScope.$setting = loadSetting();
                    $chatSenderScope.$watch('$setting', function (val, preVal) {
                        saveSetting(val);
                    },true);

                    $chatSenderScope.sendAllTextMessage = sendAllTextMessage;
                    $chatSenderScope.reSendAllTextMessage = reSendAllTextMessage;
                    $chatSenderScope.switchSettingUI = switchSettingUI;

                    var btnSendAll = $compile(`<a ng-show="currentUser == 'filehelper'" class="btn btn_sendall" href="javascript:;"  ng-click="sendAllTextMessage()">{{getActionText('sendtext','群发')}}</a>
<a ng-show="currentUser == 'filehelper'" class="btn btn_sendall" href="javascript:;" ng-click="reSendAllTextMessage()">{{getActionText('resend','群发最后消息')}}</a>`)($chatSenderScope);
                    $('div[ng-controller="chatSenderController"] div.action').append(btnSendAll);

                    var btnShowSetting = $compile(`<span ng-show="currentUser == 'filehelper'"><input type="checkbox"  ng-model="$setting.showUI" ng-change="switchSettingUI()">设置</span>`)($chatSenderScope);
                    $('div[ng-controller="chatSenderController"] div.action').prepend(btnShowSetting);

                    //                     debug:true,
                    //         sendToChatroom:true,
                    //         sendToUser:true,
                    //         except:[],
                    //         only:[],
                    //         interval:3
                    var uiSetting = $compile(`<div id="settingUi" ng-show="currentUser == 'filehelper' && $setting.showUI" >
                    <div>
                    <span><input type="checkbox" ng-model="$setting.debug">仅打印日志</span>
                    <span><input type="checkbox" ng-model="$setting.sendToUser">发送到朋友</span>
                    <span><input type="checkbox" ng-model="$setting.sendToChatroom">发送到群聊</span>
                    </div>
                    <div>
                    <div>
                    <input type="radio" ng-model="$setting.mode" value="0">指定名称发送：<input type="text"  ng-model="$setting.only"></span>
                    <span><input type="radio" ng-model="$setting.mode" value="1">排除名称发送:<input type="text"  ng-model="$setting.except"></span>
                    </div>
                    <div>发送间隔:<input type="text" style="width:10px"  ng-model="$setting.interval">秒</div>

                    </div>`)($chatSenderScope);
                    $('div[ng-controller="chatSenderController"] div.action').parent().append(uiSetting);

                }
                ]);
            } else {
               // btnSendAll.show();
            }
        } else {
            //btnSendAll.hide();
        }
    });

    return $chatSenderScope;
}
