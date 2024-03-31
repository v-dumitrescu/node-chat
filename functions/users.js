const users = [];
const messages = [];

const setUser = (setId, setUsername, setRoom) => {

  const username = setUsername.trim().toLowerCase();
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
    return {
      error: 'Username already in use!'
    }
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

const getUserById = id => {
  return users.find(user => user.id === id);
};

const getUserByUsername = username => {
  return users.find(user => user.username === username);
};

const setMessage = (to, from, message) => {
  messages.push({
    to,
    from,
    message
  });
};

const getRoomMessages = (room) => {
  return messages.filter(msg => msg.to === room);
};

const getPrivateMessages = (to, from) => {
  return messages.filter(msg => {
    return msg.from === from && msg.to === to || msg.from === to && msg.to === from;
  });
};

module.exports = {
  setUser,
  setRoomUsers,
  getUserById,
  getUserByUsername,
  setMessage,
  getRoomMessages,
  getPrivateMessages
};