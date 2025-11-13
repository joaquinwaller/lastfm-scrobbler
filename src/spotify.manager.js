module.exports = class SpotifyManager {

  constructor(spotifyClient) {
    this.spotifyClient = spotifyClient;
  }

  /*──────── track ───────*/
  async getTrack(id) {
    await this._refreshToken();
    const { body } = await this.spotifyClient.getTrack(id);
    return {
      name    : body.name,
      artist  : body.artists[0].name,
      duration: body.duration_ms,
      album   : body.album.name,
      image   : body.album.images?.[0]?.url
    };
  }

  /*──────── playlist ────*/
  async getTracksFromPlaylist(id, market = "US") {
    await this._refreshToken();
    const tracks = [];
    const limit  = 100;
    let offset   = 0;
    let total    = 0;

    do {
      const { body } =
        await this.spotifyClient.getPlaylistTracks(id, { limit, offset, market });

      for (const item of body.items) {
        const t = item.track;
        if (!t || t.duration_ms <= 30_000) continue;
        tracks.push({
          name    : t.name,
          artist  : t.artists[0]?.name,
          duration: t.duration_ms,
          album   : t.album.name,
          image   : t.album.images?.[0]?.url
        });
      }
      offset += limit;
      total   = body.total;

    } while (offset < total);

    return tracks;
  }

  /*──────── album ───────*/
  async getTracksFromAlbum(id) {
    await this._refreshToken();
    const album = await this.spotifyClient.getAlbum(id);
    const albumName = album.body.name;
    const albumImg  = album.body.images?.[0]?.url;

    const tracks = [];
    const limit  = 50;
    let offset   = 0;
    let total    = 0;

    do {
      const { body } = await this.spotifyClient.getAlbumTracks(id, { limit, offset });
      for (const t of body.items) {
        if (t.duration_ms <= 30_000) continue;
        tracks.push({
          name    : t.name,
          artist  : t.artists[0]?.name,
          duration: t.duration_ms,
          album   : albumName,
          image   : albumImg
        });
      }
      offset += limit;
      total   = body.total;
    } while (offset < total);

    return tracks;
  }

  /*──────── artist random ─*/
  async getRandomTracksFromArtist(id, market = "US") {
    await this._refreshToken();

    /* 1. Get all albums (LP, single, compilations) */
    const albums = [];
    const limitA = 50;
    let offsetA  = 0;
    let totalA   = 0;

    do {
      const { body } =
        await this.spotifyClient.getArtistAlbums(id, {
          include_groups: "album,single,compilation",
          market,
          limit: limitA,
          offset: offsetA
        });
      albums.push(...body.items);
      offsetA += limitA;
      totalA   = body.total;
    } while (offsetA < totalA);

    /* 2. Loop through albums → get tracks where main artist matches */
    const tracks = [];
    for (const alb of albums) {
      const { body } = await this.spotifyClient.getAlbumTracks(alb.id, { market });
      for (const t of body.items) {
        if (t.duration_ms <= 30_000) continue;
        if (t.artists[0]?.id !== id) continue;          // main artist must match
        tracks.push({
          name    : t.name,
          artist  : t.artists[0]?.name,
          duration: t.duration_ms,
          album   : alb.name,
          image   : alb.images?.[0]?.url
        });
      }
    }

    /* 3. Fisher-Yates shuffle */
    for (let i = tracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
    }
    return tracks;
  }

  /*──────── helper ───────*/
  async _refreshToken() {
    const d = await this.spotifyClient.clientCredentialsGrant();
    this.spotifyClient.setAccessToken(d.body.access_token);
  }
};
