
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
                            a.Content = utilFactory.htmlDecode(a.Content.replace(/^@\w+:<br\/>/, "")),
                            a.MMActualSender = accountFactory.getUserName(),
                            a.MMSendContent && (a.MMSendContent = a.MMSendContent.replace(/^@\w+:\s/, "")),
                            a.MMDigest && (a.MMDigest = a.MMDigest.replace(/^@\w+:/, "")),
                            a.MMActualContent && (a.MMActualContent = utilFactory.clearHtmlStr(a.MMActualContent.replace(/^@\w+:<br\/>/, ""))),

                            a.Content = a.Content.replace(/\[某某\]/g, targetUser.getDisplayName())

                            chatFactory.appendMessage(a),
                            chatFactory.sendMessage(a)
                        }
                    }

                    function sendAllTextMessage() {
                        _contactFactory;

                        if (mmpop.close(),
                        !$chatSenderScope.editAreaCtn.replace(/<br\/?>/g, "").match(/^\s*$/)) {

                            var noSendUserName = {};
                            var nosendrooms = _contactFactory.getAllChatroomContact().forEach(function(d, i) {
                                if (d.NickName == '#不群发#') {
                                    d.MemberList.forEach(function(dd, ii) {
                                        noSendUserName[dd.UserName] = true;
                                    });
                                }
                            });

                            _contactFactory.getAllFriendContact().forEach(function(d, i) {
                                if (!noSendUserName[d.UserName]) {

                                    if (d.isBrandContact() == 0 && d.isContact()) {
                                        console.log(d, d.isContact(), d.isShieldUser(), d.isSpContact(), d.isNewsApp(), d.isReadOnlyContact(), d.isBrandContact());
                                        var e = chatFactory.createMessage({
                                            MsgType: confFactory.MSGTYPE_TEXT,
                                            Content: $chatSenderScope.editAreaCtn.replace(/\[某某\]/g, d.getDisplayName())
                                        });
                                        e.ToUserName = d.UserName;
                                        // '@1ea16a5e05e2e9f1737bb05a69d54e45';
                                        chatFactory.appendMessage(e);
                                        chatFactory.sendMessage(e);
                                        ngDialog[d.UserName] = "";
                                    }
                                }

                            })

                            ngDialog[chatFactory.getCurrentUserName()] = "",
                            $chatSenderScope.editAreaCtn = ""
                        }
                    }

                    $chatSenderScope.sendAllTextMessage = sendAllTextMessage;
                    $chatSenderScope.reSendAllTextMessage = function() {
                        if ($chatSenderScope.chatContent.length > 0) {
                            var msg = $chatSenderScope.chatContent[$chatSenderScope.chatContent.length - 1];
                            var noSendUserName = {};
    //                         var nosendrooms = _contactFactory.getAllChatroomContact().forEach(function(d, i) {
    //                             if (d.NickName == '#不群发#') {
    //                                 d.MemberList.forEach(function(dd, ii) {
    //                                     noSendUserName[dd.UserName] = true;
    //                                 });
    //                             }
    //                         });
                            var allContacts = _contactFactory.getAllContacts();
                            for (var userName in allContacts) {
                                if (allContacts[userName].NickName == '#不群发#') {
                                    console.log(allContacts[userName]);

                                    allContacts[userName].MemberList.forEach(function(dd, ii) {
                                        noSendUserName[dd.UserName] = true;
                                    });
                                }
                            }

                            _contactFactory.getAllFriendContact().forEach(function(d, i) {
                                if (!noSendUserName[d.UserName]) {

                                    sendToOthers(msg, d);
                                }

                            });
                        }

                    }
                    ;

                    var btnSendAll = $compile('<a class="btn btn_sendall" href="javascript:;" ng-click="sendAllTextMessage()">群发</a>')($chatSenderScope);
                    var btnReSendAll = $compile(`<a class="btn btn_sendall" href="javascript:;" ng-click="reSendAllTextMessage()">群发最后消息</a>`)($chatSenderScope);
                    $('div[ng-controller="chatSenderController"] div.action').append(btnSendAll);
                    $('div[ng-controller="chatSenderController"] div.action').append(btnReSendAll);
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

 function reInitHelper() {
    setTimeout(function(){
        var $chatSenderScopeNew = $('div[ng-controller="chatSenderController"]').scope();
        if($chatSenderScopeNew  && $chatSenderScope != $chatSenderScopeNew){   

            $chatSenderScope = initHelper();
            
            $chatSenderScope.$on("$destroy",reInitHelper);

        }
        else{
            reInitHelper();
        }

    },500);
 }
var $chatSenderScope = null;

reInitHelper();

