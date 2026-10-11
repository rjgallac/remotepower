# Remote Power Management - Node.js

A simple web-based application to remotely start and shut down a Linux laptop using Wake-on-LAN (WoL) and SSH.

## Configuration

The target address is supplied at runtime through `LAPTOP_IP`; it is not built into the application.

For local development or Docker, copy `.env.example` to `.env` and set the values for your environment:

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

Run it using the same `.env` file. Docker passes every variable in the file into the container:

```bash
docker run -d --restart always \
  --network host \
  --env-file .env \
  --name remotepower \
  ghcr.io/rjgallac/remotepower/remotepower:0.0.1
```

`WOL_BROADCAST` is optional and defaults to `255.255.255.255`. `LAPTOP_IP` is required.


