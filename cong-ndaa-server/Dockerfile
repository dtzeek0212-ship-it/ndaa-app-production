FROM node:18-slim

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Bundle app source
COPY . .

# Expose the API port
EXPOSE 3001

# Run the web service on container startup
CMD [ "node", "server.js" ]
