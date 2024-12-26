FROM node:latest

RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    apt-transport-https \
    chromium \
    chromium-driver \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

ENV CHROME_BIN=/usr/bin/chromium

WORKDIR /app

COPY package*.json ./

RUN npm update
RUN npm install
RUN npm i -g pm2
COPY . .

EXPOSE 3000

CMD ["pm2-runtime", "src/index.js"]

# Build Image
# docker build -t captcha-solver .

# Run Docker
# docker run -d --name captcha-solver-container -p 3000:3000 -e PORT=3000 -e browserLimit=20 -e timeOut=60000 captcha-solver

# Check logs of container
# docker logs -f <container_name_or_id>

# Get list container
# docker ps #actrive
# docker ps -a #all

# Get list images
# docker images