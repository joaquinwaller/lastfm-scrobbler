require("dotenv").config();
const md5 = require("crypto-js/md5");
const axios = require("axios");

module.exports = class LastFMManager {

    LAST_FM_API_ROUTE = "https://ws.audioscrobbler.com/2.0";
    USER_AGENT = "spotifyscrobbler/1.0.0";

    async request(params, type, signed) {
        params.set('api_key', process.env.LASTFM_API_KEY);
        params.set('format', 'json');

        if (signed) {
            if (type === 'post' && !params.has('sk')) {
                throw new Error('SessionKeyNotProvidedOnRequest')
            }

            params.set('api_sig', this.buildSignature(params))
        }

        const url = `${this.LAST_FM_API_ROUTE}/?${params.toString()}`;

        const config = {
            headers: {
                'User-Agent': this.USER_AGENT
            }
        }

        if (type === 'get') {
            return await axios.get(url, config);
        }

        if (type === 'post') {
            return await axios.post(url, null, config);
        }
    }

    async fetchLoginToken() {
        const params = new URLSearchParams()
        params.set('method', 'auth.gettoken')

        let request;
        try {
            request = await this.request(params, 'get', true);
        } catch (error) {
            if (error?.response?.data?.error === 11 || error?.response?.data?.error === 16) {
                throw new Error('LastfmServiceUnavailable')
            } else {
                throw new Error('LastfmRequestUnknownError')
            }
        }

        return request.data.token;
    }

    buildTokenURL(token) {
        return `http://www.last.fm/api/auth/?api_key=${process.env.LASTFM_API_KEY}&token=${token}`
    }

    async fetchSession(authenticatedToken) {
        const params = new URLSearchParams();
        params.set('method', 'auth.getsession');
        params.set('token', authenticatedToken);

        let request;
        try {
            request = await this.request(params, 'get', true);
        } catch (error) {
            if (error?.response?.data?.error === 14) {
                throw new Error('LastfmTokenNotAuthorized')
            }
            if (error?.response?.data?.error === 11 || error?.response?.data?.error === 16) {
                throw new Error('LastfmServiceUnavailable')
            } else {
                console.error(error)
                throw new Error('LastfmRequestUnknownError')
            }
        }

        const userName = request.data.session.name;
        const sessionKey = request.data.session.key;

        return {
            userName,
            sessionKey
        };
    }

    async scrobble(user, tracks) {
        const params = new URLSearchParams();

        params.set('method', 'track.scrobble');
        params.set('sk', user.session);

        for (const [i, track] of tracks.entries()) {
            const timestamp = track.timestamp ?? Math.floor(Date.now() / 1000);

            params.set(`track[${i}]`, track.name);
            params.set(`artist[${i}]`, track.artist);
            params.set(`timestamp[${i}]`, timestamp.toString());
            if (track.album) {
                params.set(`album[${i}]`, track.album);
            }
        }

        try {
            const response = await this.request(params, 'post', true);
            console.log("request " + JSON.stringify(response?.data?.scrobbles?.['@attr'], null, 2) + "\n");
        } catch (error) {
            console.log(
                error?.response?.data
                    ? JSON.stringify(error.response.data, null, 2)
                    : error
            );

            if (error?.response?.data?.error === 9) {
                throw new Error('LastfmInvalidSessionKey');
            } else if (error?.response?.data?.error === 29) {
                throw new Error('LastfmRateLimitExceeded');
            } else {
                throw new Error('LastfmRequestUnknownError');
            }
        }

        return tracks.length;
    }

    buildSignature(params) {
        let signatureString = '';

        params.sort();

        for (const [key, value] of params) {
            if (key !== 'format') {
                signatureString += key + (typeof value !== 'undefined' && value !== null ? value : '');
            }
        }

        signatureString += process.env.LASTFM_SHARED_SECRET;
        return md5(signatureString);
    }
}