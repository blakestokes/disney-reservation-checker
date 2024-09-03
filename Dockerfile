FROM node:slim

COPY package*.json ./

RUN npm install -s -g npm@latest

RUN npm install

COPY . .

EXPOSE 3000 3000

CMD [ "node", "disney.js" ]

