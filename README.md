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

## Feature: Oasis Farmer

### Minimum Viable Troops for Oasis Raids

In the `executeRaid.ts` function, there's a constant called `minViableTroops` which sets the minimum number of troops sent to raid an oasis. This feature was implemented to reduce losses when sending troops to large oases that may spawn animals between the calculation of needed troops and the actual landing time.

To adjust this number:

1. Navigate to `service/utils/constants.ts`
2. Modify the value to increase or decrease the minimum number of troops sent

Increasing this value will send more troops, potentially reducing losses but using more resources. Decreasing it will send fewer troops, potentially increasing efficiency but also increasing the risk of losses.

## How it works

### Map Exploration and Data Fetching

The Oasis Farmer uses a sophisticated system to explore the map and gather data about oases:

### 2D Matrix Exploration

1. A 2D matrix (grid) is created to represent the unexplored map area.
2. The size of this grid is determined by user-defined parameters: maxTop, maxBottom, maxLeft, and maxRight.
3. Each cell in the grid is initially marked with "?" to represent unexplored areas.
4. The starting position is set at the center of this grid.

### Map Movement

1. The system moves across the map by updating the current position in the grid.
2. It uses a path-finding algorithm to determine the most efficient route to the nearest unexplored cell.
3. As areas are explored, their corresponding cells in the grid are marked with "x".
4. The map movement is simulated using human-like mouse movements to avoid detection.

### Data Fetching

1. As the map moves, the system intercepts XHR requests to the game's API.
2. Specifically, it captures responses from the "api/v1/map/position" endpoint.
3. The intercepted data contains information about the tiles in the current view, including oasis details.
4. This data is processed to extract information about new, unexplored oases.
5. The system filters for "rich" and "wood" oases, which are typically the most valuable for farming.
6. New oases that meet the criteria are added to a list for potential attacks.

This exploration and data fetching process allows the Oasis Farmer to efficiently discover and target the most valuable oases while maintaining a human-like interaction pattern with the game interface.
