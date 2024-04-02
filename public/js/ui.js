const transformPage = (error, username, room, users) => {
  if (error) {
    return alert(error);
  }
  messageAuthor = username;
  sendMessageTo = room;
  setXhrRequest('GET', '../chat.html', setChatPage(room, username, users));
};

const setChatPage = (room, username, users) => {
  return function () {
    if (this.status === 200 && this.readyState === 4) {
      const domParser = new DOMParser();
      const responseData = this.responseText;
      const chatPage = domParser.parseFromString(responseData, 'text/html');
      setJoinedRoom(chatPage, '.rooms-list', room);
      const roomUsersList = chatPage.querySelector('.room-users-list')
      fetchUsers(users, roomUsersList);
      chatPage.querySelector('.user-messages').innerHTML += `<p><em>${htmlEncode(username)} has joined</em></p>`;
      const chatPageRootHtmlContent = chatPage.querySelector('html').innerHTML;
      document.querySelector('html').innerHTML = chatPageRootHtmlContent;
    }
  }
};

const setJoinedRoom = (element, identifier, room) => {
  element.querySelector(identifier).innerHTML += `<li class="room"><a href="#">${htmlEncode(room)}</a></li>`;
};

// Refactor to reusable for users and rooms
const setUserToSidebarList = (listOfUsers, userId, userName) => {
  const listItem = document.createElement('li');
  const liClassAttribute = document.createAttribute('class');
  liClassAttribute.value = 'user';
  listItem.setAttributeNode(liClassAttribute);

  const userLink = document.createElement('a');
  userLink.setAttribute('href', '#');
  userLink.setAttribute('data-id', userId);
  userLink.textContent = userName;
  listItem.appendChild(userLink);
  listOfUsers.appendChild(listItem);
};

const fetchUsers = (users, element) => {
  users.forEach(user => {
    setUserToSidebarList(element, user.id, user.username);
  });
};

const domContentLoaded = () => {
  // Elements
  const userMessagesContainer = document.querySelector('.user-messages');
  const roomUsersList = document.querySelector('.room-users-list');
  const chatForm = document.querySelector('#chat-form');
  chatForm.querySelector('#input-msg').focus();
  const sidebarLeft = document.querySelector('.sidebar-left');
  const sidebarRight = document.querySelector('.sidebar-right');
  const privateUsersContainer = document.querySelector('.private-users-container');
  const privateMessagesUserList = document.querySelector('.private-users-list');
  const inputSearch = document.querySelector('.input-search');
  const button = chatForm.querySelector('button');

  // Functions
  const setUserMessage = (element, author, message) => {
    element.innerHTML += `
      <p class="chat-message">${htmlEncode(author)}: ${htmlEncode(message)}</p>
    `;
  };

  const setNotificationMessage = (element, message) => {
    element.innerHTML += `<p class="chat-message"><em>${htmlEncode(message)}</em></p>`;
  }

  const fetchMessages = (e) => {
    if (e.target.parentElement.classList.contains('user') && e.target.getAttribute('data-id') !== socket.id) {
      userMessagesContainer.innerHTML = '';

      socket.emit('getPrivateMessages', {
        to: sendMessageTo,
        from: messageAuthor
      }, (messages) => {
        messages.forEach(msg => {
          setUserMessage(userMessagesContainer, msg.from, msg.message);
        });
      });
    } else if (e.target.parentElement.classList.contains('room')) {
      const room = e.target.textContent;
      socket.emit('getRoomMessages', room, (messages) => {
        userMessagesContainer.innerHTML = '';
        messages.forEach(msg => {
          setUserMessage(userMessagesContainer, msg.from, msg.message);
        });
      });
    }
  }

  const displayPrivateUserList = (element) => {
    if (element.classList.contains('hidden')) {
      element.classList.remove('hidden');
    }
  };

  // Refactor to reusable for users and rooms
  const onItemOfSidebarClick = (e) => {

    if (e.target.parentElement.classList.contains('user')) {
      const userElement = e.target;

      if (userElement.getAttribute('data-id') === socket.id) {
        return e.preventDefault();
      }

      if (userElement.getAttribute('data-id') !== socket.id) {
        sendMessageTo = userElement.getAttribute('data-id');
        privateMessage = true;
        displayPrivateUserList(privateUsersContainer);
        const userName = userElement.textContent;
        const existingUser = checkExistingSidebarUser(sidebarLeft, '.user', userName);
        existingUser ?? setUserToSidebarList(privateMessagesUserList, userElement.getAttribute('data-id'), userName);
        fetchMessages(e);
      }
    } else if (e.target.parentElement.classList.contains('room')) {
      privateMessage = false;
      const room = e.target.textContent;
      sendMessageTo = room;
      fetchMessages(e);
    }
  }

  // Refactor to reusable for users and rooms
  const checkExistingSidebarUser = (sidebarElement, classOfUserElements, userName) => {
    const sidebar = sidebarElement.querySelectorAll(classOfUserElements);
    const setSidebarArray = [...sidebar];
    const existingUser = setSidebarArray.find(element => element.textContent === userName);
    return existingUser;
  };

  const onFormSubmission = e => {
    e.preventDefault();
    const message = e.target['input-msg'];
    if (!message.value.trim()) {
      alert('Message cannot be empty');
      e.target.reset();
      return message.focus();
    }
    button.setAttribute('disabled', true);
    button.classList.add('button-disabled');
    let messageType = privateMessage ? 'private message' : 'room message';
    socket.emit(messageType, {
      to: sendMessageTo,
      from: messageAuthor,
      message: message.value
    }, (to, from) => {
      if (privateMessage) {
        socket.emit('getPrivateMessages', {
          to: sendMessageTo,
          from
        }, (messages) => {
          const lastMessage = messages.slice(-1)[0];
          setUserMessage(userMessagesContainer, lastMessage.from, lastMessage.message);
        });
      }
      message.value = '';
      message.focus();
      button.removeAttribute('disabled');
      button.classList.remove('button-disabled');
    });
  }

  // User Events
  sidebarRight.addEventListener('click', onItemOfSidebarClick);
  sidebarLeft.addEventListener('click', onItemOfSidebarClick);
  sidebarRight.addEventListener('mousemove', (e) => {
    if (e.target.getAttribute('data-id') === socket.id) {
      e.target.style.cursor = 'text';
    }
  });

  chatForm.addEventListener('submit', onFormSubmission);

  inputSearch.addEventListener('keyup', function (e) {
    const value = this.value.trim().toLowerCase();
    const roomUsers = roomUsersList.querySelectorAll('li');

    roomUsers.forEach(userElement => {
      if (userElement.textContent.indexOf(value) !== -1) {
        userElement.style.display = 'block';
      } else {
        userElement.style.display = 'none';
      }
    });
  });

  // Socket.io Events
  socket.on('joinMessage', msg => {
    if (!privateMessage) {
      setNotificationMessage(userMessagesContainer, msg);
    }
  });

  socket.on('room message', ({ from, message }) => {
    if (!privateMessage) {
      setUserMessage(userMessagesContainer, from, message);
    }
  });

  socket.on('private message', ({ senderId, messages }) => {

    const { from, message } = messages.slice(-1)[0];
    displayPrivateUserList(privateUsersContainer);

    if (sendMessageTo !== senderId) {
      if (!checkExistingSidebarUser(sidebarLeft, '.user', from)) {
        new Audio('sound/notification.wav').play();
        setUserToSidebarList(privateMessagesUserList, senderId, from);
        setNotificationMessage(userMessagesContainer, `New private message from ${from}`);
      }
    } else {
      setUserMessage(userMessagesContainer, from, message);
    }
  });

  socket.on('setUserInRoomList', ({ id, username }) => {
    setUserToSidebarList(roomUsersList, id, username);
  });
};