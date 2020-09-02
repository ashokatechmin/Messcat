FROM node:14-alpine

RUN apk update
RUN apk add --no-cache git yarn

ADD package.json /

RUN yarn

ADD *.js /
ADD *.json /
ADD intents/* /intents/

CMD [ "yarn", "start" ]