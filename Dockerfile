FROM ubuntu:22.04
LABEL authors="rudydelorenzo"

# SET UP ENV AND INSTALL DEPENDENCIES
RUN apt-get update
RUN apt-get -y install curl

RUN apt-get -y install python3 python3-pip ffmpeg
RUN pip3 install demucs

## INSTALL NODE 20.x LTS
RUN set -uex; \
    apt-get update; \
    apt-get install -y ca-certificates curl gnupg; \
    mkdir -p /etc/apt/keyrings; \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
     | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg; \
    NODE_MAJOR=21; \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" \
     > /etc/apt/sources.list.d/nodesource.list; \
    apt-get -qy update; \
    apt-get -qy install nodejs;

# COPY APP FILES AND BUILD + START
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3003

CMD [ "npm", "run", "start-prod" ]