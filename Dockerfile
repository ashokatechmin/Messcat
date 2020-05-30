FROM node:14-alpine

RUN apk add --no-cache git

ADD package.json /

RUN npm install

ADD *.js /
ADD *.json /
ADD intents/* /intents/

EXPOSE 80
EXPOSE 443

CMD [ "npm", "start" ]