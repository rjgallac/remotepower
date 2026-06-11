# Remote Power Management - Node.js

A simple web-based application to remotely start and shut down a Linux laptop using Wake-on-LAN (WoL) and SSH.


The server will start on `http://localhost:3000`

docker buildx build --platform linux/arm64/v8 -t ghcr.io/rjgallac/remotepower/remotepower:0.0.1 . --push

docker run -d --restart always -e SSH_USER=xxx -e SSH_PASSWORD=xxx -p3001:3000 --name remotepower ghcr.io/rjgallac/remotepower/remotepower:0.0.1 


