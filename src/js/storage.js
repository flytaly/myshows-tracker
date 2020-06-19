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

    async getLaterShows() {
        const { laterShows } = await browser.storage.local.get(['laterShows']);
        return laterShows;
    },

    async getUpcomingEpisodes() {
        const { upcomingEpisodes } = await browser.storage.local.get(['upcomingEpisodes']);
        return upcomingEpisodes;
    },

    async getRuTitles() {
        const { ruTitles } = await browser.storage.local.get(['ruTitles']);
        return ruTitles || {};
    },

    /** @param {null|string|string[]|object} [options] */
    async getOptions(options) {
        return browser.storage.sync.get(options);
    },

    async saveAuthData(data) {
        let expiresIn;
        if (data.expiresIn) {
            expiresIn = new Date().getTime() + data.expiresIn * 1000;
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

    async saveLaterShows(laterShows) {
        return browser.storage.local.set({ laterShows });
    },

    /** @param {obj} episodes - example: {showId: [{episodeInfo...}, {...}],...} */
    async saveEpisodesToWatch(episodes) {
        return browser.storage.local.set({ episodes });
    },

    /** @param {array} episodes */
    async saveUpcomingEpisodes(upcomingEpisodes) {
        return browser.storage.local.set({ upcomingEpisodes });
    },

    async saveRuTitles(ruTitles) {
        return browser.storage.local.set({ ruTitles });
    },

    /** @param {object} options */
    async saveOptions(options) {
        return browser.storage.sync.set(options);
    },

    async clear() {
        return browser.storage.local.clear();
    },
};

export default storage;
