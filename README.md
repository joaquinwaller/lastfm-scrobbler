# LastFM Scrobbler

A Discord bot that allows you to scrobble songs, albums, playlists, and artists from Spotify directly to your Last.fm account.

---

## 🤖 Join the server

**Want to try the bot? Join the Discord server:**

<div align="center">

[![Join the server](https://img.shields.io/badge/Join-Server-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/X8ymgy3Dpq)

</div>


> **Note:** Replace `YOUR_CLIENT_ID` in the link above with your Discord Application ID from the Developer Portal.

---

## 🎵 Features

- **Single track scrobbling**: Scrobble a specific song from Spotify to Last.fm
- **Full album scrobbling**: Scrobble all songs from an album
- **Playlist scrobbling**: Scrobble all songs from a Spotify playlist
- **Artist scrobbling**: Scrobble random songs from an artist (where the artist is the main artist)
- **Authentication system**: Register and login with your Last.fm account
- **Real-time progress**: View scrobble progress with a progress bar

## 📋 Requirements

- Node.js 18 or higher
- MongoDB (local or remote)
- Discord account with a configured bot
- Last.fm API Key and Shared Secret
- Spotify Client ID and Client Secret

## 🚀 Installation

1. Clone the repository:
```bash
git clone https://github.com/joaquinwaller/lastfm-scrobbler.git
cd lastfm-scrobbler
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the project root with the following variables:
```env
DISCORD_TOKEN=your_discord_bot_token
DISCORD_APPLICATION_ID=your_discord_application_id
MONGODB_URI=your_mongodb_uri
LASTFM_API_KEY=your_lastfm_api_key
LASTFM_SHARED_SECRET=your_lastfm_shared_secret
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

4. Upload slash commands to Discord:
```bash
npm run upload-commands
```

5. Start the bot:
```bash
npm start
```

Or run everything in a single command:
```bash
npm run all
```

## 📝 Configuration

### Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to the "Bot" section and create a bot
4. Copy the token and add it to `.env` as `DISCORD_TOKEN`
5. Copy the Application ID (found in the "General Information" section) and add it to `.env` as `DISCORD_APPLICATION_ID`
6. Enable the following intents:
   - GUILDS
   - GUILD_MESSAGES
   - MESSAGE_CONTENT
7. Invite the bot to your server with the necessary permissions

### Last.fm API

1. Go to [Last.fm API](https://www.last.fm/api/account/create)
2. Create a new application
3. Copy the API Key and Shared Secret to your `.env` file

### Spotify API

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new application
3. Copy the Client ID and Client Secret to your `.env` file

### MongoDB

You can use MongoDB Atlas (free) or a local instance. Add the connection URI to your `.env` file.

## 🎮 Commands

### `/register`
Register your Discord account with Last.fm. It will provide you with a URL to authorize the bot.

### `/login`
Complete the registration process after authorizing on Last.fm.

### `/scrobble`
Scrobble content from Spotify to Last.fm.

**Parameters:**
- `url` (required): Spotify URL (track, album, playlist, or artist)
- `amount` (optional): Number of scrobbles to perform (maximum 3000 per day)

**Examples:**
- `/scrobble url:https://open.spotify.com/track/...` - Scrobble a song
- `/scrobble url:https://open.spotify.com/album/... amount:50` - Scrobble an album 50 times
- `/scrobble url:https://open.spotify.com/playlist/...` - Scrobble a complete playlist
- `/scrobble url:https://open.spotify.com/artist/... amount:100` - Scrobble random songs from an artist (only tracks where the artist is the main artist are scrobbled, so they count as the artist's songs on Last.fm)

### `/unregister`
Remove your registration from the bot.

## 📁 Project Structure

```
spotify-scrobbler/
├── src/
│   ├── command/
│   │   ├── internal/
│   │   │   ├── slash.command.manager.js
│   │   │   └── uploader/
│   │   │       └── slash.command.uploader.js
│   │   ├── login.command.js
│   │   ├── register.command.js
│   │   ├── scrobble.command.js
│   │   └── unregister.command.js
│   ├── index.js
│   ├── lastfm.manager.js
│   ├── spotify.manager.js
│   ├── user.manager.js
│   └── util.js
├── package.json
└── README.md
```

## 🔧 Technologies Used

- **discord.js**: Interface with Discord API
- **spotify-web-api-node**: Client for Spotify Web API
- **mongodb**: Database to store users
- **axios**: HTTP client for Last.fm API
- **crypto-js**: For Last.fm authentication signatures
- **dotenv**: Environment variable management

## ⚠️ Important Notes

- Songs shorter than 30 seconds are automatically ignored
- Last.fm has a daily limit of **3000 scrobbles per day** per account. This limit resets at **midnight UTC (00:00 UTC)**
- Last.fm has rate limiting. The bot handles these errors automatically
- Timestamps are automatically generated to simulate real plays
- Scrobbles are sent in chunks of 49 to avoid overloading the API

## 📄 License

ISC

## 👤 Author

Waller
