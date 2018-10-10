/* eslint-disable no-unused-vars */
/* global storage, app */

const rpcHandler = {
    rpcUrl: 'https://api.myshows.me/v2/rpc/',

    async getAccessToken() {
        const { accessToken } = await storage.getAuthData();
        if (!accessToken) throw new Error('Access tokens wasn\'t found');
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
        const result = await res.json();
        if (result.error) {
            throw new Error(result.error.message);
        }
        return result;
    },

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
};
