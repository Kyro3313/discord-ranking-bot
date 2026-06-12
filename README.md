# Ranking Bot

This bot is built with a specific game and rating system in mind, tracking player performance across multiplayer matches using a custom Elo rating system.

## Tech Stack
* **Node.js**
* **Discord.js**
* **Sequelize** (SQLite)

## Features
* **Elo Rating System**: Calculates and updates player Elo ratings based on match placements (1st, 2nd, 3rd, 4th+) using a custom multiplayer formula.
* **Multiplayer Support**: Record outcomes for 2-player, 3-player, and 4+ player matches.
* **Detailed Player Stats**: Tracks current Elo, peak (best) Elo, lowest (worst) Elo, win/loss streaks, and granular match history.
* **Historical Data Import**: Includes backend services to manually parse and insert historical match data from raw text/Excel formats.

## Commands
* `/record-match`: Record the outcome of a match. Requires specifying the 1st place winner and allows mentioning multiple players for 2nd, 3rd, and 4th placements.