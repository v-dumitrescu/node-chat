const { setUser,
  setRoomUsers,
  getUserById,
  getUserByUsername,
  setMessage,
  getPrivateMessages,
  getRoomMessages,
  removeUser,
  getRoomsOfUser
} = require('./functions/users');

const http = require('http');
const path = require('path');
const express = require('express');
const socketio = require('socket.io');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = socketio(server);

io.on('connection', (socket) => {

  socket.on('join', (obj, ack) => {
    const { id, username, room, error } = setUser(socket.id, obj.username, obj.room);
    const setUsersList = setRoomUsers(room);

    if (error) {
      return ack(error);
    }

    socket.join(room);

    io.to(room).emit('setUserInRoomList', {
      id,
      username
    });

    socket.broadcast.to(room).emit('notification message', `${username} has joined`);
    ack(null, username, room, setUsersList);
  });

  socket.on('room message', ({ to, from, message }, ack) => {
    const { id } = getUserByUsername(from);
    io.to(to).emit('room message', {
      from,
      message
    });
    setMessage(id, null, to, from, message);
    ack(to, from);
  });

  socket.on('private message', ({ to, from, message }, ack) => {
    const id = to;
    if (!getUserById(id)) {
      return ack('User disconnected', undefined, undefined);
    }
    const { id: receiverId, username: receiverUsername } = getUserById(id);
    const { id: senderId, username: senderUsername } = getUserByUsername(from);
    setMessage(senderId, receiverId, receiverUsername, senderUsername, message);
    const messages = getPrivateMessages(senderId, receiverId);
    socket.to(id).emit('private message', {
      senderId,
      senderUsername,
      messages
    });
    ack(undefined, receiverUsername, from);
  });

  socket.on('getPrivateMessages', ({ receiverId, senderId }, ack) => {
    const messages = getPrivateMessages(receiverId, senderId);
    ack(messages);
  });

  socket.on('getRoomUsersAndMessages', (room, ack) => {
    const users = setRoomUsers(room);
    const messages = getRoomMessages(room);
    ack(users, messages);
  });

  socket.on('disconnect', (reason) => {
    const { id, username } = getUserById(socket.id);
    const rooms = getRoomsOfUser(id);
    removeUser(id);
    rooms.forEach(room => {
      io.to(room).emit('notification message', `${username} has left. Reason: ${reason}`);
      io.to(room).emit('update sidebar', socket.id);
    });
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server started on port ${port}...`);
});
