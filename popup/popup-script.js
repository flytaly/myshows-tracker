/* global storage */

// browser.runtime.sendMessage({ type: types.LOGIN });

const getElem = document.getElementById.bind(document);

const mainView = getElem('main-view');
const episodeView = getElem('episode-view');
const container = document.body;

const goBackBtn = getElem('go-back-btn');
const showTitle = episodeView.querySelector('.show-title a');

const showElemTemplate = getElem('show-element');
const episodeElemTemplate = getElem('episode-element');

const showsInfo = {};

function renderShowRow(showRecord, onClick) {
    const { totalEpisodes, watchedEpisodes, show } = showRecord;
    const unwatchedEpNumber = totalEpisodes - watchedEpisodes;
    const listElem = showElemTemplate.content.cloneNode(true);
    const link = listElem.querySelector('a');
    const unwatchedElem = listElem.querySelector('.unwatched-ep');

    link.dataset.id = show.id;
    link.title = show.title;
    link.href = `https://myshows.me/view/${show.id}/`;
    link.innerText = show.title;
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const { id } = e.target.dataset;
        onClick(id);
    });

    if (unwatchedEpNumber > 0) {
        unwatchedElem.hidden = false;
        unwatchedElem.dataset.id = show.id;
        unwatchedElem.textContent = unwatchedEpNumber;
        unwatchedElem.addEventListener('click', (e) => {
            e.preventDefault();
            const { id } = e.target.dataset;
            onClick(id);
        });
    }

    return listElem;
}


function renderEpisodeRow({
    id, title, shortName, airDateUTC, commentsCount,
}) {
    const ep = episodeElemTemplate.content.cloneNode(true);
    const link = ep.querySelector('.ep-title a');
    const epNumber = ep.querySelector('.ep-number');
    const epDate = ep.querySelector('.ep-date');
    const epComments = ep.querySelector('.ep-comments a');
    const date = airDateUTC ? new Date(airDateUTC) : null;
    link.href = `https://myshows.me/view/episode/${id}/`;
    link.title = title;
    link.innerText = title;
    epNumber.textContent = shortName;

    if (date) {
        epDate.textContent = date.toLocaleDateString();
        epDate.title = date.toLocaleString();
    }

    if (commentsCount) {
        ep.querySelector('.ep-comments').hidden = false;
        epComments.textContent = commentsCount;
        epComments.title = `${commentsCount} comments`;
        epComments.href = `https://en.myshows.me/view/episode/${id}/#comments`;
    }

    return ep;
}

const nav = {
    places: {
        showList: 'showList',
        episodeList: 'episodeList',
    },
    async navigate(location, params) {
        switch (location) {
            case this.places.showList: {
                const showList = mainView.querySelector('.show-list');
                const shows = await storage.getWatchingShows();
                if (!shows || !shows.length) break;

                // save info for easy access to it in the episode view
                shows.reduce((acc, { show: { id, image, title } }) => {
                    acc[id] = { image, title };
                    return acc;
                }, showsInfo);

                container.style.background = '#FFFFFF';

                mainView.hidden = false;
                episodeView.hidden = true;
                goBackBtn.hidden = true;
                showList.innerHTML = '';

                const clickHandler = id => this.navigate(this.places.episodeList, { id });
                showList.append(...shows.map(show => renderShowRow(show, clickHandler)));
                break;
            }
            case this.places.episodeList: {
                const episodeList = episodeView.querySelector('.episode-list');
                const allEpisodes = await storage.getEpisodes();
                const episodes = allEpisodes ? allEpisodes[params.id] : null;
                if (!episodes) break;

                const show = showsInfo[params.id];
                showTitle.textContent = show.title;
                showTitle.href = `https://myshows.me/view/${params.id}/`;
                container.style.background = `url(${show.image}) no-repeat`;
                container.style.backgroundSize = 'cover';
                container.style.backgroundAttachment = 'fixed';

                mainView.hidden = true;
                episodeView.hidden = false;
                goBackBtn.hidden = false;
                episodeList.innerHTML = '';

                episodeList.append(...episodes.map(ep => renderEpisodeRow(ep)));
                break;
            }

            default:
        }
    },
};

async function init() {
    goBackBtn.addEventListener('click', () => {
        nav.navigate(nav.places.showList);
    });

    try {
        await nav.navigate(nav.places.showList);
    } catch (e) {
        console.error(e);
    }
}

init();
