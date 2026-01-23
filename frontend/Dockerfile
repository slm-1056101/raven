FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# RUN npm ci --only=production
RUN npm install

COPY . .

CMD ["npm", "run", "dev"]
