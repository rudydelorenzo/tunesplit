# TuneSplit

An AI driven, GPU-accelerated stem separation webapp based on `demucs`

## Usage

> **Note**
> 
> You'll need [docker](https://www.docker.com/) to run this application
 
### Using docker (Recommended)
As of version 2.1.0, TuneSplit is published as a ready-to-go, batteries included image to docker hub.

To quickly get started you can use the following `docker-compose.yml`:
```yaml
services:
  app:
    image: rdelorenzo/tunesplit:latest
    environment:
      - ENVIRONMENT=production  # just silences logs
    ports:
      - "3003:3003"
    volumes:
      - models:/root/.cache/torch/hub/checkpoints
    restart: always

volumes:
  models:
```

For more details on the image, including more detailed instructions and even how to enable GPU support, 
check the [image overview on docker hub](https://hub.docker.com/r/rdelorenzo/tunesplit).

### Build from source
Use `npm run docker` to build and run the docker env (with `docker-compose`)

This will expose the app on `localhost:3003`

### Run in deployment (CI USE)
`npm run docker-deploy`

## Development
### Run the full app for development (reloading)
`npm run start-dev`

### Run the frontend for development (HMR)
`npm run dev`

### Build
`npm run build`

### Run the app as in production
`npm run start-prod`

### Committing
`git cz`

### Logging
Use `log(message)` instead of `console.log(message)`

## Roadmap
- [x] Auto cleanup (maybe when download is done?)
- [x] Add auto-restart of container (and auto-start on boot)
- [x] Error handling to backend and frontend
- [x] Set up docker volumes
- [x] Set up CI/CD

## NGINX Configuration
You must add the following properties in the `location`scope:
```
client_max_body_size 0;

proxy_connect_timeout 300;
proxy_send_timeout 300;
proxy_read_timeout 300;
send_timeout 300;
```

# Technologies
- `node` (@18.x)
- `express`
- `react`
- `bash`
- `docker` & `docker-compose`
- GitHub CI/CD
- [Spleeter](https://github.com/deezer/spleeter) (by Deezer Research)