/* eslint-disable no-unused-vars */
/* global browser, clientId, clientSecret, redirectUri, storage, rpcHandler */

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
        let responseURL;
        try {
            const response = await browser.identity.launchWebAuthFlow({
                url: this.getAuthURL(state),
                interactive: true,
            });
            responseURL = new URL(response);
        } catch (e) {
            console.error(e);
            return false;
        }
        if (responseURL.searchParams.has('error')) {
            console.error(responseURL.searchParams.get('error'));
            return false;
        }
        if (responseURL.searchParams.get('state') === state) {
            return responseURL.searchParams.get('code');
        }
        return false;
    },

    async getTokens(code) {
        const params = {
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            code,
        };
        try {
            const response = await fetch(this.tokenURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Accept: 'application/json',
                },
                body: mapObjToQueryStr(params),
            });
            if (response.status !== 200) {
                throw response;
            }
            return await response.json();
        } catch (e) {
            console.error(e);
        }
        return false;
    },

    async login() {
        const state = this.generateAuthState();
        const code = await this.getAuthCode(state);
        if (!code) return false;
        try {
            const {
                access_token: accessToken,
                expires_in: expiresIn,
                refresh_token: refreshToken,
            } = await this.getTokens(code);
            await storage.saveAuthData({ accessToken, expiresIn, refreshToken });
            return true;
        } catch (e) {
            console.error(e);
        }
        return false;
    },

    // initiate authentication next time user click badge
    setAuth() {
        browser.browserAction.setPopup({ popup: '' });
        browser.browserAction.setBadgeText({ text: '...' });
        browser.browserAction.onClicked.addListener(async () => {
            if (await this.login()) {
                browser.browserAction.setPopup({ popup: browser.extension.getURL('popup/popup.html') });
                browser.browserAction.setBadgeText({ text: '' });
            }
        });
    },

    /* Return shows that are being watched and have unwatched episodes */
    leftToWatch(showRecords) {
        const watchingShows = showRecords.filter(s => s.watchStatus === 'watching');
        return watchingShows.filter(
            ({ totalEpisodes, watchedEpisodes }) => totalEpisodes !== watchedEpisodes,
        );
    },

    async updateData() {
        const { result } = await rpcHandler.profileShows();
        const shows = this.leftToWatch(result);
        await storage.saveWatchingShows(shows.length ? shows : []);
        return true;
    },
};
