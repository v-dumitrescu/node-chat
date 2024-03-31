const transformPage = (error, username, room, users) => {
  if (error) {
    return alert(error);
  }
  messageAuthor = username;
  sendMessageTo = room;
  setXhrRequest('GET', '../chat.html', setChatPage(username, users));
};

const setChatPage = (username, users) => {
  return function () {
    if (this.status === 200 && this.readyState === 4) {
      const domParser = new DOMParser();
      const responseData = this.responseText;
      const chatPage = domParser.parseFromString(responseData, 'text/html');
      const roomUsersList = chatPage.querySelector('.room-users-list')
      fetchUsers(users, roomUsersList);
      chatPage.querySelector('.user-messages').innerHTML += `<p><em>${htmlEncode(username)} has joined</em></p>`;
      const chatPageRootHtmlContent = chatPage.querySelector('html').innerHTML;
      document.querySelector('html').innerHTML = chatPageRootHtmlContent;
    }
  }
};

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

  const fetchPrivateMessages = (e) => {
    if (e.target.tagName === 'A' && e.target.getAttribute('data-id') !== socket.id) {
      userMessagesContainer.innerHTML = '';
      sendMessageTo = e.target.getAttribute('data-id');
      privateMessage = true;

      socket.emit('getPrivateMessages', {
        to: sendMessageTo,
        from: messageAuthor
      }, (messages) => {
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

  const onUserOfRoomClick = (e) => {
    if (e.target.getAttribute('data-id') === socket.id) {
      return e.preventDefault();
    }

    if (e.target.tagName === 'A' && e.target.getAttribute('data-id') !== socket.id) {

      displayPrivateUserList(privateUsersContainer);
      const userName = e.target.textContent;
      const existingUser = checkExistingSidebarUser(sidebarLeft, '.user', userName);

      const targetElementUserId = e.target.getAttribute('data-id');
      const targetElementUserName = e.target.textContent;
      existingUser ?? setUserToSidebarList(privateMessagesUserList, targetElementUserId, targetElementUserName);
    }
  }

  const checkExistingSidebarUser = (sidebarElement, classOfUserElements, userName) => {
    const sidebar = sidebarElement.querySelectorAll(classOfUserElements);
    const setSidebarArray = [...sidebar];
    const existingUser = setSidebarArray.find(element => element.textContent === userName);
    return existingUser;
  };

  const onFormSubmission = e => {
    e.preventDefault();
    const message = e.target['input-msg'];
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
  roomUsersList.addEventListener('click', (e) => {
    fetchPrivateMessages(e);
    onUserOfRoomClick(e);
  });
  privateMessagesUserList.addEventListener('click', fetchPrivateMessages);
  sidebarRight.addEventListener('mousemove', (e) => {
    if (e.target.getAttribute('data-id') === socket.id) {
      e.target.style.cursor = 'text';
    }
  });

  chatForm.addEventListener('submit', onFormSubmission);

  // Socket.io Events
  socket.on('joinMessage', msg => {
    setNotificationMessage(userMessagesContainer, msg);
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
        return setNotificationMessage(userMessagesContainer, `New private message from ${from}`);
      }
    } else {
      setUserMessage(userMessagesContainer, from, message);
    }
  });

  socket.on('setUserInRoomList', ({ id, username }) => {
    setUserToSidebarList(roomUsersList, id, username);
  });
};