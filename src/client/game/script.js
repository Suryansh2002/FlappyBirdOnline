function getFromCookie(string){
    return document.cookie.split(";").find((c) => c.includes(string))?.split("=")[1];
}

let roomId;
const mode = getFromCookie("mode");

if(mode === "singleplayer"){
    roomId = Date.now().toString(36);
}
else if(mode === "multiplayer"){
    roomId = getFromCookie("roomId");
    if (!roomId){
        window.location.href = "/";
    }
}
else{
    window.location.href = "/";
}

(async function(){
    await import("/socket.io/socket.io.js");
    const {Room} = await import("/game/room.js");
    const socket = io();
    const room = new Room(socket,roomId);
    room.connect();
})();


