require("dotenv").config();
const path = require("node:path");
const fs = require("node:fs");
const { REST, Routes } = require("discord.js");

(async () => {
    const commands = [];

    const commandsFolder = path.join(__dirname, '..', '..');
    for (const file of fs.readdirSync(commandsFolder).filter((file) => file.endsWith('.js'))) {
        const filePath = path.join(commandsFolder, file);

        const command = require(filePath);
        if (!('data' in command && 'execute' in command)) {
            console.warn(`Command at ${filePath} is missing a required "data" or "execute" property.`);
            continue;
        }

        commands.push(command.data.toJSON());
    }

    const rest = new REST().setToken(process.env.DISCORD_TOKEN);

    try {
        console.log(`Refreshing ${commands.length} global application commands.`);

        await rest.put(
            Routes.applicationCommands(process.env.DISCORD_APPLICATION_ID),
            { body: commands }
        );

        console.log("Successfully registered global commands.");
    } catch (error) {
        console.error("Error registering commands:", error);
    }
})();
