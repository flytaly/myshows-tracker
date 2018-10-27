/* global storage, browser */

const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);
const UILang = browser.i18n.getUILanguage();

const setCurrentFontSize = (fSizeDiff) => {
    if (fSizeDiff) {
        const elem = $(`.font-size[data-f-size-diff="${fSizeDiff}"]`);
        const prev = $('.font-size.default');
        if (elem) {
            prev.classList.remove('default');
            elem.classList.add('default');
        }
    }
};

const restoreData = async () => {
    const {
        fSizeDiff, dateLocale, episodesSortOrder, displayShowsTitle,
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
});
