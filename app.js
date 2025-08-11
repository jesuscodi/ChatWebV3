import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, push, set, onValue, remove, get, onDisconnect } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Configuración de Firebase
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

// Colores pastel disponibles
const availableColors = [
    "#FFB3BA", "#FFDFBA", "#FFFFBA", "#BAFFC9", "#BAE1FF",
    "#E6CCFF", "#FFD1DC", "#FFE4B5", "#D5F5E3", "#D6EAF8",
    "#F9E79F", "#F5B7B1", "#C39BD3", "#AED6F1", "#A3E4D7",
    "#FAD7A0", "#EDBB99", "#F5CBA7", "#FDEBD0", "#F6DDCC"
];

// Animales disponibles
const availableAnimals = [
    "🐶 Perro",
    "🐱 Gato",
    "🐰 Conejo",
    "🦊 Zorro",
    "🐻 Oso",
    "🐼 Panda",
    "🐸 Rana",
    "🦄 Unicornio",
    "🐝 Abeja",
    "🐧 Pingüino"
];

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
const chatTitle = document.getElementById("chatTitle");

let username = "";
let userRef;
let userColor = "";
let userAnimal = "";

// Entrar al chat
startChatBtn.addEventListener("click", async () => {
    const nameInput = document.getElementById("username");
    if (nameInput.value.trim() !== "") {
        username = nameInput.value.trim();
        localStorage.setItem("chatUsername", username);
        loginSection.style.display = "none";
        chatSection.style.display = "block";

        await registrarUsuario();

        mostrarUsuario();

        escucharUsuarios();
        escucharMensajes();
    }
});

// Revisar si ya hay nombre guardado
window.addEventListener("load", async () => {
    const savedName = localStorage.getItem("chatUsername");
    if (savedName) {
        username = savedName;
        loginSection.style.display = "none";
        chatSection.style.display = "block";

        await registrarUsuario();

        mostrarUsuario();

        escucharUsuarios();
        escucharMensajes();
    }
});

// Mostrar usuario arriba con color y animal
function mostrarUsuario() {
    if (chatTitle) {
        chatTitle.innerHTML = `<i class="bi bi-person-circle"></i> Usuario: <span style="color:${userColor}">${username}</span> - <span>${userAnimal}</span>`;
    }
}

// Obtener color y animal libre
async function obtenerIdentidadLibre() {
    const snapshot = await get(ref(db, "usuarios"));
    const data = snapshot.val() || {};

    const usadosColores = new Set(Object.values(data).map(u => u.color));
    const usadosAnimales = new Set(Object.values(data).map(u => u.animal));

    const libresColores = availableColors.filter(c => !usadosColores.has(c));
    const libresAnimales = availableAnimals.filter(a => !usadosAnimales.has(a));

    const color = libresColores.length > 0
        ? libresColores[Math.floor(Math.random() * libresColores.length)]
        : availableColors[Math.floor(Math.random() * availableColors.length)];

    const animal = libresAnimales.length > 0
        ? libresAnimales[Math.floor(Math.random() * libresAnimales.length)]
        : availableAnimals[Math.floor(Math.random() * availableAnimals.length)];

    return { color, animal };
}

// Registrar usuario (ahora revisa si ya existe)
async function registrarUsuario() {
    const userDbRef = ref(db, "usuarios/" + username);
    const snapshot = await get(userDbRef);

    if (snapshot.exists()) {
        // Ya existe usuario: usamos los datos guardados
        const data = snapshot.val();
        userColor = data.color;
        userAnimal = data.animal;

        // Actualizamos el timestamp y conectado
        set(userDbRef, { conectado: true, timestamp: Date.now(), color: userColor, animal: userAnimal });
    } else {
        // Usuario nuevo: asignamos identidad nueva
        const identidad = await obtenerIdentidadLibre();
        userColor = identidad.color;
        userAnimal = identidad.animal;

        set(userDbRef, { conectado: true, timestamp: Date.now(), color: userColor, animal: userAnimal });
    }

    userRef = userDbRef;
    onDisconnect(userRef).remove();
}

// Escuchar lista de usuarios
function escucharUsuarios() {
    onValue(ref(db, "usuarios"), (snapshot) => {
        userList.innerHTML = "<strong>Conectados:</strong><br>";
        const data = snapshot.val();
        for (let u in data) {
            userList.innerHTML += `<span style="color:${data[u].color}">⬤</span> ${u} - ${data[u].animal}<br>`;
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
            timestamp: Date.now(),
            color: userColor
        });
    }
}

// Escuchar mensajes en tiempo real
function escucharMensajes() {
    onValue(ref(db, "mensajes"), (snapshot) => {
        chatBox.innerHTML = "";
        const data = snapshot.val();
        for (let id in data) {
            const msg = data[id];
            const msgDiv = document.createElement("div");
            msgDiv.classList.add("message");
            if (msg.usuario === username) msgDiv.classList.add("my-message");

            const fecha = new Date(msg.timestamp);
            const hora = fecha.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

            msgDiv.innerHTML = `
                <span class="username" style="color:${msg.color}">${msg.usuario}:</span> ${msg.texto}
                <div class="text-muted small">${hora}</div>
            `;
            chatBox.appendChild(msgDiv);
        }
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

// Emojis
emojiBtn.addEventListener("click", () => {
    emojiPicker.style.display = emojiPicker.style.display === "none" ? "block" : "none";
});

emojiPicker.addEventListener("emoji-click", (event) => {
    messageInput.value += event.detail.unicode;
});

// Salir
logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("chatUsername");
    remove(userRef);
    chatSection.style.display = "none";
    loginSection.style.display = "block";
});
