/* eslint-disable no-unused-vars */
/* global browser */

const storage = {
    async getAuthData() {
        return browser.storage.local.get(['accessToken', 'expiresIn', 'refreshToken']);
    },

    async getWatchingShows() {
        const { watchingShows } = await browser.storage.local.get(['watchingShows']);
        return watchingShows;
    },

    async getEpisodes() {
        const { episodes } = await browser.storage.local.get(['episodes']);
        return episodes;
    },

    async saveAuthData(data) {
        let expiresIn;
        if (data.expiresIn) {
            expiresIn = (new Date()).getTime() + data.expiresIn * 1000;
        }
        return browser.storage.local.set({ ...data, expiresIn });
    },

    async saveWatchingShows(watchingShows) {
        return browser.storage.local.set({ watchingShows });
    },

    /* {obj} episodes - example: {showId: [{episodeInfo...}, {...}],...} */
    async saveEpisodesToWatch(episodes) {
        return browser.storage.local.set({ episodes });
    },
};
