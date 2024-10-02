# Flappy Bird Online

This is a online multiplayer game.

Simple Concept: Invite your friend and play a match, First to crash loses.

## Running Locally

1) Clone/Download the repository

2) Do `npm install`. This will install the dependencies

4) Do `npm run start`


## Architecture

- Websockets from server keep sending the position of the bird
  
- On the frontend, the position is used to move the bird using HTML, CSS & JS

- Whenever the user clicks on screen, A signal is sent to the backend to move the bird up

