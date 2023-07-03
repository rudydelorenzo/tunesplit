FROM ubuntu:latest
LABEL authors="rudydelorenzo"

# SET UP ENV AND INSTALL DEPENDENCIES
RUN apt-get update
RUN apt-get -y install curl
RUN apt-get -y install python3 python3-pip ffmpeg

RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get -y install nodejs

RUN pip3 install spleeter

# COPY APP FILES AND BUILD + START
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3003

CMD [ "npm", "run", "start-prod" ]