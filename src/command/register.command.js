const {SlashCommandBuilder} = require("discord.js");
module.exports = {
    data: new SlashCommandBuilder()
        .setName("register")
        .setDescription("Registers your discord with your Last.fm account."),
    async execute(interaction, spotifyManager, lastFmManager, userManager) {
        await interaction.deferReply({
            ephemeral: true
        });

        userManager.registerUser(interaction.user.id)
            .then(user => interaction.editReply({
                content: `You have started your registration process, go to the following URL ${lastFmManager.buildTokenURL(user.token)} and follow the steps on your browser. When you done with that, use /login.`,
                ephemeral: true
            })).catch(error => interaction.editReply({
            content: error.toString(),
            ephemeral: true
        }));
    }
}