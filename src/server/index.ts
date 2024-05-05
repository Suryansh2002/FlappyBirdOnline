import express from 'express';
import {createServer} from 'http';
import {Server, Socket} from 'socket.io';
import {rooms,handleRoom} from './room';

const host = "localhost";
const port = 3000;
const clientDir = __dirname.split("\\").slice(0,-1).join('\\')+"\\client";

const app = express();
const server = createServer(app);
const io = new Server(server);
app.use(express.json());

const connectedUsers:{[key:string]:Socket} = {};

io.on('connection', async (socket) => {
    if (socket.handshake.headers.referer?.endsWith("/game")){
        handleRoom(io,socket);
        return;
    }
    
    let name:string|undefined;
    
    socket.on("set-name", (username:string) => {
        if (connectedUsers[username]){
            socket.emit("on:name-taken");
            return;
        }
        if (name){
            delete connectedUsers[name];
        }
        name = username;
        connectedUsers[username] = socket;
    });

    socket.on("invite-player", (data:{ roomId: string, to:string}) => {
        if (name == data.to){
            socket.emit("on:invite-failed", "You cannot invite yourself!");
            return;
        }
        if (connectedUsers[data.to]){
            connectedUsers[data.to].emit("on:invite", {from: name, roomId: data.roomId});
        } else {
            socket.emit("on:invite-failed", "User not found!");
        }
    });

    socket.on("invite-accepted", (from) => {
        if (connectedUsers[from]){
            connectedUsers[from].emit("on:invite-accepted");
        }
    });

    socket.on("disconnect", () => {
        if (name){
            delete connectedUsers[name];
        }
    });
});


app.get("/", (req, res) => {
    res.sendFile(clientDir+"/index.html");
});

app.get("/game", (req, res) => {
    res.sendFile(clientDir+"/game/index.html");
});


app.get("/room/:id/birds", (req, res) => {
    const room = rooms[req.params.id];
    if (!room){
        res.send(JSON.stringify([]));
        return;
    }
    res.send(JSON.stringify(room.users.map((user) => {
        return {
            username: user.username,
            coords: user.coords,
        }
    })));
});


app.use((req, res, next) => {
    if (req.url.endsWith(".html")) {
        res.status(404).send(/*html*/`
            <head>
                <title>Error</title>
            </head>
            <pre>Cannot GET ${req.url}</pre>
        `);
        return;
    }
    express.static(clientDir)(req, res, next);
})

server.listen(port, host, () => {
    console.log(`Server is running at http://${host}:${port}`);
});