const { setUser, setRoomUsers, getUser } = require('./functions/users');
const http = require('http');
const path = require('path');
const express = require('express');
const socketio = require('socket.io');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
let element;

const server = http.createServer(app);
const io = socketio(server);

io.on('connection', (socket) => {

  socket.on('join', (obj, ack) => {
    const { username, room, error } = setUser(socket.id, obj.username, obj.room);
    const setUsersList = setRoomUsers(room);

    if(error) {
      return ack(error);
    }

    socket.join(room);
    io.to(room).emit('setUserInList', username);
    io.to(room).emit('joinMessage', `${username} has joined`);
    ack(null, username, setUsersList);
  });

  socket.on('message', (msg, ack) => {
    const { username, room } = getUser(socket.id);
    io.to(room).emit('message', `${username}: ${msg}`);
    ack();
  });

  io.on('disconnect', () => {
    
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server started on port ${port}...`);
});
