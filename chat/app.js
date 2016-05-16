var express =require('express');
var app=express();
var path=require('path')
app.use(express.static(path.resolve(__dirname,'..','node_modules')));
console.log(path.resolve(__dirname,'..','node_modules'))
app.get('/',function(req,res){
	res.sendfile('./index.html');
});
//APP是一个监听函数
var server=require('http').createServer(app);
//获取socket对象把服务传进去
var io=require('socket.io')(server);
//获取所有socket对象
var users={};
//保存加入了那个房间

var roomGirl=[];
var roomBoy=[];

//与客户端链接成功
io.on('connection',function(socket){
	var area='false';
	var room='area';
	//存放用户初次进入时的名字
	var name='';
	//第一次进入房间时 系统说的话
	socket.emit('message',{name:'系统',msg:'欢迎来到聊天室 "<span class="red" attr="has">你还没有输入昵称,请输入昵称</span>"'});

	//刚进入房间获取所有用户
	//监听users事件 当前用户传来消息时触发回调
	socket.on('users',function(){
		//刚进页面触发一次user事件获取所有users 向客户端所有人发送消息
		if(room=='area'){
			console.log(Object.keys(users).length)
			io.emit('users',Object.keys(users));
		}else if(room=='girl'){
			var list=[];
			roomGirl.map(function(g){
				list.push(g.name)
				return list
			})
			io.sockets.in(room).emit('users',list);
		}else if(room=='boy'){
			var list=[];
			roomBoy.map(function(g){
				list.push(g.name)
				return list
			})
			io.sockets.in(room).emit('users',list);
		}

	})

	//客户端选择房间后会触发jion事件 触发回调
	socket.on('join',function(r){
		socket.join(r)
		room=r;

	    if(room=='girl'){
			roomBoy=roomBoy.filter(function(item){
				return item.name!=name
			})
			for(var i=0;i<roomGirl.length;i++){
				if(roomGirl[i].name==name){
					roomGirl.splice(i,1)
				}
			}
			roomGirl.push({name:name,so:socket});
			if(area=='false'){
				socket.emit('message',{name:'系统',msg:'你已离开本区房间'});

			}else{
				socket.emit('message',{name:'系统',msg:'你已离开爷们儿房间'})
			}
			area='girl'
			socket.emit('message',{name:'系统',msg:'你已进入妹砸房间'});
			var list=[];
			roomGirl.map(function(g){
				list.push(g.name)
				return list
			})
			io.sockets.in(room).emit('users',list);

		}else if(room=='boy'){
			roomGirl=roomGirl.filter(function(item){
				return item.name!=name
			});
			for(var i=0;i<roomBoy.length;i++){
				if(roomBoy[i].name==name){
					roomBoy.splice(i,1)
				}
			}
			roomBoy.push({name:name,so:socket});
			if(area=='false'){
				socket.emit('message',{name:'系统',msg:'你已离开本区房间'});

			}else{
				socket.emit('message', {name: '系统', msg: '你已离开妹砸房间'})
			}
			area='boy'
			socket.emit('message',{name:'系统',msg:'你已进入爷们儿房间'})
			var list=[];
			roomBoy.map(function(g){
				list.push(g.name)
				return list
			})
			io.sockets.in(room).emit('users',list);
		}else if(room=='area'){
			if(area=='boy'){
				socket.emit('message',{name:'系统',msg:'你已离开爷们儿房间'})
			}else if(area=='girl'){
				socket.emit('message',{name:'系统',msg:'你已离开妹砸房间'})
			}
			area='false';
			io.sockets.in(room).emit('users',Object.keys(users));
			socket.emit('message',{name:'系统',msg:'你已进入大厅'})
		}
	})

	//当监听到客户端传来的消息的时候触发message回调函数
	socket.on('message',function(msg){
		//如果用户输入了昵称
		if(name){
			//如果是跟某人私聊
			var reg=msg.match(/^@(.+)\s+(.+)/);
			if(reg){
				var toUser=reg[1],content=reg[2];
				toUser=toUser.replace(/^\s+|\s+$/,"");
				users[toUser].emit('message',{name:name,msg:content})
				socket.emit('message',{name:name,msg:content})
			}else{
				//跟所有人说话
				if(room=='area'){
					io.emit('message',{name:name,msg:msg})
				}else if(room=='girl'){
					io.sockets.in(room).emit('message',{name:name,msg:msg})
				}else if(room=='boy'){
					io.sockets.in(room).emit('message',{name:name,msg:msg})
				}
			}
			io.emit('time', new Date().toLocaleString())
		}else{//如果没输入
			name=msg;
			//缓存所有的用户名和socket
			users[name]=socket;
			io.emit('message',{name:'系统',msg:'欢迎&nbsp;&nbsp;"'+msg+'"&nbsp;&nbsp;加入聊天室(所有人通知)'});
			//每新增一个用户就执行一次user事件 客户端就会更新一次
			io.emit('users',Object.keys(users));
			//发送用户注册昵称
			socket.emit('username',name)
		}
		//当接收到客户端当前用户传来的消息的时候会触发message事件，接收信息
		//用emit执行事件，并把接收到的信息传给客户端

		//每点击发送消息一次就会 发送一次时间
		io.emit('time', new Date().toLocaleString())
	});


	//当用户断开连接时
	socket.on('disconnect', function(){
		if(room=='girl'){
			roomGirl=roomGirl.filter(function(g){
				return g.so!=socket
			});
			var list=[];
			roomGirl.map(function(g){
				list.push(g.name)
				return list
			})
			io.sockets.in(room).emit('users',list);
			io.sockets.in(room).emit('message',{name:'系统',msg:'"'+name+'"  用户已离开妹砸房间'});
		}else if(room=='boy'){
			roomBoy=roomBoy.filter(function(b){
				return b.so!=socket
			});
			var list=[];
			roomBoy.map(function(g){
				list.push(g.name)
				return list
			})
			io.sockets.in(room).emit('users',list);
			io.sockets.in(room).emit('message',{name:'系统',msg:'"'+name+'"  用户已离开爷们房间'});
		}
		for(var k in users){
			if(users[k]==socket){
				delete users[k];
				io.emit('message',{name:'系统',msg:'"'+k+'"  用户已离开本区'});
			}
		}
		room='area'
	})
})
server.listen(8080)