# TRAVCIBOT API

## Initial Setup

1. Clone the repository
2. Run the `db.sql` script in your Supabase project's SQL Editor to set up the database structure
3. Update the `.env` file with your Supabase URL and API key:

## Local Development

1. Install dependencies: `npm install`
2. Set `DEV_MODE` to "true" in the `.env` file to avoid running workers and cron jobs:
3. Run the server: `npm start`

## Running Workers Locally

### Using Docker

1. Navigate to the root folder
2. Build the Docker image:

- `docker build -t travcibot .`
- `docker run -d --restart=always --name travcibot -p 8000:8000 -v /var/run/docker.sock:/var/run/docker.sock travcibot`

### Without Docker

1. Navigate to the root folder
2. Compile TypeScript:

- `npx tsx`
- `node dist/app.js`

## Note

Ensure that you have set up your Supabase project and have the necessary credentials before running the application. The `db.sql` script should be executed in your Supabase project to create the required database structure.

## Feature: Minimum Viable Troops for Oasis Raids

In the `executeRaid.ts` function, there's a constant called `minViableTroops` which sets the minimum number of troops sent to raid an oasis. This feature was implemented to reduce losses when sending troops to large oases that may spawn animals between the calculation of needed troops and the actual landing time.

To adjust this number:

1. Navigate to `service/utils/constants.ts`
2. Modify the value to increase or decrease the minimum number of troops sent

Increasing this value will send more troops, potentially reducing losses but using more resources. Decreasing it will send fewer troops, potentially increasing efficiency but also increasing the risk of losses.
