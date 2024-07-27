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

# TRAVCIBOT Features

## Village Builder

The Village Builder is an advanced automation feature designed to efficiently develop your Travian villages according to a pre-defined plan.

### Key Features:

1. **Multi-Village Support**: Can manage and develop multiple villages simultaneously.
2. **Customizable Building Plans**: Users can create detailed plans for each village, specifying which buildings to construct and to what level.
3. **Resource Field Upgrades**: Automatically upgrades resource fields (wood, clay, iron, crop) based on the plan.
4. **Town Building Construction**: Handles the construction and upgrading of various buildings within the village.
5. **Intelligent Resource Management**: Checks resource availability and can use hero resources if necessary to complete constructions.
6. **Queue Management**: Maintains two active construction queues, optimizing building efficiency.
7. **Progress Tracking**: Keeps track of the building progress and updates the plan status accordingly.
8. **Error Handling**: Robust error handling to manage unexpected situations and ensure continued operation.
9. **Human-like Behavior**: Implements delays and random actions to mimic human-like behavior and reduce detection risk.

### How It Works:

1. The bot loads the predefined plan for each village.
2. It checks the current state of constructions in the village.
3. Following the plan, it attempts to start new constructions if slots are available.
4. For each planned upgrade:
   - It navigates to the appropriate view (resources or town).
   - Checks if the upgrade is possible (resources, prerequisites).
   - Initiates the upgrade if conditions are met.
   - Updates the plan status.
5. The process repeats until the plan is completed or no further actions are possible.

## Oasis Farmer

The Oasis Farmer is a sophisticated feature designed to automate the process of raiding oases for resources.

### Key Features:

1. **Intelligent Map Exploration**: Uses a 2D grid system to efficiently explore the game map, avoiding redundant movements.
2. **Data Interception**: Captures game data in real-time by intercepting API responses, allowing for up-to-date information on oasis locations and types.
3. **Targeted Raiding**: Focuses on high-value oases (e.g., "rich" and "wood" types) to maximize resource gain.
4. **Anti-Detection Measures**: Employs human-like mouse movements and variable delays between actions to mimic natural player behavior.
5. **Customizable Parameters**: Allows users to set exploration boundaries and select troop types for raiding.
6. **Automatic Troop Management**: Keeps track of ongoing attacks to prevent over-commitment of troops.

### How It Works:

1. The bot starts by fetching already attacking oases to avoid duplicate attacks.
2. It then navigates to the game map and retrieves map information.
3. The map is zoomed out for a broader view.
4. Attacking troops are configured based on the player's tribe and selected units.
5. An exploration grid is created based on user-defined parameters.
6. The bot systematically moves across the map, exploring unexplored areas.
7. As it explores, it identifies suitable oases for attack, considering their type and value.
8. Raids are executed on chosen oases, with the bot managing troop assignments and attack timing.
9. The process continues until the exploration area is fully covered or other termination conditions are met.

### Usage:

To use these features:

1. For the Village Builder, create a building plan for each village you want to develop.
2. For the Oasis Farmer, set your desired exploration parameters and troop configurations.
3. Configure the bot with your Travian account details and the respective plans/settings.
4. Start the bot and let it automatically develop your villages and farm oases according to your specifications.

### Minimum Viable Troops for Oasis Raids

In the `executeRaid.ts` function, there's a constant called `minViableTroops` which sets the minimum number of troops sent to raid an oasis. This feature was implemented to reduce losses when sending troops to large oases that may spawn animals between the calculation of needed troops and the actual landing time.

To adjust this number:

1. Navigate to `service/utils/constants.ts`
2. Modify the value to increase or decrease the minimum number of troops sent

Increasing this value will send more troops, potentially reducing losses but using more resources. Decreasing it will send fewer troops, potentially increasing efficiency but also increasing the risk of losses.

**Note:** This project was cooked up for fun and to flex some coding muscles. It's a cool demo of what you can do with web automation, but remember, using bots might not be cool with game admins. I'am not telling you what to do, but if you decide to take it for a spin, that's on you. Don't blame me if you get your account sent to the shadow realm 😛

**P.S.** Use at least 3-4 proxies when running this bad boy. The more proxies, the merrier (and the less likely you are to get caught by big bad multihunter)! 🕵️‍♂️
