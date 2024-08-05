const express=require("express");
const path=require("path");
const { v4: uuidv4 } = require('uuid');
const {ExpressPeerServer}=require("peer");


const app=express();
const server=require('http').Server(app);
const peerServer=ExpressPeerServer(server,{
    debug:true
});
const io=require('socket.io')(server);
app.set('view engine','ejs');
app.set("views",path.join(__dirname,"views"));
app.use(express.static(path.join(__dirname,"public")));

app.use('/peerjs',peerServer);
app.get("/",(req,res)=>{
    res.redirect(`/${uuidv4()}`);
});
app.get("/:room",(req,res)=>{
    let{roomId}=req.params.room;
    res.render("room.ejs",{roomId});
});


io.on('connection', socket =>{
    socket.on('join-room',(roomId,userId)=>{
        socket.join(roomId);
        socket.to(roomId).emit("user-connected",userId);
        socket.on('message',message=>{
            io.to(roomId).emit('createMessage',message);
        });
        socket.on('user-disconnected',userId=>{
            console.log(`user ${userId} has disconnected`);
        });
    });
});


server.listen(8080,()=>{
    console.log("Server is listening to port:8080");
});