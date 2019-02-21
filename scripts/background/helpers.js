/* eslint-disable import/prefer-default-export */

/** Convert {a:'value', b: 'value'...} a=value&b=value&... */
export const mapObjToQueryStr = params => Object.entries(params).map(pair => pair.join('=')).join('&');

/** Filter properties in given object */
export const filterShowProperties = (show) => {
    const props = ['id', 'image', 'title', 'titleOriginal'];
    return Object.keys(show)
        .filter(prop => props.includes(prop))
        .reduce((acc, prop) => {
            acc[prop] = show[prop];
            return acc;
        }, {});
};

export const composeExtensionTitle = shows => shows.reduce((acc, show) => {
    if (!show.unwatchedEpisodes) return acc;
    const prevText = acc ? `${acc}\n` : '';
    const newLine = `${show.show.titleOriginal} [${show.unwatchedEpisodes}]`;
    return `${prevText}${newLine}`;
}, '');
