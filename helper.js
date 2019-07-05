
var $debug_only = false;

var $filter_nikename = [];


function getDelay(){
    return  Math.random(2000) * 1000 + 1000
}

function getNonSendContactNames(contactFactory){
    var noSendUserName = {};
    var allContacts = _contactFactory.getAllContacts();
    for (var userName in allContacts) {
        if (allContacts[userName].NickName ==  '#不群发#') {
            console.log(allContacts[userName]);

            allContacts[userName].MemberList.forEach(function(dd, ii) {
                noSendUserName[dd.UserName] = true;
            });
        }
    }

    contactFactory.getAllBrandContact().forEach(function(d, i) {
        noSendUserName[d.UserName] = true;
    });

    return noSendUserName;
}


function initHelper(){
    var $chatSenderScope = $('div[ng-controller="chatSenderController"]').scope();
    $chatSenderScope.$watch('currentUser', function(currentUser, preUser) {
        var btnSendAll = $('div[ng-controller="chatSenderController"] div.action a.btn_sendall');
        if (currentUser == 'filehelper') {
            console.log('found filehelper');
            if (btnSendAll.length == 0) {
                $('div[ng-controller="chatSenderController"]').injector().invoke(["$rootScope", "$compile", "ngDialog", "confFactory", "accountFactory", "contactFactory", "chatFactory", "mmpop", "utilFactory", function($rootScope, $compile, ngDialog, confFactory, accountFactory, contactFactory, chatFactory, mmpop, utilFactory) {
                    var _accountFactory = accountFactory;
                    var _contactFactory = contactFactory;
                    window._contactFactory = contactFactory;
                    window._accountFactory = accountFactory;
                    window._ngDialog = ngDialog;
                    window._chatFactory = chatFactory;


                    $chatSenderScope.workingStatus = {
                        work:'none',
                        isWorking :false,
                        total : 0,
                        finished : 0
                    };


                    function appendLogger(msg){
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

                            if($debug_only){
                                appendLogger('发送：' + targetUser.getDisplayName())
                            }
                            else{
                                chatFactory.appendMessage(a);
                                chatFactory.sendMessage(a);
                            }
                        }
                    }

                    function sendAllTextMessage() {

                        if($chatSenderScope.workingStatus.isWorking){
                            if($chatSenderScope.workingStatus.work == 'sendtext'){
                                $chatSenderScope.workingStatus.isWorking = false;
                            }

                            return;
                        }

                        $chatSenderScope.workingStatus = {
                            work:'sendtext',
                            isWorking :true,
                            total : 0,
                            finished : 0
                        };
                        var content = $chatSenderScope.editAreaCtn;

                        if(content.replace(/<br\/?>/g, "").match(/^\s*$/)){
                            appendLogger('请先输入要群发的内容哦');
                            $chatSenderScope.workingStatus.isWorking = false;
                            return;
                        }

                        mmpop.close();                             

                        var noSendUserName = getNonSendContactNames(_contactFactory);
                        var queFun = [];
                        _contactFactory.getAllFriendContact().forEach(function(d, i) {
                            if (!noSendUserName[d.UserName]) {

                                if (d.isBrandContact() == 0 && d.isContact()) {
                                    //console.log(d, d.isContact(), d.isShieldUser(), d.isSpContact(), d.isNewsApp(), d.isReadOnlyContact(), d.isBrandContact());
                                    if($filter_nikename.length > 0 && $filter_nikename.indexOf(d.NickName) == -1){
                                         return;                                        
                                    }

                                    var e = chatFactory.createMessage({
                                        MsgType: confFactory.MSGTYPE_TEXT,
                                        Content: content.replace(/\[某某\]/g, d.getDisplayName())
                                    });
                                    e.ToUserName = d.UserName;
                                    // '@1ea16a5e05e2e9f1737bb05a69d54e45';
                                    if($debug_only){
                                        queFun.push(function(){
                                            appendLogger('发送：' + d.getDisplayName())
                                        })

                                    }
                                    else{
                                        queFun.push(function(){
                                            chatFactory.appendMessage(e);
                                            chatFactory.sendMessage(e);

                                            ngDialog[d.UserName] = "";
                                        });
                                    }
                                }
                            }

                        })
                        
                        ngDialog[chatFactory.getCurrentUserName()] = "";
                        $chatSenderScope.editAreaCtn = "";
                      
                        $chatSenderScope.workingStatus = {
                            work:'sendtext',
                            isWorking : true,
                            total : queFun.length,
                            finished : 0
                        };
                        function sendMsgTask(){
                            var obj = queFun.shift();
                            if(obj){
                                obj();
                                $chatSenderScope.workingStatus.finished++;
                                if($chatSenderScope.workingStatus.isWorking){
                                    setTimeout(sendMsgTask,getDelay());
                                }
                                else{
                                    appendLogger('已经停止发送');
                                }
                            }
                            else{
                                $chatSenderScope.workingStatus.isWorking = false;
                                appendLogger('发送完成');
                            }

                        }
                        sendMsgTask();
                    
                    }

                    function reSendAllTextMessage() {
                        if($chatSenderScope.workingStatus.isWorking){
                            if($chatSenderScope.workingStatus.work == 'resend'){
                                $chatSenderScope.workingStatus.isWorking = false;
                            }

                            return;
                        }

                        $chatSenderScope.workingStatus = {
                            work:'resend',
                            isWorking :true,
                            total : 0,
                            finished : 0
                        };
                        var msg = null;
                        if ($chatSenderScope.chatContent.length > 0) {
                            
                            for(var i = $chatSenderScope.chatContent.length -1;i >= 0;i--){
                                var cc = $chatSenderScope.chatContent[i];
                                if(cc.MsgType != 10000){
                                    msg = cc;
                                    break;
                                }                                    
                            }
                        }
                        if(msg == null){
                            appendLogger('没有找到可发送的消息');
                            $chatSenderScope.workingStatus.isWorking = false;
                            return;
                        }
                        var noSendUserName = getNonSendContactNames(_contactFactory);

                        var queueSend = [];
                        _contactFactory.getAllFriendContact().forEach(function(d, i) {

                            if($filter_nikename.length > 0 && $filter_nikename.indexOf(d.NickName) == -1){
                                return;                                        
                            }

                            if (!noSendUserName[d.UserName]) {
                                queueSend.push({msg:msg, target:d});
                            }

                        });

                        $chatSenderScope.workingStatus = {
                            work:'resend',
                            isWorking :true,
                            total : queueSend.length,
                            finished : 0
                        };



                        function sendMsgTask(){
                            var obj = queueSend.shift();
                            if(obj){
                                sendToOthers(obj.msg, obj.target);
                                $chatSenderScope.workingStatus.finished++;
                                if($chatSenderScope.workingStatus.isWorking){
                                    setTimeout(sendMsgTask,getDelay());
                                }else{
                                    appendLogger('已经停止发送');
                                }
                            }
                            else{
                                $chatSenderScope.workingStatus.isWorking = false;
                                appendLogger('发送完成');
                            }
                        }
                        sendMsgTask();
                    

                    }

                    function getActionText(work,defaultName){ 
                        var ws = $chatSenderScope.workingStatus;
                        if(ws.isWorking && ws.work == work){
                            return ws.finished + '/' + ws.total;
                        }
                        else{
                            return defaultName;
                        }
                    }
                    
                    $chatSenderScope.getActionText = getActionText;

                    

                    $chatSenderScope.sendAllTextMessage = sendAllTextMessage;
                    $chatSenderScope.reSendAllTextMessage = reSendAllTextMessage;

                    var btnSendAll = $compile(`<a class="btn btn_sendall" href="javascript:;"  ng-click="sendAllTextMessage()">{{getActionText('sendtext','群发')}}</a>
                    <a class="btn btn_sendall" href="javascript:;" ng-click="reSendAllTextMessage()">{{getActionText('resend','群发最后消息')}}</a>`)($chatSenderScope);
                    $('div[ng-controller="chatSenderController"] div.action').append(btnSendAll);


                }
                                                                                 ]);
            } else {
                btnSendAll.show();
            }
        } else {
            btnSendAll.hide();
        }
    });

    return $chatSenderScope;
}

