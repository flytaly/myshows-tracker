import storage from '../storage';
import { translateElement } from '../l10n'; // translate option page

const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);
const UILang = browser.i18n.getUILanguage();

function debounce(func, wait) {
    let waiting = false;
    let tmId;
    return (...args) => {
        if (waiting) clearTimeout(tmId);
        waiting = true;
        tmId = setTimeout(() => {
            func(...args);
            waiting = false;
        }, wait);
    };
}
function isValidUrl(string) {
    try {
        new URL(string); // eslint-disable-line no-new
        return true;
    } catch (e) {
        return false;
    }
}

async function saveExternalLinks(fieldset) {
    const rows = Array.from(fieldset.getElementsByTagName('li'));
    const data = rows
        .map((row) => {
            const inputs = Array.from(row.getElementsByTagName('input'));
            return inputs
                .reduce((acc, currentInput) => {
                    const { name, value } = currentInput;
                    if (name !== 'name' && name !== 'url') return acc;
                    return { ...acc, [name]: value };
                }, {});
        })
        .filter(({ url }) => isValidUrl(url));

    await storage.saveOptions({ externalLinks: JSON.stringify(data) });
}


function setCurrentFontSize(fSizeDiff) {
    if (fSizeDiff) {
        const elem = $(`.font-size[data-f-size-diff="${fSizeDiff}"]`);
        const prev = $('.font-size.default');
        if (elem) {
            prev.classList.remove('default');
            elem.classList.add('default');
        }
    }
}

function getExternalSearchTmp() {
    const tmp = $('#external-link-tmp');
    translateElement(tmp.content);
    return tmp.content;
}

function createUrlField(template, { name = '', url = '' } = {}) {
    const addSearchElem = template.cloneNode(true);
    const nameElem = addSearchElem.querySelector('input.name');
    const urlElem = addSearchElem.querySelector('input.url');
    const deleteElem = addSearchElem.querySelector('button.delete');
    nameElem.value = name;
    urlElem.value = url;
    deleteElem.addEventListener('click', ({ target }) => {
        const fieldset = target.parentNode.parentNode;
        fieldset.removeChild(target.parentNode);
        saveExternalLinks(fieldset);
    });
    return addSearchElem;
}

const restoreData = async () => {
    const {
        fSizeDiff, dateLocale, episodesSortOrder, displayShowsTitle, showsWithNewEpAtTop,
        externalLinks, alwaysShowNextEpisode,
    } = await storage.getOptions();

    setCurrentFontSize(fSizeDiff);

    const d = new Date();
    if (['ru', 'en-GB', 'en-US'].includes(dateLocale)) {
        $('#date-format').value = dateLocale;
    } else {
        $('#date-format').value = '';
    }
    $('#date-example').textContent = `${d.toLocaleDateString(dateLocale || UILang)} `
            + `${d.toLocaleDateString(dateLocale || UILang, { month: 'long' })}`;

    if (episodesSortOrder) $('#sort-order').value = episodesSortOrder;

    if (displayShowsTitle) {
        $('#shows-titles').value = displayShowsTitle;
    } else {
        $('#shows-titles').value = UILang === 'ru' ? 'ru+original' : 'original';
    }

    if (!showsWithNewEpAtTop) {
        $('#sort-shows').checked = false;
    }

    if (alwaysShowNextEpisode) {
        $('#show-next-episode').checked = true;
    }

    const externalLinksList = document.getElementById('external-links');
    const externalLinksTmp = getExternalSearchTmp();
    let links;
    try {
        links = JSON.parse(externalLinks);
    } finally {
        links = links && links.length ? links : [];
    }
    const linkElements = links.map(linkObj => createUrlField(externalLinksTmp, linkObj));
    linkElements.push(createUrlField(externalLinksTmp));
    externalLinksList.append(...linkElements);

    const addFieldButton = $('fieldset .add-field');
    addFieldButton.addEventListener('click', () => {
        externalLinksList.appendChild(createUrlField(externalLinksTmp));
    });
};


document.addEventListener('DOMContentLoaded', async () => {
    await restoreData();

    const fontSizeBtns = $$('button.font-size');
    for (const fSizeBtn of fontSizeBtns) {
        fSizeBtn.addEventListener('click', async (e) => {
            const { fSizeDiff } = e.currentTarget.dataset;
            await storage.saveOptions({ fSizeDiff });
            setCurrentFontSize(fSizeDiff);
        });
    }

    const dateFormat = $('#date-format');
    dateFormat.addEventListener('change', async () => {
        const dateLocale = dateFormat.value;
        const d = new Date();
        $('#date-example').textContent = `${d.toLocaleDateString(dateLocale || UILang)} `
            + `${d.toLocaleDateString(dateLocale || UILang, { month: 'long' })}`;
        await storage.saveOptions({ dateLocale });
    });

    const sortOrder = $('#sort-order');
    sortOrder.addEventListener('change', async () => {
        const episodesSortOrder = sortOrder.value;
        await storage.saveOptions({ episodesSortOrder });
    });

    const showTitles = $('#shows-titles');
    showTitles.addEventListener('change', async () => {
        const displayShowsTitle = showTitles.value;
        await storage.saveOptions({ displayShowsTitle });
    });

    const sortShows = $('#sort-shows');
    sortShows.addEventListener('change', async () => {
        await storage.saveOptions({ showsWithNewEpAtTop: sortShows.checked });
    });

    const showNextEpisode = $('#show-next-episode');
    showNextEpisode.addEventListener('change', async () => {
        await storage.saveOptions({ alwaysShowNextEpisode: showNextEpisode.checked });
    });

    const fieldset = $('fieldset.external-search');
    const debouncedListener = debounce(saveExternalLinks, 200);
    fieldset.addEventListener('input', () => debouncedListener(fieldset));
});
