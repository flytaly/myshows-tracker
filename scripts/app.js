/* eslint-disable no-unused-vars */
/* global browser, clientId, clientSecret, redirectUri, storage, rpcHandler, AuthError */

const mapObjToQueryStr = params => Object.entries(params).map(pair => pair.join('=')).join('&');

const app = {
    baseURL: 'https://myshows.me/oauth',

    get tokenURL() {
        return `${this.baseURL}/token`;
    },

    generateAuthState() {
        return (Math.random() * Number.MAX_SAFE_INTEGER).toString(36);
    },

    getAuthURL(state) {
        const params = {
            response_type: 'code',
            redirect_uri: encodeURIComponent(redirectUri),
            client_id: clientId,
            scope: 'basic',
            state,
        };
        return `${this.baseURL}/authorize?${mapObjToQueryStr(params)}`;
    },

    async getAuthCode(state) {
        const response = await browser.identity.launchWebAuthFlow({
            url: this.getAuthURL(state),
            interactive: true,
        });
        const responseURL = new URL(response);

        if (responseURL.searchParams.has('error')) {
            throw new AuthError(responseURL.searchParams.get('error'));
        }
        if (responseURL.searchParams.get('state') === state) {
            return responseURL.searchParams.get('code');
        }
        return false;
    },

    fetchAuthInit(params) {
        return {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json',
            },
            body: mapObjToQueryStr(params),
        };
    },

    async getTokens(code) {
        const params = {
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            code,
        };
        const response = await fetch(this.tokenURL, this.fetchAuthInit(params));
        if (response.status !== 200) {
            throw new AuthError(`Couldn't receive tokens. ${response.status}: ${response.statusText}`);
        }
        return response.json();
    },

    async renewAccessToken(token) {
        const params = {
            grant_type: 'refresh_token',
            refresh_token: token,
            client_id: clientId,
            client_secret: clientSecret,
            // redirect_uri: redirectUri,
        };
        const response = await fetch(this.tokenURL, this.fetchAuthInit(params));

        if (response.status !== 200) {
            throw new AuthError(`Couldn't receive refreshed tokens. ${response.status}: ${response.statusText}`);
        }
        const {
            access_token: accessToken,
            expires_in: expiresIn,
            refresh_token: refreshToken,
        } = await response.json();
        await storage.saveAuthData({ accessToken, expiresIn, refreshToken });
        return { accessToken };
    },

    async login() {
        const state = this.generateAuthState();
        const code = await this.getAuthCode(state);
        if (!code) throw new Error('Couldn\'t get auth code');
        const {
            access_token: accessToken,
            expires_in: expiresIn,
            refresh_token: refreshToken,
        } = await this.getTokens(code);
        await storage.saveAuthData({ accessToken, expiresIn, refreshToken });
        return true;
    },

    // Initiate authentication next time user click badge.
    // Returns promise that will be fulfilled only after a successful login
    setAuth() {
        browser.browserAction.setPopup({ popup: '' });
        browser.browserAction.setBadgeText({ text: '...' });
        return new Promise((resolve) => {
            const listener = async () => {
                try {
                    await this.login();
                    browser.browserAction.setPopup({ popup: browser.extension.getURL('popup/popup.html') });
                    browser.browserAction.setBadgeText({ text: '' });
                    browser.browserAction.onClicked.removeListener(listener);
                    resolve();
                } catch (e) {
                    console.error(`${e.name}: ${e.message}`);
                }
            };
            browser.browserAction.onClicked.addListener(listener);
        });
    },

    /* Return shows that are being watched and have unwatched episodes */
    leftToWatch(showRecords) {
        const watchingShows = showRecords.filter(s => s.watchStatus === 'watching');
        return watchingShows.filter(
            ({ totalEpisodes, watchedEpisodes }) => totalEpisodes !== watchedEpisodes,
        );
    },

    async episodesToWatch(showIds) {
        // TODO: rewrite using JSON BATCH https://jsonrpc.org/specification#batch
        const allEpisodes = await Promise.all(showIds.map(async (id) => {
            const { result } = await rpcHandler.showsGetById(id);
            return result.episodes;
        }));
        const watchedEpisodes = await Promise.all(showIds.map(async (id) => {
            const { result } = await rpcHandler.profileEpisodes(id);
            const episodeIds = result.map(e => e.id);
            return episodeIds;
        }));

        const unwatchedEps = showIds.reduce((acc, showId, index) => {
            acc[showId] = allEpisodes[index].filter(({ id }) => !watchedEpisodes[index].includes(id));
            return acc;
        }, {});

        return unwatchedEps;
    },

    async updateData() {
        const { result: allShows } = await rpcHandler.profileShows();
        const shows = this.leftToWatch(allShows);
        const showIds = shows.map(({ show }) => show.id);
        const unwatchedEps = await this.episodesToWatch(showIds);
        await storage.saveWatchingShows(shows.length ? shows : []);
        await storage.saveEpisodesToWatch(unwatchedEps);
    },
};
