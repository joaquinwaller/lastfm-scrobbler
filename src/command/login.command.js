const {SlashCommandBuilder} = require("discord.js");
module.exports = {
    data: new SlashCommandBuilder()
        .setName("login")
        .setDescription("Logins your discord with your Last.fm account."),
    async execute(interaction, spotifyManager, lastFmManager, userManager) {
        await interaction.deferReply({
            ephemeral: true
        });

        userManager.loginUser(interaction.user.id)
            .then(user => interaction.editReply({
                content: `You have successfully logged in as ${user.name} with your Last.fm account!`,
                ephemeral: true
            })).catch(error => interaction.editReply({
            content: error.toString(),
            ephemeral: true
        }));
    }
}