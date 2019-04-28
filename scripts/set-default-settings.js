import UILang from './popup/ui-language';
import storage from './storage';

const links = [{ name: 'youtube', url: 'https://www.youtube.com/results?search_query=' }];

const defaultOptions = {
    dateLocale: '',
    displayShowsTitle: UILang === 'ru' ? 'ru+original' : 'original',
    episodesSortOrder: 'firstOld',
    fSizeDiff: '0',
    showsWithNewEpAtTop: true,
    externalLinks: JSON.stringify(links),
    alwaysShowNextEpisode: false,
};

export default async () => {
    const prevOptions = await storage.getOptions();
    const options = { ...defaultOptions, ...prevOptions };

    return storage.saveOptions(options);
};
