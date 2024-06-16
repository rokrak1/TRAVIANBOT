# TRAVCIBOT API

1. Install dependencies `npm install`
2. Set .env DEV_MODE to "true" `DEV_MODE=TRUE`, to avoid running workers and cron job
3. Run server `npm start`

## If you want to run workers locall run it with:

### Docker
1. Place yourself in root folder
2. `docker build -t travcibot .`
3. `docker run -d --restart=always --name travcibot -p 8000:8000 -v /var/run/docker.sock:/var/run/docker.sock travcibot`

### No docker
1. Place yourself in root folder
2. `npx tsx`
3. `node dist/app.js`
