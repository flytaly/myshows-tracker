/* eslint-disable no-unused-vars */
/* global browser */

const storage = {
    async getAuthData() {
        return browser.storage.local.get(['accessToken', 'expiresIn', 'refreshToken']);
    },

    async getEpisodes() {
        const { episodes } = await browser.storage.local.get(['episodes']);
        return episodes;
    },

    async getProfile() {
        const { login } = await browser.storage.local.get(['login']);
        return login;
    },

    async getWatchingShows() {
        const { shows } = await browser.storage.local.get(['shows']);
        return shows;
    },

    async saveAuthData(data) {
        let expiresIn;
        if (data.expiresIn) {
            expiresIn = (new Date()).getTime() + data.expiresIn * 1000;
        }
        return browser.storage.local.set({ ...data, expiresIn });
    },

    async saveProfile(user) {
        const { login } = user;
        return browser.storage.local.set({ login });
    },

    async saveWatchingShows(shows) {
        return browser.storage.local.set({ shows });
    },

    /** @param {obj} episodes - example: {showId: [{episodeInfo...}, {...}],...} */
    async saveEpisodesToWatch(episodes) {
        return browser.storage.local.set({ episodes });
    },

    /** @param {array} episodes */
    async saveUpcomingEpisodes(upcomingEpisodes) {
        return browser.storage.local.set({ upcomingEpisodes });
    },

    async clear() {
        return browser.storage.local.clear();
    },
};
