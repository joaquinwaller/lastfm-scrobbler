const {SlashCommandBuilder} = require("discord.js");
module.exports = {
    data: new SlashCommandBuilder()
        .setName("unregister")
        .setDescription("Removes your session of Last.fm from your current discord profile."),
    async execute(interaction, spotifyManager, lastFmManager, userManager) {
        await interaction.deferReply({
            ephemeral: true
        });

        userManager.unregister(interaction.user.id)
            .then(user => interaction.editReply({
                content: `You have successfully unregistered your current discord profile with your Last.fm account ${user.name}!`,
                ephemeral: true
            })).catch(error => interaction.editReply({
            content: error.toString(),
            ephemeral: true
        }));
    }
}