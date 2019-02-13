import UILang from '../popup/ui-language';
import storage from '../storage';

const defaultOptions = {
    dateLocale: '',
    displayShowsTitle: UILang === 'ru' ? 'ru+original' : 'original',
    episodesSortOrder: 'firstOld',
    fSizeDiff: '0',
    showsWithNewEpAtTop: true,
};

export default async () => {
    const prevOptions = await storage.getOptions();
    const options = { ...defaultOptions, ...prevOptions };
    return storage.saveOptions(options);
};
