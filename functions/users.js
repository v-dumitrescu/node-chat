const users = [];

const setUser = (setUsername, setRoom) => {

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

  if(user) {
    return {
      error: 'Username already in use!'
    }
  }

  const setNewUser = {
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

module.exports = {
  setUser,
  setRoomUsers
};