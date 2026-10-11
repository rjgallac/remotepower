# Remote Power Management - Node.js

A simple web-based application to remotely start and shut down a Linux laptop using Wake-on-LAN (WoL) and SSH.

## Configuration

The target address is supplied at runtime through `LAPTOP_IP`; it is not built into the application.

For local development, copy `.env.example` to `.env`, set `LAPTOP_IP`, and add the SSH credentials:

```powershell
Copy-Item .env.example .env
npm install
npm start
```

The server starts at `http://localhost:3000` by default. Set `PORT` in `.env` to use another port.

## Docker

Build and publish the image:

```bash
docker buildx build --platform linux/arm64/v8 \
  -t ghcr.io/rjgallac/remotepower/remotepower:0.0.1 . --push
```

Run it, passing the target IP into the container:

```bash
docker run -d --restart always \
  --network host \
  -e LAPTOP_IP=192.168.1.220 \
  -e WOL_BROADCAST=192.168.1.255 \
  -e SSH_USER=xxx \
  -e SSH_PASSWORD=xxx \
  -e PORT=3001 \
  --name remotepower \
  ghcr.io/rjgallac/remotepower/remotepower:0.0.1
```

`WOL_BROADCAST` is optional and defaults to `255.255.255.255`. `LAPTOP_IP` is required.


