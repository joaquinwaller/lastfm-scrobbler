require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const SpotifyWebApi = require("spotify-web-api-node");
const registerCommands = require("./command/internal/slash.command.manager");
const SpotifyManager = require("./spotify.manager");
const { MongoClient, ServerApiVersion } = require("mongodb");
const UserManager = require("./user.manager");
const LastFMManager = require("./lastfm.manager");

// Configure MongoDB
const mongoClient = new MongoClient(process.env.MONGODB_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
    }
});

(async () => {
    try {
        await mongoClient.connect();
        console.log("✅ Successfully connected to MongoDB");
    } catch (error) {
        console.error("❌ Error connecting to MongoDB:", error);
    }
})();

// Initialize managers
const lastFmManager = new LastFMManager();
const userManager = new UserManager(mongoClient, lastFmManager);

const spotifyClient = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

const spotifyManager = new SpotifyManager(spotifyClient);

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Register commands
registerCommands(client, spotifyManager, lastFmManager, userManager);

// Login bot
client.login(process.env.DISCORD_TOKEN);
