const users = [];
const messages = [];

const setUser = (setId, setUsername, setRoom) => {

  let username = setUsername.trim().toLowerCase();
  const room = setRoom.trim().toLowerCase();

  if (!username || !room) {
    return {
      error: 'Username and room are required!'
    }
  }

  const user = users.find(user => {
    return user.username === username && user.room === room;
  });

  if (user) {
    username = username + Math.floor(Math.random() * 1000) + 1;
  }

  const setNewUser = {
    id: setId,
    username,
    room
  }

  users.push(setNewUser);
  return setNewUser;
};

const setRoomUsers = (room) => {
  const setUsers = users.filter(user => user.room === room);
  return setUsers;
};

const getRoomsOfUser = (id) => {
  return users.filter(user => user.id === id)
    .map(user => user.room);
};

const getUserById = id => {
  return users.find(user => user.id === id);
};

const getUserByUsername = username => {
  return users.find(user => user.username === username);
};

const setMessage = (senderId, receiverId, to, from, message) => {
  messages.push({
    senderId,
    receiverId,
    to,
    from,
    message
  });
};

const getRoomMessages = (room) => {
  return messages.filter(msg => msg.to === room);
};

const getPrivateMessages = (senderId, receiverId) => {
  return messages.filter(msg => {
    return msg.senderId === senderId && msg.receiverId === receiverId || msg.senderId === receiverId && msg.receiverId === senderId;
  });
};

const removeUser = (id) => {
  const userIndex = users.findIndex(user => user.id === id);
  users.splice(userIndex, 1);
};

module.exports = {
  setUser,
  setRoomUsers,
  getUserById,
  getUserByUsername,
  setMessage,
  getRoomMessages,
  getPrivateMessages,
  getRoomsOfUser,
  removeUser
};