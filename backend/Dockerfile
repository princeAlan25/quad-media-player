FROM node:20-alpine

WORKDIR /app

<<<<<<< HEAD
# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose backend port
EXPOSE 7000

# Run in dev mode by default (consistent with frontend setup)
CMD ["npm", "run", "dev"]
=======
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 7000

CMD ["npm", "start"]
>>>>>>> origin/react-deploy
