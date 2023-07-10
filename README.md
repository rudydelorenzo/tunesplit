# TuneSplit

## Usage

> **Note**
> 
> You'll need [docker](https://www.docker.com/) to run this application
 
### Run the app
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