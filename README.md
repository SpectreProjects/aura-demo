# Hilton Glasgow Mock Review Dashboard

A simple local Node.js + HTML dashboard for manually testing a Hilton Glasgow-style review pipeline.

## What it does

- Serves a static dashboard from the `public` folder.
- Shows a local welcome screen before the dashboard.
- Stores the demo entry state in `sessionStorage` for the current browser tab.
- Generates one mock review only when you click `Generate now`.
- Processes that review instantly in the browser.
- Creates a mock reply based on the star rating.
- Extracts staff names from a known local list.
- Updates review stats, manual activity, and the staff recognition leaderboard.
- Includes a local Rewards page where managers can create staff rewards and track point progress.
- Does not call OpenAI or any external API.
- Does not run an automatic review loop.

## Run locally

```bash
npm install
npm start
```

Open:

```text
http://localhost:3000
```

Click `Enter Dashboard` to open the mock dashboard. Use `Log out` in the sidebar to return to the welcome screen.

Open the rewards manager at:

```text
http://localhost:3000/rewards.html
```

To change the local port, edit `.env`:

```env
PORT=3000
```
