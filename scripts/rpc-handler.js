/* eslint-disable no-unused-vars */

/* global storage, app */

class AuthError extends Error {
    constructor(message, needAuth = true) {
        super();
        this.name = 'AuthError';
        this.message = message;
        this.needAuth = needAuth;
    }
}

const rpcHandler = {
    rpcUrl: 'https://api.myshows.me/v2/rpc/',

    async getAccessToken() {
        const { accessToken, refreshToken, expiresIn } = await storage.getAuthData();
        if (!refreshToken) throw new AuthError('Couldn\'t get refresh token');
        if (!accessToken) {
            const { accessToken: newAccessToken } = await app.renewAccessToken(refreshToken);
            if (newAccessToken) return newAccessToken;
            throw new AuthError('Couldn\'t get access token');
        }
        if (expiresIn - Date.now() < 24 * 60 * 60 * 1000) { // update token if less than one day left
            const { accessToken: newAccessToken } = await app.renewAccessToken(refreshToken);
            if (newAccessToken) return newAccessToken;
        }

        return accessToken;
    },

    async fetchInit() {
        return {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: `Bearer ${await this.getAccessToken()}`,
            },
        };
    },

    async request(method, params = {}) {
        const res = await fetch('https://api.myshows.me/v2/rpc/', {
            ...await this.fetchInit(),
            body: JSON.stringify({
                jsonrpc: '2.0',
                method,
                params,
                id: 1,
            }),
        });
        if (res.status !== 200) throw new Error(`Couldn't connect to server. ${res.status}: ${res.statusText}`);
        const result = await res.json();
        if (result.error) {
            throw new Error(`${result.error.code}: ${result.error.message}. ${result.error.data}`);
        }
        return result;
    },


    // List of RPC methods: https://api.myshows.me/shared/doc/

    // ========== Profile Methods ==========
    async profileGet() {
        return this.request('profile.Get');
    },

    async profileFeed() {
        return this.request('profile.Feed');
    },

    async profileShows() {
        return this.request('profile.Shows');
    },

    async profileEpisodes(showId) {
        return this.request('profile.Episodes', { showId });
    },

    // ========== Shows Methods ==========
    /*  Get show's info */
    async showsGetById(showId, withEpisodes = true) {
        return this.request('shows.GetById', { showId, withEpisodes });
    },

    async showsEpisode(id) {
        return this.request('shows.Episode', { id });
    },


};
