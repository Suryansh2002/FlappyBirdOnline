const socket = io()
const usernameinput = document.querySelector("#username")
const username = localStorage.getItem("username") || ""

usernameinput.value = username;

const inviteBox = document.querySelector("#invite-box");
const inviteClose = document.querySelector("#invite-close");
const inviteText = document.querySelector("#invite-text");
const inviteJoin = document.querySelector("#invite-join");
const singlePlayer = document.querySelector("#single-player");
const invitePlayer = document.querySelector("#invite-player");
const inviteName = document.querySelector("#invite-name");
const inviteError = document.querySelector("#invite-error");
const usernameError = document.querySelector("#username-error");

function error(element, message){
    element.textContent = message;
    setTimeout(()=>{element.textContent = "";},2000);
}

let timeoutId;
let inviteFrom;

if (username)
    socket.emit("set-name", username);
else
    usernameError.textContent = "Please enter a name !";

usernameinput.addEventListener("input", (e) => {
    localStorage.setItem("username", e.target.value);
    if (timeoutId){
        clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
        if (!e.target.value){
            usernameError.textContent = "Name cannot be empty !";
            return;
        }
        socket.emit("set-name", e.target.value);
        usernameError.textContent = "";
        timeoutId = undefined;
    }, 1000);
});

socket.on("on:name-taken",()=>{
    usernameError.textContent = "Name is already taken !";
});

singlePlayer.addEventListener("click",()=>{
    document.cookie = "mode=singleplayer;max-age=3";
    window.location.href = "/game";
});

inviteClose.addEventListener("click", () => {
    if (!inviteBox.classList.contains("-translate-x-full")){
        inviteBox.classList.add("-translate-x-full");
    }
});

inviteJoin.addEventListener("click", () => {
    socket.emit("invite-accepted",inviteFrom);
    document.cookie = "mode=multiplayer;max-age=3";
    window.location.href = "/game";
});


invitePlayer.addEventListener("click", () => {
    if (username == inviteName.value){
        error(inviteError, "You cannot invite yourself !");
        return;
    }
    if (!inviteName.value){
        error(inviteError, "Please enter a name !");
        return;
    }
    let roomId = Date.now().toString(36);
    document.cookie = `roomId=${roomId};max-age=60`;
    socket.emit("invite-player", {roomId: roomId, to: inviteName.value});
});


socket.on("on:invite", async (data)=>{
    if (!inviteBox.classList.contains("-translate-x-full")){
        inviteBox.classList.add("-translate-x-full");
    }
    await new Promise((resolve) => setTimeout(resolve, 200));

    inviteText.textContent = `${data.from} invited you !`;

    if (inviteBox.classList.contains("-translate-x-full")){
        inviteBox.classList.remove("-translate-x-full");
    }
    inviteFrom = data.from;
    document.cookie = `roomId=${data.roomId};max-age=60`;
});

socket.on("on:invite-accepted", ()=>{
    document.cookie = "mode=multiplayer;max-age=3";
    window.location.href = "/game";
});


socket.on("on:invite-failed",(message)=>{
    error(inviteError, message);
});