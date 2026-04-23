import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getDatabase,
    ref,
    push,
    onValue,
    set,
    remove,
    off
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBkXKwdlWMy82C2hFXQrogwgqgWkccI0jA",
    authDomain: "sendtoself-55266.firebaseapp.com",
    databaseURL: "https://sendtoself-55266-default-rtdb.firebaseio.com/",
    projectId: "sendtoself-55266",
    storageBucket: "sendtoself-55266.appspot.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* STATE */
let currentRoom = "";
let currentListener = null;

/* DOM */
const roomTitle = document.getElementById("roomTitle");
const roomsList = document.getElementById("roomsList");
const messages = document.getElementById("messages");
const modal = document.getElementById("imgModal");
const modalImg = document.getElementById("modalImg");

/* INIT */
window.addEventListener("DOMContentLoaded", () => {

    joinBtn.onclick = joinRoom;
    createBtn.onclick = createRoom;
    sendBtn.onclick = sendMessage;

    shareBtn.onclick = shareRoom;
    leaveBtn.onclick = leaveRoom;

    fileInput.onchange = uploadImage;

    msgInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendMessage();
    });

    modal.onclick = () => modal.style.display = "none";

    listenRooms();
});

/* ROOMS */
function createRoom() {
    const room = Math.random().toString(36).substring(2, 7).toUpperCase();
    set(ref(db, "roomList/" + room), true);
    openRoom(room);
}

function joinRoom() {
    const room = roomInput.value.trim();
    if (!room) return;

    set(ref(db, "roomList/" + room), true);
    openRoom(room);
}

function openRoom(room) {
    currentRoom = room;
    roomTitle.textContent = room;
    listenMessages(room);
}

/* ROOM LIST */
function listenRooms() {
    onValue(ref(db, "roomList/"), snap => {
        roomsList.innerHTML = "";

        const data = snap.val();
        if (!data) return;

        Object.keys(data).forEach(room => {

            const div = document.createElement("div");
            div.className = "room";
            div.textContent = room;

            div.onclick = () => openRoom(room);

            const del = document.createElement("button");
            del.textContent = "🗑";

            del.onclick = (e) => {
                e.stopPropagation();
                remove(ref(db, "roomList/" + room));
                remove(ref(db, "rooms/" + room));
            };

            div.appendChild(del);
            roomsList.appendChild(div);
        });
    });
}

/* MESSAGES */
function sendMessage() {
    const text = msgInput.value.trim();
    if (!text || !currentRoom) return;

    push(ref(db, "rooms/" + currentRoom), {
        type: "text",
        text,
        time: Date.now()
    });

    msgInput.value = "";
}

function listenMessages(room) {

    if (currentListener) off(currentListener);

    const r = ref(db, "rooms/" + room);
    currentListener = r;

    onValue(r, snap => {
        messages.innerHTML = "";

        const data = snap.val();
        if (!data) return;

        Object.entries(data).forEach(([key, m]) => {

            const div = document.createElement("div");
            div.className = "msg";

            const content = document.createElement("span");

            if (m.type === "image") {
                content.innerHTML = `<img src="${m.url}">`;

                content.querySelector("img").onclick = () => {
                    modal.style.display = "flex";
                    modalImg.src = m.url;
                };

            } else {
                content.textContent = m.text;
            }

            /* COPY */
            const copy = document.createElement("button");
            copy.textContent = "نسخ";

            copy.onclick = () => {
                navigator.clipboard.writeText(m.text || m.url);
                copy.textContent = "✔";
                setTimeout(() => copy.textContent = "نسخ", 1000);
            };

            /* DELETE */
            const del = document.createElement("button");
            del.textContent = "حذف";

            del.onclick = () => {
                remove(ref(db, "rooms/" + room + "/" + key));
            };

            div.appendChild(content);
            div.appendChild(copy);
            div.appendChild(del);

            messages.appendChild(div);
        });
    });
}

/* IMAGE */
function uploadImage() {
    const file = fileInput.files[0];
    if (!file || !currentRoom) return;

    const reader = new FileReader();

    reader.onload = () => {
        push(ref(db, "rooms/" + currentRoom), {
            type: "image",
            url: reader.result
        });
    };

    reader.readAsDataURL(file);
}

/* SHARE */
function shareRoom() {
    const url = `${location.origin}?room=${currentRoom}`;
    navigator.clipboard.writeText(url);
    alert(url);
}

/* LEAVE */
function leaveRoom() {
    currentRoom = "";
    roomTitle.textContent = "No Room";
    messages.innerHTML = "";

    if (currentListener) off(currentListener);
}