# Ranking Bot

This bot is built for a game with at most four players, at one winner per match. By recording matches, you will be able to see player's statistics. Each player has a profile with a editable description and username.

This bot was built using the [discord.js guide](https://discordjs.guide/legacy).

## Tech Stack
* **Node.js**
* **Discord.js**
* **Sequelize** (SQLite)
* **quickchart.io**

## Features
* **Elo Rating System**: Calculates and updates player Elo ratings based on match placements (1st, 2nd, 3rd, 4th+) using a custom multiplayer formula.
* **Multiplayer Support**: Record outcomes for 2-player, 3-player, and 4+ player matches.
* **Detailed Player Stats**: Tracks current Elo, peak (best) Elo, lowest (worst) Elo, win/loss streaks, and match history.
* **Historical Data Import**: Includes backend services to manually parse and insert historical match data from raw text/Excel formats.

## Commands
* `/record-match`: Record the outcome of a match. Requires specifying the 1st place winner and allows mentioning multiple players for 2nd, 3rd, and 4th placements.
* `/record-match-undo`: Undo the last recorded match. Elo ratings and streaks are reverted.
* `/display-profile`:
* `/setbio`:
* `/setusername`:
* `/leaderboard`:
* `/record-match-undo`: