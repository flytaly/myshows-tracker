import storage from './storage';
import app from './app';

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

    async request(body, withAuth) {
        // const UILang = browser.i18n.getUILanguage();
        // const { displayShowsTitle: t } = await storage.getOptions();
        // const lang = ((UILang === 'ru' && !t) || t === 'ru' || t === 'ru+original') ? 'ru' : 'en';
        const lang = 'ru'; // always request russian title, response will contain original titles too

        const res = await fetch('https://api.myshows.me/v2/rpc/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'Accept-Language': lang,
                ...(withAuth && { Authorization: `Bearer ${await this.getAccessToken()}` }),
            },
            body: JSON.stringify(body),
        });
        if (res.status !== 200) throw new Error(`Couldn't connect to server. ${res.status}: ${res.statusText}`);
        const result = await res.json();
        if (result.error) {
            if (result.error.code === 401) {
                throw new AuthError(`${result.error.code}: ${result.error.message}. ${result.error.data}`);
            } else {
                throw new Error(`${result.error.code}: ${result.error.message}. ${result.error.data}`);
            }
        }
        return result;
    },

    async singleRequest(method, params = {}, withAuth = false) {
        return this.request({
            jsonrpc: '2.0',
            method,
            params,
            id: 1,
        }, withAuth);
    },

    /* Combines requests in batches by N requests per batch https://jsonrpc.org/specification#batch
    *  Returns array of successful results */
    async batchRequest(reqObjects = [], withAuth = false, N = 10) {
        const results = [];
        const body = reqObjects.map(({ method, params, id }, idx) => ({
            jsonrpc: '2.0',
            method,
            params,
            id: id !== undefined ? id : idx,
        }));

        // Intentionally sending requests sequentially (not concurrently with Promise.All)
        // to prevent triggering server's DDOS protection if the batch contains too many requests
        for (let i = 0; i < body.length; i += N) {
            results.push(...await this.request(body.slice(i, i + N), withAuth)); // eslint-disable-line no-await-in-loop
        }

        return results.filter(({ error, id }) => {
            if (!error) return true;
            console.error(`Batch contains failed request ${id}. Error: ${error.code}: ${error.message}. ${error.data}`);
            return false;
        });
    },

    // List of RPC methods: https://api.myshows.me/shared/doc/

    // ========== Profile Methods ==========
    async profileGet() {
        return this.singleRequest('profile.Get', {}, true);
    },

    async profileFeed() {
        return this.singleRequest('profile.Feed', {}, true);
    },

    async profileShows() {
        return this.singleRequest('profile.Shows', {}, true);
    },

    /**
     * Return user information about episodes to given show.
     * @param {array} showIds */
    async profileEpisodes(showIds) {
        return this.batchRequest(showIds.map(showId => ({
            method: 'profile.Episodes',
            params: { showId },
            id: showId,
        })), true);
    },

    // ========== Shows Methods ==========
    /**
     * Return information about shows.
     * @param {array} showIds */
    async showsGetById(showIds, withEpisodes = true) {
        return this.batchRequest(showIds.map(showId => ({
            method: 'shows.GetById',
            params: { showId, withEpisodes },
            id: showId,
        })));
    },

    async showsEpisode(id) {
        return this.singleRequest('shows.Episode', { id });
    },

    // ========== Manage Methods ==========

    async manageCheckEpisode(episodeId) {
        return this.singleRequest('manage.CheckEpisode', { id: episodeId }, true);
    },

    async manageUnCheckEpisode(episodeId) {
        return this.singleRequest('manage.UnCheckEpisode', { id: episodeId }, true);
    },

    async manageRateEpisode(episodeId, rating = 0) {
        return this.singleRequest('manage.RateEpisode', { id: episodeId, rating }, true);
    },

};

export {
    rpcHandler,
    AuthError,
};
