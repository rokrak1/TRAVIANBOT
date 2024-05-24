FROM node:20-slim

WORKDIR /usr/src/app

COPY package*.json ./

# Install dependencies
RUN apt-get update && apt-get install -y wget gnupg ca-certificates \
    fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 \
    libatk1.0-0 libcups2 libdbus-1-3 libgdk-pixbuf2.0-0 libnspr4 \
    libnss3 libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 xdg-utils \
    libpango-1.0-0 libcairo2 libgbm1 libxshmfence1 libglib2.0-0

RUN npm install && npm install -g typescript

COPY . .

RUN tsc

EXPOSE 8000

CMD ["node", "dist/app.js"]
