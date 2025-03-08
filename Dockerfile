# Use an official Node.js image as the base
FROM node:19

# Set the working directory
WORKDIR /app

# Install system dependencies and clean up after
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy only the package files to leverage Docker caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port 3000 (informative only)
EXPOSE 4000

# Use the start script defined in package.json
CMD ["npm", "start"]
