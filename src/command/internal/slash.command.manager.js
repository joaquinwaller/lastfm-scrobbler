require("dotenv").config();
const path = require("node:path");
const fs = require("node:fs");
const {Collection, MessageFlags} = require("discord.js");

module.exports = async (client, spotifyManager, lastFmManager, userManager) => {
    client.commands = new Collection();

    const commandsFolder = path.join(__dirname, '..');
    for (const file of fs.readdirSync(commandsFolder).filter((file) => file.endsWith('.js'))) {
        const filePath = path.join(commandsFolder, file);

        const command = require(filePath);
        if (!('data' in command && 'execute' in command)) {
            console.warn(`Command at ${filePath} is missing a required "data" or "execute" property.`);
            continue;
        }

        client.commands.set(command.data.name, command);
    }

    console.log(`Loaded ${client.commands.size} command(s).`);

    client.on("interactionCreate", async interaction => {
        if (!interaction.isChatInputCommand()) {
            return;
        }

        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) {
            console.error(`No command matching command '${interaction.commandName}' was found.`);
            return;
        }

        try {
            await command.execute(interaction, spotifyManager, lastFmManager, userManager);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: 'There was an error while executing this command!',
                    flags: MessageFlags.Ephemeral
                });
            } else {
                await interaction.reply({
                    content: 'There was an error while executing this command!',
                    ephemeral: true
                });
            }
        }
    });
}