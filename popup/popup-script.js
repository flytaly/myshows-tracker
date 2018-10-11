/* global storage */

// browser.runtime.sendMessage({ type: types.LOGIN });

const showList = document.getElementById('show-list');
const episodeList = document.getElementById('episode-list');
const goBackButton = document.getElementById('go-back');

const nav = {
    places: {
        showList: 'showList',
        episodeList: 'episodeList',
    },
    async navigate(location, params) {
        switch (location) {
            case this.places.episodeList: {
                const allEpisodes = await storage.getEpisodes();
                if (allEpisodes) {
                    const showEp = allEpisodes[params.id];
                    showList.hidden = true;
                    episodeList.hidden = false;
                    goBackButton.hidden = false;
                    episodeList.innerHTML = '';

                    const elems = showEp.map((episode) => {
                        const epListElem = document.createElement('li');
                        const linkElem = document.createElement('a');
                        linkElem.href = `https://myshows.me/view/episode/${episode.id}/`;
                        linkElem.title = episode.title;
                        linkElem.innerText = episode.shortName;
                        epListElem.appendChild(linkElem);
                        return epListElem;
                    });

                    episodeList.append(...elems);
                }
                break;
            }
            case this.places.showList:
                showList.hidden = false;
                episodeList.hidden = true;
                goBackButton.hidden = true;


            default:
        }
    },
};

async function displayShows() {
    const shows = await storage.getWatchingShows();
    if (shows) {
        const elems = shows.map(({ show }) => {
            const listElem = document.createElement('li');
            const link = document.createElement('a');
            link.dataset.id = show.id;
            link.title = show.titleOriginal;
            link.href = `https://myshows.me/view/${show.id}/`;
            link.innerText = show.title;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const { id } = e.target.dataset;
                nav.navigate(nav.places.episodeList, { id });
            });
            listElem.appendChild(link);
            return listElem;
        });
        showList.append(...elems);
    }
}


displayShows().catch(console.error);

goBackButton.addEventListener('click', (e) => {
    nav.navigate(nav.places.showList);
});
