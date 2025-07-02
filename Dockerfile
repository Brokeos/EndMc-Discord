FROM node:22

WORKDIR /app
COPY package*.json ./

RUN npm install --platform=linux --arch=x64
COPY . .

CMD ["npm", "run", "start"]