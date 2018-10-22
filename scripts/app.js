/* eslint-disable no-unused-vars */
/* global browser, clientId, clientSecret, redirectUri, storage, rpcHandler, AuthError, state */

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
        await this.getProfileData();
        return true;
    },

    async getProfileData() {
        const { result: { user } } = await rpcHandler.profileGet();
        await storage.saveProfile(user);
    },

    // Initiate authentication next time user click badge.
    // Returns promise that will be fulfilled only after a successful login
    setAuth() {
        browser.browserAction.setPopup({ popup: '' });
        browser.browserAction.setBadgeBackgroundColor({ color: 'red' });
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
    async fetchEpisodes(showIds) {
        let shows = await rpcHandler.showsGetById(showIds);
        shows = shows.map(({ result }) => result);

        const profileEps = await rpcHandler.profileEpisodes(showIds);

        /** Normalize array of responses by id */
        const watchedEps = profileEps.reduce((acc, { id, result }) => ({ ...acc, [id]: result }), {});

        const unwatchedEps = shows.reduce((acc, show) => {
            const { episodes, id: showId } = show;

            acc[showId] = episodes.filter(({ id, episodeNumber }) => {
                if (!watchedEps[showId]) return true;
                // TODO: add option to not ignore special episodes with 0 episodeNumber
                return !watchedEps[showId].some(ep => ep.id === id) && episodeNumber !== 0;
            });

            return acc;
        }, {});

        return unwatchedEps;
    },

    /** Returns episodes that was already aired */
    pastEpisodes(episodes, time = new Date()) {
        return Object.keys(episodes).reduce((acc, showId) => ({
            ...acc,
            [showId]: episodes[showId].filter(({ airDateUTC }) => Date.parse(airDateUTC) <= time),
        }), {});
    },

    /** Returns array of future episodes in time order */
    futureEpisodes(episodes, time = new Date()) {
        let result = Object.keys(episodes).reduce((acc, showId) => {
            acc.push(...episodes[showId].filter(({ airDateUTC }) => Date.parse(airDateUTC) > time));
            return acc;
        }, []);
        result = result.sort(({ airDateUTC: a }, { airDateUTC: b }) => Date.parse(a) - Date.parse(b));
        return result;
    },

    async updateData() {
        const { result: allShows } = await rpcHandler.profileShows();
        let watchingShows = allShows.filter(({ watchStatus }) => watchStatus === 'watching');
        const showIds = watchingShows.map(({ show }) => show.id);

        const unwatchedEps = await this.fetchEpisodes(showIds);

        const time = new Date();
        const pastEps = this.pastEpisodes(unwatchedEps, time);
        const futureEps = this.futureEpisodes(unwatchedEps, time);

        // count how many aired episodes left to watch
        watchingShows = watchingShows.map(entry => ({ ...entry, unwatchedEpisodes: pastEps[entry.show.id].length }));

        state.totalEpisodes = watchingShows.reduce((acc, { unwatchedEpisodes }) => acc + unwatchedEpisodes, 0);

        await Promise.all([
            storage.saveWatchingShows(watchingShows),
            storage.saveEpisodesToWatch(pastEps),
            storage.saveUpcomingEpisodes(futureEps),
        ]);
    },

    async rateEpisode(episodeId, rating, showId) {
        try {
            await rpcHandler.manageRateEpisode(episodeId, rating);

            state.episodeWasRated = episodeId;

            // Delete episode from storage and re-count number of episodes left to watch
            let [shows, episodes] = await Promise.all([
                storage.getWatchingShows(),
                storage.getEpisodes(),
            ]);

            if (!episodes[showId].some(ep => ep.id === episodeId)) return; // already deleted from storage

            episodes = { ...episodes, [showId]: episodes[showId].filter(e => e.id !== episodeId) };
            shows = shows.map(
                show => (show.show.id === showId ? ({ ...show, unwatchedEpisodes: show.unwatchedEpisodes - 1 }) : show),
            );
            state.totalEpisodes -= 1;
            await Promise.all([
                storage.saveEpisodesToWatch(episodes),
                storage.saveWatchingShows(shows)]);
        } catch (e) {
            console.error(`Error occured during episode rating. ${e.name}: ${e.message}`);
        }
    },
};
