# Use the official Node.js LTS version as the base image
FROM node:18

# Set up a working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy project files to the working directory
COPY . .

# Set environment variables
ENV PORT=3002
ENV NODE_ENV=production

# Expose the port on which the application is running
EXPOSE 3002

# Define the commands that run when the container starts
CMD [ "node", "app.js" ]


