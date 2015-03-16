var userlist,
	loginpanel,
	chatpanel,
	userRef,
	messagesRef,
	messagelisten,
	storage = window.sessionStorage,
	isChrome = window.navigator.userAgent.indexOf("Chrome") !== -1,
	isIE = window.attachEvent != undefined,
	root = 'https://935440883.firebaseIO-demo.com/',
	$messagepanel = $('#messagepanel'),
	$talkto = $('#talkto'),
	$changetalk = $('#changetalk'),
	$messagesDiv = $('#messagesDiv'),
	$userslist = $('.userslist:first'),
	$mainpanel = $('.mainpanel:first');

$(function() {
	loginpanel = $('#login');
	chatpanel = $('#chat');
	loginpanel.hide();
	chatpanel.hide();
	userRef = new Firebase(root + 'userlist/');
	messagesRef = new Firebase(root + 'messagelist/');
	messagelisten = new Firebase(root + 'messagelist/');
	userRef.on('value', function(snapshot) {
		userlist = snapshot.val();
		if (islogin()) {
			if (!chatpanel.is(':visible'))
				chatpanel.fadeIn();
			ini();
		} else {
			loginpanel.fadeIn();
			chatpanel.hide();
		}
	});

	$changetalk.on('click', function() {
		$userslist.show();
		$mainpanel.hide();
	})
});

function login() {
	error('');
	var username = $('#username').val();
	var password = $('#password').val();
	if (username == '' || password == '') {
		error("用户名密码不能为空。");
		return;
	}
	$('#username').val('');
	$('#password').val('');
	$.each(userlist, function(n, value) {
		var name = userlist[n].username;
		if (name == username) {
			if (userlist[n].password != password) {
				error("密码错误。");
				return;
			} else {
				loadMainPanel(username);
				return;
			}
		}
	});
	if (!islogin)
		error("用户名不存在。");
}


function islogin() {
	return getCurrentName() != null;
}

function error(message) {
	$('#error').text(message);
}

function register() {
	var username = $('#registername').val();
	var password = $('#registerpassword').val();
	var confirm = $('#confirmpassword').val();
	if (username == '' || password == '' || confirm == '') {
		alert("用户名密码不能为空。")
	}
	if (confirm != password) {
		alert("密码不相同。");
		return;
	}
	$('#registername').val('');
	$('#registerpassword').val('');
	$('#confirmpassword').val('');

	userRef.push({
		username: username,
		password: password
	});

	$('#myModal').modal('hide');
	loadMainPanel(username);
}

function logout() {
	islogin = false;
	resetCurrentName();
	chatpanel.hide();
	loginpanel.fadeIn();
}

function loadMainPanel(username) {
	setCurrentName(username);
	ini();
	loginpanel.hide();
	chatpanel.fadeIn();
}

function ini() {
	var users = $('#userspanel');
	users.empty();
	var currentuser;
	$.each(userlist, function(n, value) {
		if (value.username != getCurrentName())
			addToList(users, n, value.username, value.photo);
		else
			currentuser = value;
	});

	users.prepend($('<a>').attr('href', '#')
		.addClass('list-group-item headphoto')
		.attr('data-toggle', 'modal')
		.attr('data-target', '#settings')
		.html(textencode(currentuser.username))
		.prepend($('<img>').attr('src', srcProcess(currentuser.photo))
			.css('height', '50')));
	//users.prepend('<a href="#" class="list-group-item headphoto" data-toggle="modal" data-target="#settings"><img src="' 
	//	+ currentuser.photo + '" height="50">' + currentuser.username + 
	//	'</a>')

	$('#currentName').text(getCurrentName());
	$messagepanel.hide();

	messagelisten.limit(50).on('child_added', function(snapshot) {
		var message = snapshot.val();
		if (message.hasread == '0') {
			if (message.user != getCurrentName() && message.to == getCurrentName()) {
				var obj = $('#user_' + deleteHtmlChar(message.user));
				var sum = 0;
				if (obj.text() != '') sum = parseInt(obj.text());
				sum++;
				obj.text(sum);
			}
		}
	});
}

function textencode(str) {
	str = str || '';
	return str.replace(/&amp;/gi, '&')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

function srcProcess(str) {
	str = str || '';
	return str.replace(/&amp;/gi, '')
		.replace(/</g, '')
		.replace(/\"/g, '')
		.replace(/\'/g, '')
		.replace(/>/g, '');
}

function deleteHtmlChar(str) {
	str = str || '';
	return str.replace(/&amp;/gi, '')
		.replace(/</g, '')
		.replace(/\//g, '')
		.replace(/\"/g, '')
		.replace(/\'/g, '')
		.replace(/>/g, '');
}

function addToList(panel, id, name, photo) {
	panel.append('<a href="javascript:void(0)" class="list-group-item" onclick="talkToUser(\'' + id + '\')"><span class="badge" id="user_' + deleteHtmlChar(name) + '"></span>' +
		'<img src="' + srcProcess(photo) + '" height="30" width="30"/>' +
		textencode(name) + '</a>');
}

function getCurrentName() {
	if (!isIE)
		return storage.getItem('chat');
	else
		return $.cookie('chat');
}

function setCurrentName(value) {
	if (!isIE)
		return storage.setItem('chat', value);
	else
		return $.cookie('chat', value);
}

function resetCurrentName() {
	if (!isIE)
		storage.removeItem('chat');
	else
		$.cookie('chat', null);
}

function talkToUser(id) {
	var talkToName = userlist[id].username;

	if (talkToName == getCurrentName()) {
		return;
	}

	updateUnReadMsg(talkToName);

	//显示消息
	$messagepanel.fadeIn();
	$talkto.text(talkToName);
	$messagesDiv.empty();

	//手机端额外判断
	if ($mainpanel.is(":hidden")) {
		$userslist.hide();
		$mainpanel.show();
		$changetalk.show();
	}

	messagesRef.off('child_added');
	messagesRef.limit(100).on('child_added', function(snapshot) {
		var message = snapshot.val();
		if (message.user == $('#talkto').text() && message.to == getCurrentName()) {
			updateUnReadMsg(talkToName);
		} else {
			if (message.hasread == '0') {
				if (message.user != getCurrentName() && message.to == getCurrentName()) {
					var obj = $('#user_' + deleteHtmlChar(message.user));
					var sum = 0;
					if (obj.text() != '') sum = parseInt(obj.text());
					sum++;
					obj.text(sum);
				}
			}
		}
		if (message.to == $('#talkto').text() && message.user == getCurrentName() ||
			message.to == getCurrentName() && message.user == $('#talkto').text()) {
			$('<div/>').text(message.detail).prepend($('<strong/>')
				.text(message.user + ': ')).appendTo($('#messagesDiv'));
			$('#messagesDiv').append($('<small/>').text(message.sendtime).addClass('text-muted'));
			$('#messagesDiv')[0].scrollTop = $('#messagesDiv')[0].scrollHeight;
		}
	});
	$('#messageInput').focus();
	$('#messageInput').keypress(function(e) {
		if (e.keyCode == 13) {
			sendMessage();
			return false;
		}
	});
}

function updateUnReadMsg(talkToName) {
	//更新未查看消息
	$('#user_' + deleteHtmlChar(talkToName)).empty();

	messagesRef.once('value', function(snapshot) {
		var list = snapshot.val();
		$.each(list, function(n, value) {
			if (value.to == getCurrentName() && value.user == talkToName) {
				messagesRef.child(n).update({
					hasread: 1
				});
			}
		});
	});
}

function sendMessage() {
	var name = getCurrentName();
	var text = $('#messageInput').val();
	var talkto = $('#talkto').text();
	var now = getTime();
	if (text == '') return;
	messagesRef.push({
		user: name,
		detail: text,
		to: talkto,
		hasread: 0,
		sendtime: now
	});
	$('#messageInput').val('');
}

function getTime() {
	var date = new Date();
	var hour = date.getHours();
	var min_ = date.getMinutes();
	var sec = date.getSeconds();
	if (hour < 10) hour = "0" + hour;
	if (min_ < 10) min_ = "0" + min_;
	if (sec < 10) sec = "0" + sec;

	return date.toLocaleDateString() + " " + hour + ":" + min_ + ":" + sec;
}

function setting() {
	var photosrc = $('#photosrc').val();
	if (photosrc == "") alert("请输入头像链接。");

	$.each(userlist, function(n, value) {
		if (value.username == getCurrentName()) {
			var photoref = new Firebase(root + "userlist/" + n);
			photoref.update({
				photo: photosrc
			});
			return;
		}
	});


	$('#settings').modal('hide');
}