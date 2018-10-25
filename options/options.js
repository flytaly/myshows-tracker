/* global storage */

const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

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
    if (dateLocale) {
        $('#date-format').value = dateLocale;
        $('#date-example').textContent = new Date().toLocaleDateString(dateLocale);
    }
    if (episodesSortOrder) $('#sort-order').value = episodesSortOrder;
    if (displayShowsTitle) $('#shows-titles').value = displayShowsTitle;
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
        $('#date-example').textContent = new Date().toLocaleDateString(dateLocale);
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
