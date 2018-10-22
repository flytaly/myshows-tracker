/* global storage, browser, types */

const dateLocale = 'en-GB';

const getElem = document.getElementById.bind(document);
const { body } = document;

const mainView = getElem('main-view');
const episodeView = getElem('episode-view');

const goBackBtn = getElem('go-back-btn');
const showList = mainView.querySelector('.show-list');
const calendarContainer = mainView.querySelector('.calendar-container');
const loginName = getElem('loginname');
const logoLink = document.querySelector('.logo > a');

const templates = {
    showRow: getElem('show-row-tmp').content,
    seasonBlock: getElem('season-block-tmp').content,
    episodeRow: getElem('episode-row-tmp').content,
    calendar: getElem('calendar-tmp').content,
    calendarRow: getElem('calendar-row-tmp').content,
};

const bgScriptPort = browser.runtime.connect();
const showsInfo = {}; // show's info for easy access to it in the episode view
const episodeRemoved = new Event('episoderemoved');

function handleRatingClicks(ratingBlock, episodeId, showId) {
    const ratingElems = ratingBlock.querySelectorAll('a.rating-star, a.ep-check');
    const handler = async (e) => {
        const rateElem = e.target.closest('a.rating-star, a.ep-check');
        const CHECKED = 'checked';
        e.preventDefault();

        if (rateElem) {
            const listElem = rateElem.closest('li');
            const { rating } = rateElem.dataset;
            /*
            if (rating === '0' && rateElem.classList.contains(CHECKED)) {
                bgScriptPort.postMessage({ type: types.UNCHECK_EPISODE, payload: { episodeId } });
                listElem.classList.remove(CHECKED);
                ratingElems.forEach(el => el.classList.remove(CHECKED));
                return;
            }
            */
            bgScriptPort.postMessage({ type: types.RATE_EPISODE, payload: { episodeId, rating, showId } });
            listElem.classList.add(CHECKED);
            ratingElems.forEach((el) => {
                if (el.dataset.rating <= rating) {
                    el.classList.add(CHECKED);
                    return;
                }
                el.classList.remove(CHECKED);
            });
        }
    };

    ratingBlock.addEventListener('click', handler);
}


function renderShowRow(showRecord, onClick) {
    const { unwatchedEpisodes, show } = showRecord;
    const listElem = templates.showRow.cloneNode(true);
    const link = listElem.querySelector('a');
    const unwatchedElem = listElem.querySelector('.unwatched-ep');

    link.dataset.id = show.id;
    link.title = show.title;
    link.href = `https://myshows.me/view/${show.id}/`;
    link.textContent = show.title;
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const { id } = e.target.dataset;
        onClick(id);
    });

    if (unwatchedEpisodes > 0) {
        unwatchedElem.hidden = false;
        unwatchedElem.dataset.id = show.id;
        unwatchedElem.textContent = unwatchedEpisodes;
        unwatchedElem.addEventListener('click', (e) => {
            e.preventDefault();
            const { id } = e.target.dataset;
            onClick(id);
        });
    }

    return listElem;
}

function renderCalendarRow({
    id, showId, title, airDateUTC, shortName,
}) {
    const airDate = new Date(airDateUTC);
    const now = new Date();

    const calendarRowElem = templates.calendarRow.cloneNode(true);
    const dateElem = calendarRowElem.querySelector('.calendar-date');
    const showTitle = calendarRowElem.querySelector('.calendar-show-title a');
    const epNumber = calendarRowElem.querySelector('.calendar-ep-number');
    const epTitle = calendarRowElem.querySelector('.calendar-ep-title a');
    const daysLeft = calendarRowElem.querySelector('.calendar-days-left');

    dateElem.innerHTML = `${airDate.getDate()}<br>${airDate.toLocaleDateString(dateLocale, { weekday: 'short' })}`;
    dateElem.title = airDate.toLocaleString(dateLocale);

    showTitle.title = showsInfo[showId].title;
    showTitle.href = `https://myshows.me/view/${showId}/`;
    showTitle.textContent = showsInfo[showId].title;

    epNumber.textContent = shortName;

    epTitle.textContent = title;
    epTitle.title = title;
    epTitle.href = `https://myshows.me/view/episode/${id}/`;

    const countDays = Math.ceil((airDate - now) / 1000 / 60 / 60 / 24);
    daysLeft.innerHTML = `${countDays}<br>days`;
    daysLeft.title = airDate.toLocaleString(dateLocale);
    return calendarRowElem;
}

function renderCalendars(upcomingEpisodes) {
    // group episodes by month, episodes have to be sorted in time order beforehand
    const groupByMonth = upcomingEpisodes.reduce((acc, ep) => {
        const date = new Date(ep.airDateUTC);
        const [month, year] = [date.getMonth(), date.getFullYear()];
        const last = acc[acc.length - 1];
        if (!last || last.month !== month || last.year !== year) {
            acc.push({
                month,
                year,
                episodes: [ep],
                monthName: date.toLocaleDateString(dateLocale, { month: 'long' }),
            });
        } else {
            last.episodes.push(ep);
        }
        return acc;
    }, []);

    const currentYear = new Date().getFullYear();

    return groupByMonth.map(({ monthName, year, episodes }) => {
        const calendarElem = templates.calendar.cloneNode(true);
        const name = calendarElem.querySelector('.month-name');
        const totalNumber = calendarElem.querySelector('.month-total');
        const calendarList = calendarElem.querySelector('ul.calendar');
        name.textContent = `${monthName} ${year === currentYear ? '' : year}`;
        totalNumber.textContent = `${episodes.length} episodes`;
        calendarList.append(...episodes.map(ep => renderCalendarRow(ep)));
        return calendarElem;
    });
}

function renderEpisodeRow({
    id, title, shortName, airDateUTC, commentsCount, showId, seasonNumber,
}) {
    const ep = templates.episodeRow.cloneNode(true);
    const link = ep.querySelector('.ep-title a');
    const epListElem = ep.querySelector('.episode-row');
    const epNumber = ep.querySelector('.ep-number');
    const epDate = ep.querySelector('.ep-date');
    const epComments = ep.querySelector('.ep-comments a');
    const epRatingBlock = ep.querySelector('.rating-block');
    const date = airDateUTC ? new Date(airDateUTC) : null;
    epListElem.dataset.id = id;
    epListElem.dataset.season = seasonNumber;
    link.href = `https://myshows.me/view/episode/${id}/`;
    link.title = title;
    link.textContent = title;
    epNumber.textContent = shortName;
    handleRatingClicks(epRatingBlock, id, showId);
    if (date) {
        epDate.textContent = date.toLocaleDateString(dateLocale);
        epDate.title = date.toLocaleString(dateLocale);
    }

    if (commentsCount) {
        ep.querySelector('.ep-comments').hidden = false;
        epComments.textContent = commentsCount;
        epComments.title = `${commentsCount} comments`;
        epComments.href = `https://en.myshows.me/view/episode/${id}/#comments`;
    }

    return ep;
}

function renderSeasonBlocks(episodes) {
    const groupedBySeasons = episodes.reduce((acc, ep) => {
        const { seasonNumber: N } = ep;
        acc[N] ? acc[N].push(ep) : acc[N] = [ep]; // eslint-disable-line no-unused-expressions
        return acc;
    }, {});

    return Object.keys(groupedBySeasons)
        .sort((a, b) => b - a)
        .map((season, idx, seasons) => {
            const seasonBlock = templates.seasonBlock.cloneNode(true);
            const seasonHeader = seasonBlock.querySelector('.season-header');
            const seasonTitle = seasonBlock.querySelector('.season-title');
            const seasonEpisodesNumber = seasonBlock.querySelector('.episodes-in-season');
            const episodeList = seasonBlock.querySelector('.episode-list');
            let episodesInSeason = groupedBySeasons[season].length;

            seasonTitle.textContent = `${season} season`;
            seasonEpisodesNumber.textContent = `${episodesInSeason} episodes`;

            seasonHeader.dataset.season = season;
            seasonHeader.addEventListener('click', () => {
                this.classList.toggle('expanded');
                const panel = this.nextElementSibling;
                panel.hidden = !panel.hidden;
            });
            seasonHeader.addEventListener('episoderemoved', () => {
                episodesInSeason -= 1;
                seasonEpisodesNumber.textContent = `${episodesInSeason} episodes`;
                if (episodesInSeason === 0) {
                    seasonHeader.parentNode.removeChild(seasonHeader);
                }
            });

            if (idx < seasons.length - 1) {
                episodeList.hidden = true;
            } else {
                seasonHeader.classList.add('expanded');
            }

            const seasonEps = groupedBySeasons[season];
            episodeList.append(...seasonEps.map(ep => renderEpisodeRow(ep)));
            return seasonBlock;
        });
}

const toggleHidden = (toHide, toShow) => {
    /* eslint-disable no-param-reassign */
    toHide.forEach((elem) => {
        elem.hidden = true;
    });
    toShow.forEach((elem) => {
        elem.hidden = false;
    });
};

const nav = {
    places: {
        showList: 'showList',
        episodeList: 'episodeList',
        upcomingList: 'upcomingList',
        current: 'showList',
    },
    async navigate(location, params) {
        switch (location) {
            case this.places.showList: {
                this.places.current = location;
                const shows = await storage.getWatchingShows();
                body.style.background = '#FFFFFF';

                toggleHidden(
                    [goBackBtn, episodeView, calendarContainer],
                    [mainView, showList],
                );
                this.updateLogoNav();
                showList.innerHTML = '';

                if (!shows || !shows.length) break;

                shows.forEach(({ show: { id, image, title } }) => {
                    showsInfo[id] = { image, title };
                });

                const clickHandler = id => this.navigate(this.places.episodeList, { id });

                showList.append(...shows
                    .filter(show => show.unwatchedEpisodes)
                    .map(show => renderShowRow(show, clickHandler)));
                break;
            }

            case this.places.upcomingList: {
                this.places.current = location;
                const episodes = await storage.getUpcomingEpisodes();

                toggleHidden(
                    [episodeView, goBackBtn, showList],
                    [mainView, calendarContainer],
                );

                calendarContainer.innerHTML = '';

                if (!episodes || !episodes.length) break;

                calendarContainer.append(...renderCalendars(episodes));
                break;
            }

            case this.places.episodeList: {
                this.places.current = location;
                // save showId in the object to retrieve it after reloading
                this.showId = params ? params.id : this.showId;
                const container = episodeView.querySelector('.episodes-container');
                const showTitle = episodeView.querySelector('.show-title a');
                const allEpisodes = await storage.getEpisodes();
                const episodes = allEpisodes ? allEpisodes[this.showId] : null;
                if (!episodes) break;

                const show = showsInfo[this.showId];
                showTitle.textContent = show.title;
                showTitle.href = `https://myshows.me/view/${this.showId}/`;
                body.style.background = `white url(${show.image}) no-repeat`;
                body.style.backgroundSize = 'cover';
                body.style.backgroundAttachment = 'fixed';

                toggleHidden([mainView], [episodeView, goBackBtn]);

                this.updateLogoNav();
                container.innerHTML = '';

                container.append(...renderSeasonBlocks(episodes));
                break;
            }
            default:
        }
    },
    updateLogoNav() {
        const handleClick = (e) => {
            e.preventDefault();
            nav.navigate(nav.places.showList);
        };
        if (this.places.current === this.places.showList) {
            logoLink.title = 'Open myshows.me';
            logoLink.removeEventListener('click', handleClick);
        } else {
            logoLink.title = 'Return to main page';
            logoLink.addEventListener('click', handleClick);
        }
    },
};

const initDropdownMenu = () => {
    const menu = document.querySelector('.user .menu');

    getElem('sign-out').addEventListener('click', async () => {
        bgScriptPort.postMessage({ type: types.SIGN_OUT });
        window.close();
    });

    loginName.addEventListener('click', () => menu.classList.toggle('open'));

    window.onclick = (event) => {
        if (event.target !== loginName) {
            if (menu.classList.contains('open')) {
                menu.classList.remove('open');
            }
        }
    };
};

function initTabs() {
    const tabShows = getElem('tab-shows');
    const tabCalendar = getElem('tab-calendar');

    tabShows.addEventListener('click', () => {
        nav.navigate(nav.places.showList);
        tabShows.classList.add('active');
        tabCalendar.classList.remove('active');
    });

    tabCalendar.addEventListener('click', () => {
        nav.navigate(nav.places.upcomingList);
        tabCalendar.classList.add('active');
        tabShows.classList.remove('active');
    });
}

async function init() {
    const loadingSpinner = getElem('loading');

    goBackBtn.title = 'Return to main page';
    goBackBtn.addEventListener('click', () => {
        nav.navigate(nav.places.showList);
    });

    loginName.textContent = await storage.getProfile();

    initDropdownMenu();
    initTabs();

    const episodesToRemove = new Set();
    bgScriptPort.onMessage.addListener(async (message) => {
        const { type, payload } = message;
        switch (type) {
            case types.INFO_UPDATED: {
                // upon receiving a new information update the current view
                const shows = await storage.getWatchingShows();
                shows.forEach(({ show: { id, image, title } }) => {
                    showsInfo[id] = { image, title };
                });
                if (nav.places.current !== nav.places.episodeList) nav.navigate(nav.places.current);
                break;
            }
            case types.LOADING_START:
                loadingSpinner.hidden = false;
                break;
            case types.LOADING_ENDED:
                loadingSpinner.hidden = true;
                break;
            case types.EPISODE_WAS_RATED: {
                if (episodesToRemove.has(payload.episodeId)) return; // to prevent double removing from DOM
                episodesToRemove.add(payload.episodeId);

                const episodeElem = document.querySelector(`.episode-row[data-id="${payload.episodeId}"]`);
                const { season } = episodeElem.dataset;
                const seasonHeader = document.querySelector(`.season-header[data-season="${season}"]`);

                episodeElem.addEventListener('mouseleave', () => {
                    episodeElem.classList.add('remove');
                    const tm = setTimeout(() => {
                        episodeElem.parentNode.removeChild(episodeElem);
                        episodesToRemove.delete(payload.episodeId);
                        seasonHeader.dispatchEvent(episodeRemoved);
                    }, 1000);

                    episodeElem.addEventListener('mouseover', () => {
                        episodeElem.classList.remove('remove');
                        clearTimeout(tm);
                    }, { once: true });
                });

                // forcefully trigger 'mouseleave' if mouse already leaved episode before the event was added
                document.addEventListener('mousemove', ({ clientX, clientY }) => {
                    const {
                        top, left, bottom, right,
                    } = episodeElem.getBoundingClientRect();
                    if (clientX < left || clientX > right
                        || clientY < top || clientY > bottom) episodeElem.dispatchEvent(new Event('mouseleave'));
                }, { once: true });
                break;
            }
            default:
        }
    });

    await nav.navigate(nav.places.showList);
}

init()
    .catch(e => console.error(e));
