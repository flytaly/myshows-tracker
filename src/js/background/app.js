/* eslint-disable no-underscore-dangle */
import browser from 'webextension-polyfill';
import storage from '../storage.js';
import types from '../types.js';
import state from './state.js';
import { clientId, clientSecret } from '../constants.js';
import { AuthError } from './errors.js';
import rpcHandler from './rpc-handler.js'; // eslint-disable-line import/no-cycle
import { mapObjToQueryStr, filterShowProperties, setBadgeAndTitle } from './helpers.js';

const app = {
    baseURL: 'https://myshows.me/oauth',

    get tokenURL() {
        return `${this.baseURL}/token`;
    },

    generateAuthState() {
        return (Math.random() * Number.MAX_SAFE_INTEGER).toString(36);
    },

    /* getAuthURL(authState) {
        const params = {
            response_type: 'code',
            redirect_uri: encodeURIComponent(redirectUri),
            client_id: clientId,
            scope: 'basic',
            state: authState,
        };
        return `${this.baseURL}/authorize?${mapObjToQueryStr(params)}`;
    }, */

    /*     async getAuthCode(authState) {
        const response = await browser.identity.launchWebAuthFlow({
            url: this.getAuthURL(authState),
            interactive: true,
        });
        const responseURL = new URL(response);

        if (responseURL.searchParams.has('error')) {
            throw new AuthError(responseURL.searchParams.get('error'));
        }
        if (responseURL.searchParams.get('state') === authState) {
            return responseURL.searchParams.get('code');
        }
        return false;
    }, */

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

    /* async getTokens(code) {
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
    }, */

    async getTokens(username, password) {
        // Resource Owner Password Credentials Grant example
        // curl "https://myshows.me/oauth/token" -d "grant_type=password&client_id=&client_secret=&username=&password="

        // prettier-ignore
        const getParamsString = () => 'grant_type=password'
        + `&client_id=${clientId}`
        + `&client_secret=${clientSecret}`
        + `&username=${username}`
        + `&password=${password}`;

        const response = await fetch('https://myshows.me/oauth/token', {
            method: 'POST',
            headers: {
                Accept: 'application/json; charset=utf-8',
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            },
            body: getParamsString(username, password),
        });

        const responseData = await response.json();
        if (responseData.error) {
            console.error(responseData);
            throw new Error(responseData.error_description);
        }

        return responseData;
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
        const { access_token: accessToken, expires_in: expiresIn, refresh_token: refreshToken } = await response.json();
        await storage.saveAuthData({ accessToken, expiresIn, refreshToken });
        return { accessToken };
    },

    async login(username, password) {
        // const authState = this.generateAuthState();
        // const code = await this.getAuthCode(authState);
        // if (!code) throw new Error('Couldn\'t get auth code');

        state.loginStarted = true;
        const {
            access_token: accessToken,
            expires_in: expiresIn,
            refresh_token: refreshToken,
        } = await this.getTokens(username, password);
        await storage.saveAuthData({ accessToken, expiresIn, refreshToken });
        await this.getProfileData();
        state.loginStarted = false;
        return true;
    },

    async getProfileData() {
        const {
            result: { user },
        } = await rpcHandler.profileGet();
        await storage.saveProfile(user);
    },

    /* Return object with unwatched episodes grouped by show id */
    async fetchEpisodes(showIds, shows) {
        const profileEps = await rpcHandler.profileEpisodes(showIds);

        /** Normalize array of responses by id */
        const watchedEps = profileEps.reduce((acc, { id, result }) => ({ ...acc, [id]: result }), {});

        return shows.reduce((acc, show) => {
            const { episodes, id: showId } = show;
            if (!episodes || !episodes.length) {
                // There can be some (upcoming mostly) shows that don't have episodes yet
                acc[showId] = [];
            } else {
                acc[showId] = episodes.filter(({ id, episodeNumber }) => {
                    if (!watchedEps[showId]) return true;
                    // TODO: add option to not ignore special episodes with 0 episodeNumber
                    return !watchedEps[showId].some((ep) => ep.id === id) && episodeNumber !== 0;
                });
            }
            return acc;
        }, {});
    },

    /** Returns episodes that was already aired */
    pastEpisodes(episodes, time = new Date()) {
        // In some rare cases airDateUTC could be empty
        return Object.keys(episodes).reduce(
            (acc, showId) => ({
                ...acc,
                [showId]: episodes[showId].filter(
                    ({ airDateUTC, airDate }) => Date.parse(airDateUTC || airDate) <= time,
                ),
            }),
            {},
        );
    },

    /** Returns array of future episodes in time order */
    futureEpisodes(episodes, time = new Date()) {
        let result = Object.keys(episodes).reduce((acc, showId) => {
            acc.push(
                ...episodes[showId]
                    .filter(({ airDateUTC, airDate }) => Date.parse(airDateUTC || airDate) > time)
                    /*
                  Sort episodes by number, so they have correct order in the calendar
                  if they have the same air time (like episodes on Netflix)
                */
                    .sort((a, b) => a.episodeNumber - b.episodeNumber),
            );

            return acc;
        }, []);
        result = result.sort(
            (
                { airDateUTC: a, airDate: a2 }, //
                { airDateUTC: b, airDate: b2 },
            ) => Date.parse(a || a2) - Date.parse(b || b2),
        );
        return result;
    },

    async updateData() {
        const { result: allShows } = await rpcHandler.profileShows();
        let watchingShows = allShows.filter(({ watchStatus }) => watchStatus === 'watching');
        let laterShows = allShows.filter(({ watchStatus }) => watchStatus === 'later');
        const showIds = watchingShows.map(({ show }) => show.id);
        const laterShowIds = laterShows.map(({ show }) => show.id);

        let shows = await rpcHandler.showsGetById(showIds);
        let laterShowsData = await rpcHandler.showsGetById(laterShowIds, false); // without episodes

        shows = shows.map(({ result }) => result);
        laterShowsData = laterShowsData.map(({ result }) => result);

        const unwatchedEps = await this.fetchEpisodes(showIds, shows);

        // const time = new Date(Date.now() - 1000 * 60 * 60 * 24 * 300); // for debug
        const time = new Date();
        const pastEps = this.pastEpisodes(unwatchedEps, time);
        const futureEps = this.futureEpisodes(unwatchedEps, time);

        watchingShows = watchingShows.map((entry) => {
            const len = pastEps[entry.show.id].length;
            return {
                ...entry,
                unwatchedEpisodes: len,
                latestEpisode: len && pastEps[entry.show.id][0],
                nextEpisode: len && pastEps[entry.show.id][len - 1],
                show: filterShowProperties(shows.find(({ id }) => entry.show.id === id)),
            };
        });

        laterShows = laterShows.map((entry) => ({
            ...entry,
            show: filterShowProperties(laterShowsData.find(({ id }) => entry.show.id === id)),
        }));

        setBadgeAndTitle(watchingShows);

        await Promise.all([
            storage.saveWatchingShows(watchingShows),
            storage.saveEpisodesToWatch(pastEps),
            storage.saveUpcomingEpisodes(futureEps),
            storage.saveLaterShows(laterShows),
        ]);

        while (this.rateEpisodesAgain.length) {
            const { episodeId, rating, showId } = this.rateEpisodesAgain.pop();
            // eslint-disable-next-line no-await-in-loop
            await this.rateEpisode(episodeId, rating, showId, false); /* eslint-disable-line no-await-in-loop */
        }
    },

    rateEpisodesAgain: [],

    /** Rate episode with given rating. In case of error this function will be called again
     * after next successful update. Arguments will be saved in *rateEpisodesAgain* array.
     * */
    async rateEpisode(episodeId, rating, showId, retryIfError = true) {
        state.updating = true;
        try {
            await rpcHandler.manageRateEpisode(episodeId, rating);

            state.episodeWasRated = episodeId;

            // Delete episode from storage and re-count number of episodes left to watch
            let [shows, episodes] = await Promise.all([storage.getWatchingShows(), storage.getEpisodes()]);

            if (!episodes[showId].some((ep) => ep.id === episodeId)) return; // already deleted from storage

            episodes = {
                ...episodes,
                [showId]: episodes[showId].filter((e) => e.id !== episodeId),
            };
            shows = shows.map((show) => {
                const len = episodes[showId].length;
                return show.show.id === showId
                    ? {
                          ...show,
                          unwatchedEpisodes: show.unwatchedEpisodes - 1,
                          latestEpisode: len && episodes[showId][0],
                          nextEpisode: len && episodes[showId][len - 1],
                      }
                    : show;
            });
            await Promise.all([storage.saveEpisodesToWatch(episodes), storage.saveWatchingShows(shows)]);
            setBadgeAndTitle(shows);
        } catch (e) {
            console.error(`Error occurred during episode rating. ${e.name}: ${e.message}`);
            if (retryIfError) this.rateEpisodesAgain.push({ episodeId, rating, showId });
            browser.alarms.create(types.ALARM_UPDATE, { delayInMinutes: 0.1 });
        }
        state.updating = false;
    },
};

export default app;
