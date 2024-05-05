import { renderBird, renderPipe } from "./renderer.js";

const username = localStorage.getItem("username") || "";
const endHtml = /*html*/`
<div class="z-10 flex justify-center items-center flex-col h-52 w-96 bg-blue-100 shadow-inner absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 rounded-xl">
        <h1 id="won message" class="text-green-400">{message}</h1>
        <button class="rounded-md border-0 h-1/5 w-1/4 hover:bg-red-400 bg-red-300 text-white" onclick="window.location.href='/'">Restart</button>
</div>
`;
const score = document.getElementById("score");

class Bird{
    constructor(name){
        this.username = name;
        this.element = document.createElement("div");
        this.element.className = "absolute transition-transform ease-in-out duration-300";
        this.element.style.height = "6%";
        const bird = document.createElement('img');
        bird.className = 'h-full w-full';
        bird.src =(name === username) ? 'images/bird_1.png' : 'images/bird_2.png';
        bird.alt = 'bird';
        this.element.appendChild(bird);
        document.body.appendChild(this.element);
    }

    remove(){
        this.element.remove();
    }
}

class Pipe{
    constructor(id){
        this.id = id;
        this.element = document.createElement("div");
        this.element.className = "absolute";
        const pipe = document.createElement('img');
        pipe.className = 'h-full w-full';
        pipe.src = 'images/pipe.png';
        pipe.alt = 'pipe';
        this.element.appendChild(pipe);
        document.body.appendChild(this.element);
    }

    remove(){
        this.element.remove();
    }
}

class Room{
    /**@type {Bird[]} */
    birds = [];
    /**@type {Pipe[]} */
    pipes = [];
    /**@type {string} */
    roomId;
    socket;
    constructor(socket, roomId){
        this.socket = socket;
        this.roomId = roomId;
    }
    
    async loadBirds(){
        this.birds.forEach((bird)=>{bird.remove();});
        let birds = [];
        const response = await fetch(`/room/${this.roomId}/birds`);
        const data = await response.json();

        data.forEach((element) => {
            let bird = new Bird(element.username);
            birds.push(bird);
            renderBird(bird.element, element.x, element.y);
        });
        this.birds = birds;
    }

    async connect(){
        this.socket.emit("join-room", this.roomId, username);
        this.socket.on('on:load-birds',()=>{this.loadBirds();})
        this.socket.on("on:room-update",(data)=>{this.reRender(data);});
        this.socket.on("on:game-over",(message)=>{
            document.body.innerHTML+= endHtml.replace("{message}",message);
        });
        document.body.addEventListener("click",()=>{
            this.socket.emit("fly");
        })
    }
    /**
    * @param {{
    *   birds: {
    *     username: string,
    *     coords: {
    *       x: number,
    *       y: number
    *     },
    *     state: string
    *   }[],
    *   pipes: {
    *     id: string,
    *     height: number,
    *     state: string,
    *     coords: {
    *      x: number
    *      y: number
    *    }
    *   }[]
    * }} data
    */
    reRender(data){
        score.innerText = "Score: " + data.score;
        data.birds.forEach((birdData) => {
            let bird = this.birds.find((bird) => bird.username === birdData.username);
            if (!bird) return;
            let transform = birdData.state == "rise" ? "rotate(-30deg)" : "rotate(60deg)";
            renderBird(bird.element, birdData.coords.y, transform);
        });

        this.pipes.forEach((pipe)=>{
            if (!data.pipes.some((pipeData) => pipeData.id === pipe.id)){
                pipe.remove();
            }
        });

        data.pipes.forEach((pipeData) =>{
            let pipe = this.pipes.find((pipe) => pipe.id === pipeData.id);
            if (!pipe){
                pipe = new Pipe(pipeData.id);
                this.pipes.push(pipe);
            }
            renderPipe(pipe.element, pipeData.coords.x, pipeData.height, pipeData.state);
        });

        let lastPipe = this.pipes[this.pipes.length-1];
        if (!lastPipe){
            return;
        }
        if (parseInt(lastPipe.element.style.left) < document.body.clientWidth){
            this.socket.emit("create-pipe", this.roomId);
        }
    }
}

export {Room};