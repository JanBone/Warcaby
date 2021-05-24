const http = require("http")
const express = require("express");
const app = express();
const socketIo = require("socket.io");
const fs = require("fs");
const server = http.Server(app).listen(process.env.PORT || 8080);
const io = socketIo(server);
var avaliableRooms = [];
var rooms = {};
app.use(express.static(__dirname + "/../client/"));
app.use(express.static(__dirname + "/../node_modules/"));

app.get("/", (req, res) => {
    const stream = fs.createReadStream(__dirname + "/../client/index1.html");
    stream.pipe(res);
  
});
app.get("/room/:roomid", (req, res) => {
    const stream = fs.createReadStream(__dirname + "/../client/room/room.html");
    stream.pipe(res);
});
io.of("/").on("connection", (socket) => {
    socket.on("validate", function(roomid){
        if (!avaliableRooms.includes(roomid)){
            avaliableRooms.push(roomid);
            socket.emit("validated", {decision : true, roomid: roomid});
            io.sockets.emit("return.list", avaliableRooms);
        }
        else{
            socket.emit("validated", {decision : false, roomid: null});
        }
    });
    socket.on("get.list", function(){
        socket.emit("return.list", avaliableRooms);
    });
});
io.of("/room/:roomid").on("connection", (socket) => {
    socket.on("join", function(data){
        if (avaliableRooms.includes(data.roomid)){
            if (rooms[data.roomid]){
                if (rooms[data.roomid].socket2){
                    socket.emit("error.event");
                }
                else{
                    rooms[data.roomid].player2 = socket.id;
                    rooms[data.roomid].socket2 = socket;
                    rooms[data.roomid].socket1.opponent = socket;    
                    socket.opponent = rooms[data.roomid].socket1;
                    rooms[data.roomid].socket1.color="blacks";    
                    socket.color ="whites";
                    socket.name = data.name;
                    rooms[data.roomid].socket1.emit("game.begin", {turn : true, color : "blacks" , op_name: rooms[data.roomid].socket1.opponent.name});
                    rooms[data.roomid].socket2.emit("game.begin", {turn : false, color : "whites", op_name : rooms[data.roomid].socket2.opponent.name});
                    socket.room = data.roomid; 
                    remove(data.roomid);
                }
               
            }
            else{
                rooms[data.roomid] = {
                    player1 : socket.id,
                    socket1 : socket,
                    player2 : null,
                    socket2 : null,
                }         

                socket.room = data.roomid; 
                socket.name = data.name;   
            }
        }
        else{
           socket.emit("error.event");
           remove(data.roomid);
        }
        
    });
    socket.on("make.move", function(data) {
        socket.emit("move.made", data); 
        if (socket.opponent){
            socket.opponent.emit("move.made", data); 
            socket.opponent.emit("change.turn", {turn : true});
        }
        socket.emit("change.turn", {turn : false});
        
    });


    socket.on("disconnect", function() {
        if (socket.opponent){
            socket.opponent.emit("opponent.left");
        }
  
        remove(socket.room);
    });
    socket.on("game.over", function(data) {
        if (data == socket.color){
            socket.emit("game.over", true);  //socket przegral
            if(socket.opponent){
                socket.opponent.emit("game.over", false);
            }
            
        }
        else{
            socket.emit("game.over", false);  //socket wygral
            if (socket.opponent){
                socket.opponent.emit("game.over", true);
            }
            
        }
    });
   
 });

 function remove(el){
    const index = avaliableRooms.indexOf(el);
    delete rooms.el;
    if (index != -1) {
    avaliableRooms.splice(index, 1);
    }
 }
