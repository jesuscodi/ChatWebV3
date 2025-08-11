import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, push, set, onValue, remove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Configuración de Firebase (usa tus datos reales aquí)
const firebaseConfig = {
 apiKey: "AIzaSyCgHojFMtxO0_FbONRMYdfCt8gxFpJMZxg",
  authDomain: "chatweb-7d65a.firebaseapp.com",
  databaseURL: "https://chatweb-7d65a-default-rtdb.firebaseio.com",
  projectId: "chatweb-7d65a",
  storageBucket: "chatweb-7d65a.firebasestorage.app",
  messagingSenderId: "741436207771",
  appId: "1:741436207771:web:707ee44969271b25fb4c3e",
  measurementId: "G-7L7N83H41N"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Elementos del DOM
const loginSection = document.getElementById("loginSection");
const chatSection = document.getElementById("chatSection");
const chatBox = document.getElementById("chatBox");
const userList = document.getElementById("userList");
const messageInput = document.getElementById("messageInput");
const startChatBtn = document.getElementById("startChatBtn");
const emojiBtn = document.getElementById("emojiBtn");
const emojiPicker = document.getElementById("emojiPicker");
const sendBtn = document.getElementById("sendBtn");
const logoutBtn = document.getElementById("logoutBtn");

let username = "";
let userRef;

// Entrar al chat
startChatBtn.addEventListener("click", () => {
    const nameInput = document.getElementById("username");
    if (nameInput.value.trim() !== "") {
        username = nameInput.value.trim();
        localStorage.setItem("chatUsername", username);
        loginSection.style.display = "none";
        chatSection.style.display = "block";
        registrarUsuario();
        escucharUsuarios();
        escucharMensajes();
    }
});

// Revisar si ya hay nombre guardado
window.addEventListener("load", () => {
    const savedName = localStorage.getItem("chatUsername");
    if (savedName) {
        username = savedName;
        loginSection.style.display = "none";
        chatSection.style.display = "block";
        registrarUsuario();
        escucharUsuarios();
        escucharMensajes();
    }
});

// Registrar usuario en lista de conectados
function registrarUsuario() {
    const usersRef = ref(db, "usuarios/" + username);
    userRef = usersRef;
    set(userRef, { conectado: true, timestamp: Date.now() });
    window.addEventListener("beforeunload", () => {
        remove(userRef);
    });
}

// Escuchar lista de usuarios conectados
function escucharUsuarios() {
    onValue(ref(db, "usuarios"), (snapshot) => {
        userList.innerHTML = "<strong>Conectados:</strong><br>";
        const data = snapshot.val();
        for (let u in data) {
            userList.innerHTML += `✅ ${u}<br>`;
        }
    });
}

// Enviar mensaje
sendBtn.addEventListener("click", () => {
    enviarMensaje(messageInput.value);
    messageInput.value = "";
});

messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        enviarMensaje(messageInput.value);
        messageInput.value = "";
    }
});

function enviarMensaje(texto) {
    if (texto.trim() !== "") {
        const mensajesRef = ref(db, "mensajes");
        const nuevoMensaje = push(mensajesRef);
        set(nuevoMensaje, {
            usuario: username,
            texto: texto,
            timestamp: Date.now()
        });
    }
}

// Escuchar mensajes en tiempo real con hora
function escucharMensajes() {
    onValue(ref(db, "mensajes"), (snapshot) => {
        chatBox.innerHTML = "";
        const data = snapshot.val();
        for (let id in data) {
            const msg = data[id];
            const msgDiv = document.createElement("div");
            msgDiv.classList.add("message");
            if (msg.usuario === username) {
                msgDiv.classList.add("my-message");
            }

            // Formatear hora (HH:MM)
            const fecha = new Date(msg.timestamp);
            const hora = fecha.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

            msgDiv.innerHTML = `
                <span class="username">${msg.usuario}:</span> ${msg.texto}
                <div class="text-muted small">${hora}</div>
            `;
            chatBox.appendChild(msgDiv);
        }
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

// Mostrar/ocultar emojis
emojiBtn.addEventListener("click", () => {
    emojiPicker.style.display = emojiPicker.style.display === "none" ? "block" : "none";
});

emojiPicker.addEventListener("emoji-click", (event) => {
    messageInput.value += event.detail.unicode;
});

logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("chatUsername");
    remove(userRef);
    chatSection.style.display = "none";
    loginSection.style.display = "block";
});
