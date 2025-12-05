const socket = io();
let username = prompt("Enter username:");

socket.emit("new-user", username);

const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const typingDiv = document.getElementById("typing");

// Sound notification
const notificationSound = new Audio("notify.mp3");

// Track date divider
let lastDate = "";

// Add messages to UI
function addMessage(text, type = "other-message") {
  const div = document.createElement("div");
  div.className = `message ${type}`;
  div.innerHTML = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

// Date divider
function insertDateDivider() {
  const today = new Date().toLocaleDateString();
  if (today !== lastDate) {
    lastDate = today;
    addMessage(today, "system");
  }
}

// Send message
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value.trim()) {
    const msgObj = {
      id: Date.now(),
      text: input.value
    };
    socket.emit("chat-message", msgObj);
    addMessage(`You: ${msgObj.text} <span id="s${msgObj.id}" class="status">✓</span>`, "my-message");
    input.value = "";
    socket.emit("stop-typing");
  }
});

// Receive message
socket.on("chat-message", (data) => {
  insertDateDivider(); // add date separator

  if (data.username === username) {
    // DO NOT duplicate your own message
    const tick = document.getElementById("s" + data.message.id);
    if (tick) tick.innerHTML = "✓✓";
  } else {
    addMessage(
      `${data.username}: ${data.message.text} <span style="font-size:11px;color:#444">(${data.time})</span>`,
      "other-message"
    );
    notificationSound.play(); // sound notification
    socket.emit("message-seen", username); // seen confirmation
  }
});

// Seen ✓✓ from other user
socket.on("seen-confirmation", () => {
  const ticks = document.querySelectorAll(".status");
  ticks.forEach(t => (t.innerHTML = "✓✓"));
});

// User join / leave
socket.on("user-joined", (username) => {
  addMessage(`${username} joined the chat`, "system");
});

socket.on("user-left", (username) => {
  addMessage(`${username} left the chat`, "system");
});

// Typing indicator
input.addEventListener("input", () => {
  socket.emit("typing");
  clearTimeout(window.typingTimeout);
  window.typingTimeout = setTimeout(() => socket.emit("stop-typing"), 700);
});

socket.on("show-typing", (user) => {
  if (user !== username) typingDiv.innerText = `${user} is typing...`;
});

socket.on("hide-typing", () => {
  typingDiv.innerText = "";
});
