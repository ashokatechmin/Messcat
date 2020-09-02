FROM node:14-alpine

RUN apk add --no-cache git
RUN npm i -g yarn

ADD package.json /

RUN yarn

ADD *.js /
ADD *.json /
ADD intents/* /intents/

CMD [ "yarn", "start" ]