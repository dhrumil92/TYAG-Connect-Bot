# Use a very lightweight version of Node.js
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install only production dependencies (saves space)
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Command to run the bot
CMD ["node", "src/telegramListener.js"]
