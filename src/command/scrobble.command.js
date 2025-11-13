require("dotenv").config();
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { chunkArray, delay, fakeTimestamps } = require("../util");

/*──────── helpers ────────*/
function parseSpotifyUrl(raw) {
  try {
    const { pathname } = new URL(raw);
    const clean = pathname.replace(/^\/intl-\w+\//, '/');
    const parts = clean.split("/").filter(Boolean);
    const type  = parts.find(p =>
      ["track", "album", "playlist", "artist"].includes(p));
    const id    = parts[parts.indexOf(type) + 1]?.split("?")[0];
    return type && id ? { type, id } : null;
  } catch { return null; }
}

function bar(cur, tot, size = 20) {
  const filled = Math.round((cur / tot) * size);
  const pct    = Math.floor((cur / tot) * 100);
  return `${"▰".repeat(filled)}${"▱".repeat(size - filled)} ${pct}%`;
}

/*──────── slash command ────────*/
module.exports = {
  data: new SlashCommandBuilder()
    .setName("scrobble")
    .setDescription("Scrobble a track, album, playlist or artist (random) from Spotify to Last.fm")
    .addStringOption(o =>
      o.setName("url").setDescription("Spotify URL").setRequired(true))
    .addNumberOption(o =>
      o.setName("amount").setDescription("Number of scrobbles (max 3000)").setMinValue(1).setMaxValue(3000)),

  async execute(interaction, spotifyManager, lastFmManager, userManager) {
    const url    = interaction.options.getString("url", true);
    const amount = interaction.options.getNumber("amount", false);
    const parsed = parseSpotifyUrl(url);

    if (!parsed)
      return interaction.reply({ content: "❌ Invalid Spotify URL.", ephemeral: true });

    await interaction.deferReply({ ephemeral: true });

    try {
      const user = await userManager.getUser(interaction.user.id);
      let uniqueSet, tracks;

      /*──────── Get tracks by type ────────*/
      if (parsed.type === "track") {
        const t = await spotifyManager.getTrack(parsed.id);
        uniqueSet = [t];
        tracks = fakeTimestamps(
          amount && amount > 1 ? Array.from({ length: amount }, () => ({ ...t })) : [{ ...t }]
        );

      } else if (parsed.type === "album") {
        uniqueSet = await spotifyManager.getTracksFromAlbum(parsed.id);
        tracks = fakeTimestamps(
          amount && amount > uniqueSet.length
            ? Array.from({ length: amount }, (_, i) => ({ ...uniqueSet[i % uniqueSet.length] }))
            : uniqueSet.map(t => ({ ...t }))
        );

      } else if (parsed.type === "playlist") {
        uniqueSet = await spotifyManager.getTracksFromPlaylist(parsed.id, "US");
        tracks = fakeTimestamps(
          amount && amount > uniqueSet.length
            ? Array.from({ length: amount }, (_, i) => ({ ...uniqueSet[i % uniqueSet.length] }))
            : uniqueSet.map(t => ({ ...t }))
        );

      } else {                            // artist → random tracks where main artist matches
        uniqueSet = await spotifyManager.getRandomTracksFromArtist(parsed.id, "US");
        tracks = fakeTimestamps(
          amount && amount > uniqueSet.length
            ? Array.from({ length: amount }, (_, i) => ({ ...uniqueSet[i % uniqueSet.length] }))
            : uniqueSet.map(t => ({ ...t }))
        );
      }

      if (!uniqueSet.length)
        return interaction.editReply({ content: "No valid songs 🤷‍♂️", embeds: [] });

      await interaction.editReply({ content: "Scrobbling…" });

      /*──────── Scrobble loop ────────*/
      let sent = 0, errs = new Set(), show = 0;

      for (const chunk of chunkArray(tracks)) {
        try { sent += await lastFmManager.scrobble(user, chunk); }
        catch (e) {
          errs.add(e?.message);
          if (["LastfmRateLimitExceeded","LastfmInvalidSessionKey"].includes(e?.message)) break;
        }

        const t = uniqueSet[show];
        show = (show + 1) % uniqueSet.length;

        await interaction.editReply({
          content: "Scrobbling…",
          embeds: [
            new EmbedBuilder()
              .setColor(0x1DB954)
              .setTitle(`${t.artist} – ${t.name}`)
              .setThumbnail(t.image ?? null)
              .setFooter({ text: bar(sent, tracks.length) })
          ]
        });

        await delay(250);
      }

      /*──────── Final summary ────────*/
      let summary = `✅ Scrobble completed (${sent}/${tracks.length})`;
      if (errs.size) summary += `\n⚠️ Errors:\n- ${[...errs].join("\n- ")}`;
      await interaction.editReply({ content: summary, embeds: [] });

    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: `❌ Error: ${err.message}`, embeds: [] });
    }
  }
};
