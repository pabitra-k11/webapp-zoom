const express = require("express");
const path = require("path");
const { v4: uuidv4 } = require('uuid');
const { ExpressPeerServer } = require("peer");

const app = express();
const server = require('http').Server(app);
const peerServer = ExpressPeerServer(server, {
    debug: true
});
const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.use('/peerjs', peerServer);

// Redirect to a unique room ID
app.get("/", (req, res) => {
    res.redirect(`/${uuidv4()}`);
});

// Render room with roomId
app.get("/:room", (req, res) => {
    const roomId = req.params.room;
    res.render("room", { roomId });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);
        socket.to(roomId).emit("user-connected", userId);

        // Handle incoming messages
        socket.on('message', (message) => {
            io.to(roomId).emit('createMessage', message);
        });

        // Handle user disconnection
        socket.on('disconnect', () => {
            socket.to(roomId).emit("user-disconnected", userId);
        });
    });
});

// Start the server
server.listen(8080, () => {
    console.log("Server is listening on port 8080");
});
