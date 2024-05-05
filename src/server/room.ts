import { Socket, Server } from "socket.io"

const rooms: { [key: string]: Room } = {};

class User{
    socket: Socket;
    username: String;
    coords: {x: number, y: number} = {x: 0, y: 1000};
    state: "rise"|"fall" = "fall";
    counter: number = 0;

    constructor(socket: Socket,username: String){
        this.socket = socket;
        this.username = username;
        this.handleCoordinates(this.socket);
    }

    handleCoordinates(socket: Socket){
        socket.on("fly", () => {this.fly()});
    }

    async fly(){
        const maxCounter = 50;
        this.state = "rise";

        for(let i = 1; i <= maxCounter; i++){
            this.counter = i;

            this.coords.y+=2;
            await new Promise((resolve) => setTimeout(resolve, 1));
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
        if (this.counter == maxCounter)
            this.state = "fall";
    }
}

class Pipe{
    id: string;
    coords: {x: number, y: number} = {x: 1000, y: 0};
    height: number;
    state: "straight"|"reversed";

    constructor(x:number, height: number, state: "straight"|"reversed"){
        this.coords.x = x;
        this.id = Date.now().toString(36);
        this.height = height;
        this.state = state;
    }
}


class Room{
    io:Server;
    id: string;
    score: number = 0;
    users: User[] = [];
    pipes: Pipe[] = [];
    pipeState: "straight"|"reversed" = "straight";
    PipeCreatedAt: number = Date.now();

    constructor(io:Server, roomId: string){
        this.io = io;
        this.id = roomId;
        rooms[roomId] = this;
        this.createPipe();
    }
    
    static getCreateRoom(io:Server, roomId: string){
        if (rooms[roomId]){
            return rooms[roomId];
        }
        return new Room(io,roomId);
    }

    refresh(){
        if (this.users.every((user) =>user.socket.disconnected)){
            this.deleteRoom();
            return;
        }
        this.users.forEach((user) => {
            if (user.socket.disconnected){
                this.users = this.users.filter((u) => u !== user);
            }
        });
        this.update();
    }

    deleteRoom(){
        this.users.forEach((user) => {
            user.socket.removeAllListeners();
        });
        delete rooms[this.id];
    }
    createPipe(){
        let x = 1000;
        let lastPipe = this.pipes[this.pipes.length - 1];
        if (lastPipe){
            x = lastPipe.coords.x + 450;
        }
        const height = Math.floor(Math.random() * 250) + 300;
        this.pipes.push(new Pipe(x,height, this.pipeState));
        this.PipeCreatedAt = Date.now();
        this.pipeState = this.pipeState === "straight" ? "reversed" : "straight";
    }

    update(){
        this.users.forEach((user) => {
            if (user.coords.y <= -100){
                return
            }
            if (user.state === "rise"){
                return
            }
            user.coords.y-=10;
        });

        
        this.pipes.forEach((pipe) => {
            pipe.coords.x-=8;
        });

        this.io.to(this.id).emit("on:room-update",{
            birds: this.users.map(
                (user)=>{
                    return {username: user.username, coords: user.coords, state: user.state}
                }
            ),
            pipes: this.pipes.map(
                (pipe) => {
                    return {id: pipe.id, coords: pipe.coords, height: pipe.height, state: pipe.state}
                }
            ),
            score: this.score
        });

        let lastPipe = this.pipes[this.pipes.length - 1];
        if (lastPipe.coords.x < 700){
            this.createPipe();
        }
        this.pipes = this.pipes.filter((pipe) => {
            if (pipe.coords.x > -50) {
                return true;
            }
            this.score++;
            return false;
        });

        this.checkCollision();
    }

    checkCollision(){
        let pipe = this.pipes[0];
        if (!pipe){
            return;
        }
        if (pipe.coords.x > 60){
            return;
        }

        if (pipe.state === "straight"){
            this.users.forEach((user) => {
                if (user.coords.y < pipe.height){
                    let winner_name = this.users.find((u) => u !== user)?.username;
                    let message = winner_name ? `${winner_name} Wins !` : "You Suck !";
                    this.io.to(this.id).emit("on:game-over", message);
                    return this.deleteRoom();
                }
            });
        }
        else{
            this.users.forEach((user) => {
                if (user.coords.y > (940-pipe.height)){
                    let winner_name = this.users.find((u) => u !== user)?.username;
                    let message = winner_name ? `${winner_name} Wins !` : "You Suck !";
                    this.io.to(this.id).emit("on:game-over", message);
                    return this.deleteRoom();
                }
            });
        }

    }
}

function handleRoom(io:Server,socket:Socket){
    socket.on("join-room", (roomId:string, username:String) => {
        const room = Room.getCreateRoom(io,roomId);
        if (room.users.some((user) => user.socket.id === socket.id)){
            return;
        }
        if (room.users.length >= 2){
            return;
        }
        room.users.push(new User(socket, username));
        socket.join(roomId);
        io.to(roomId).emit("on:load-birds");
    });

    
    socket.on("create-pipe", (roomId:string) => {
        const room = rooms[roomId];
        if (!room){
            return;
        }
        if ((Date.now() - room.PipeCreatedAt) < 100){
            return;
        }

        if (!room.users.some((user) => user.socket.id === socket.id)){
            return;
        }
        room.createPipe();
    });
}

setInterval(()=>{
    Object.values(rooms).forEach((room) => {
        room.refresh();
    });
},5);

export {rooms,handleRoom}

