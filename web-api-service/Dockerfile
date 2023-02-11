# Use an official Node runtime as the parent image

FROM node:16

# Set the working directory in the container to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY package.json /app/
COPY package-lock.json /app/

# COPY . /app
RUN npm install

COPY . /app

RUN npm run build

# default cmd when the container launches
CMD ["npm", "run", "start"]
