FROM ubuntu:latest
LABEL authors="rudydelorenzo"

RUN apt-get update
RUN apt-get -y install curl
RUN apt-get -y install python3 python3-pip ffmpeg

RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get -y install nodejs

RUN pip3 install spleeter



WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5004

CMD [ "npm", "run", "start-prod" ]