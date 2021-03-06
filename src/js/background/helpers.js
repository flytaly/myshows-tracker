import state from './state.js';

/** Convert {a:'value', b: 'value'...} a=value&b=value&... */
export const mapObjToQueryStr = (params) =>
    Object.entries(params)
        .map((pair) => pair.join('='))
        .join('&');

/** Filter properties in given object */
export const filterShowProperties = (show) => {
    const props = ['id', 'image', 'title', 'titleOriginal'];
    return Object.keys(show)
        .filter((prop) => props.includes(prop))
        .reduce((acc, prop) => {
            acc[prop] = show[prop];
            return acc;
        }, {});
};

export const composeExtensionTitle = (shows) =>
    shows.reduce((acc, show) => {
        if (!show.unwatchedEpisodes) return acc;
        const { nextEpisode = {} } = show;
        const prevText = acc ? `${acc}\n` : '';
        const newLine = `${show.show.titleOriginal} [${show.unwatchedEpisodes}] - ${nextEpisode.shortName}`;
        return `${prevText}${newLine}`;
    }, '');

export const countEpisodes = (watchingShows) =>
    watchingShows.reduce((acc, { unwatchedEpisodes }) => acc + unwatchedEpisodes, 0);

export const setBadgeAndTitle = (watchingShows = []) => {
    state.extensionTitle = composeExtensionTitle(watchingShows);
    state.totalEpisodes = countEpisodes(watchingShows);
};
