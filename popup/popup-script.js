/* global storage */

// browser.runtime.sendMessage({ type: types.LOGIN });

const getElem = document.getElementById.bind(document);

const mainView = getElem('main-view');
const episodeView = getElem('episode-view');

const showElemTemplate = getElem('show-element');
const episodeElemTemplate = getElem('episode-element');


function renderShowRow({ show }, onClick) {
    const listElem = showElemTemplate.content.cloneNode(true);
    const link = listElem.querySelector('a');
    link.dataset.id = show.id;
    link.title = show.title;
    link.href = `https://myshows.me/view/${show.id}/`;
    link.innerText = show.title;
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const { id } = e.target.dataset;
        onClick(id);
    });
    return listElem;
}


function renderEpisodeRow({
    id, title, shortName, airDateUTC, commentsCount,
}) {
    const ep = episodeElemTemplate.content.cloneNode(true);
    const link = ep.querySelector('.ep-title a');
    const epNumber = ep.querySelector('.ep-number');
    const epDate = ep.querySelector('.ep-date');
    const epComments = ep.querySelector('.ep-comments');
    const date = airDateUTC ? new Date(airDateUTC) : null;
    link.href = `https://myshows.me/view/episode/${id}/`;
    link.title = title;
    link.innerText = title;
    epNumber.textContent = shortName;

    if (date) {
        epDate.textContent = date.toLocaleDateString();
        epDate.title = date.toLocaleString();
    }

    epComments.textContent = commentsCount;
    epComments.title = `${commentsCount} comments`;

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

                mainView.hidden = false;
                episodeView.hidden = true;
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

                mainView.hidden = true;
                episodeView.hidden = false;
                episodeList.innerHTML = '';

                episodeList.append(...episodes.map(ep => renderEpisodeRow(ep)));
                break;
            }

            default:
        }
    },
};

async function init() {
    getElem('go-back').addEventListener('click', () => {
        nav.navigate(nav.places.showList);
    });

    try {
        await nav.navigate(nav.places.showList);
    } catch (e) {
        console.error(e);
    }
}

init();
