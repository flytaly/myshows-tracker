/* global storage */

// browser.runtime.sendMessage({ type: types.LOGIN });

const list = document.getElementById('show-list');

async function displayShows() {
    const shows = await storage.getWatchingShows();
    if (shows) {
        const elems = shows.map(({ show }) => {
            const showElement = document.createElement('li');
            showElement.id = show.id;
            showElement.title = show.titleOriginal;
            showElement.innerText = show.title;

            return showElement;
        });
        list.append(...elems);
    }
}

displayShows().catch(console.error);
