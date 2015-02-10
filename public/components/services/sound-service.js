
angular.module('myApp.services.sound-service', [])
.service('SoundService', function($timeout) {
    
    // Resources
    var messageReceivedRes = "sounds/message-received.mp3";
    var messageSendRes = "sounds/message-send.mp3";
    var friendRequestRes = "sounds/friend-request.mp3";
    var chatOpenRes = "sounds/chat-open.mp3";
    var notificationRes = "sounds/notification.mp3";
    
    // Sound variables
    var messageReceivedSound = new Audio(messageReceivedRes);
    var messageSendSound = new Audio(messageSendRes);
    var friendRequestSound = new Audio(friendRequestRes);
    var chatOpenSound = new Audio(chatOpenRes);
    var notificationSound = new Audio(notificationRes);

    var themeTimeout = null;
    var muted = false;
    
    var init = function() {
        messageReceivedSound.setAttribute("preload", "auto");
        messageSendSound.setAttribute("preload", "auto");
        friendRequestSound.setAttribute("preload", "auto");
        chatOpenSound.setAttribute("preload", "auto");
        notificationSound.setAttribute("preload", "auto");
    };
    init();
    
    this.msgReceived = function() {
        //answerSuccess.load();
        if (messageReceivedSound) {
            messageReceivedSound.currentTime = 0;
        }
        messageReceivedSound.play();
    };

    this.msgSend = function() {
        //answerSuccess.load();
        if (messageSendSound) {
            messageSendSound.currentTime = 0;
        }
        messageSendSound.play();
    };

    this.chatOpen = function() {
        //answerSuccess.load();
        if (chatOpenSound) {
            chatOpenSound.currentTime = 0;
        }
        chatOpenSound.play();
    };

    this.notification = function() {
        //answerSuccess.load();
        if (notificationSound) {
            notificationSound.currentTime = 0;
        }
        notificationSound.play();
    };

    this.friendRequest = function() {
        //answerSuccess.load();
        if (friendRequestSound) {
            friendRequestSound.currentTime = 0;
        }
        friendRequestSound.play();
    };
    
    this.mute = function() {
        // Todo

        if (muted)
            muted = false;
        else 
            muted = true;
        
        // And sounds
        messageReceivedSound.muted = muted;  
        messageSendSound.muted = muted;
        friendRequestSound.muted = muted;
        chatOpenSound.muted = muted;
        notificationSound.muted = muted;
    };

});
