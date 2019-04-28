/* eslint-disable no-param-reassign */
import types from '../types';
import storage from '../storage';
import { translateElement } from '../l10n';
import UILang from './ui-language';
import { getTitleOptions, getPluralForm } from './utils';


let dateLocale = UILang;
const initOptions = (async () => {
    const res = await storage.getOptions();
    dateLocale = res.dateLocale ? res.dateLocale : UILang;
    return res;
})();

const translateTemplate = ({ content }) => { translateElement(content); return content; };

document.addEventListener('DOMContentLoaded', async () => {
    const options = await initOptions;
    // If browser's standard size is 16px then +2 diff means 12px, -2 means 8px ...
    if (options.fSizeDiff) document.documentElement.style.fontSize = `${100 / 16 * (10 + Number(options.fSizeDiff))}%`;
    const getElem = document.getElementById.bind(document);
    const mainView = getElem('main-view');
    const episodeView = getElem('episode-view');
    const backBtn = getElem('back-btn');
    const showContainer = mainView.querySelector('.show-container');
    const calendarContainer = mainView.querySelector('.calendar-container');
    const logoLink = document.querySelector('.logo > a');

    const templates = {
        showRow: translateTemplate(getElem('show-row-tmp')),
        seasonBlock: translateTemplate(getElem('season-block-tmp')),
        episodeRow: translateTemplate(getElem('episode-row-tmp')),
        calendar: translateTemplate(getElem('calendar-tmp')),
        calendarRow: translateTemplate(getElem('calendar-row-tmp')),
        blankPage: translateTemplate(getElem('blank-page-tmp')),
        showListBlock: translateTemplate(getElem('show-list-block-tmp')),
        openExternalList: translateTemplate(getElem('open-external-list-tmp')),
        openExternalRow: translateTemplate(getElem('open-external-row-tmp')),
        openExternalAddSearch: translateTemplate(getElem('open-external-add-search')),
    };

    const bgScriptPort = browser.runtime.connect();
    const showsInfo = {}; // show's info for easy access to it in the episode view
    const updateShowsInfo = (shows = []) => {
        shows.forEach(({
            show: {
                id, image, title, titleOriginal,
            },
        }) => {
            showsInfo[id] = { image, title, titleOriginal };
        });
    };
    const customEvents = { episodeRemoved: new Event('episoderemoved') };

    const titleOptions = getTitleOptions(options);

    function handleRatingClicks(ratingBlock, episodeId, showId, epListElem) {
        const ratingElems = ratingBlock.querySelectorAll('a.rating-star, a.ep-check');
        const handler = async (e) => {
            const rateElem = e.target.closest('a.rating-star, a.ep-check');
            const CHECKED = 'checked';
            e.preventDefault();

            if (rateElem) {
                const listElem = rateElem.closest('li');
                const { rating } = rateElem.dataset;

                bgScriptPort.postMessage({ type: types.RATE_EPISODE, payload: { episodeId, rating, showId } });
                listElem.classList.add(CHECKED);
                ratingElems.forEach((el) => {
                    if (el.dataset.rating <= rating) {
                        el.classList.add(CHECKED);
                        return;
                    }
                    el.classList.remove(CHECKED);
                });
                epListElem.addEventListener('mouseleave', () => { epListElem.dataset.mouseleaved = 'true'; });
                epListElem.addEventListener('mouseenter', () => { epListElem.dataset.mouseleaved = ''; });
            }
        };

        ratingBlock.addEventListener('click', handler);
    }

    function renderOpenExternalMenu(showTitle = '') {
        const listBlock = templates.openExternalList.cloneNode(true);
        const list = listBlock.querySelector('.open-external-list');

        let externalLinks = [];
        let externalLinksElements = [];
        try {
            externalLinks = JSON.parse(options.externalLinks);
        } catch (e) {
            externalLinks = [];
        }
        const addNewSearchElem = templates.openExternalAddSearch.cloneNode(true);
        const addNewSearchLink = addNewSearchElem.querySelector('a');
        addNewSearchLink.addEventListener('click', async (e) => {
            e.preventDefault();
            await browser.runtime.openOptionsPage();
            window.close();
        });

        if (externalLinks && externalLinks.length) {
            externalLinksElements = externalLinks.map(({ name, url }) => {
                const listElem = templates.openExternalRow.cloneNode(true);
                const link = listElem.querySelector('a');
                link.href = `${url}${showTitle}`;
                link.textContent = name || link.hostname;
                return listElem;
            });
        }

        externalLinksElements.push(addNewSearchElem);
        list.append(...externalLinksElements);
        return list;
    }

    function renderShowRow(showRecord, onClick, withOpenedMenu = false) {
        const toggleExternalLinksMenu = (btn) => {
            const container = btn.parentNode;
            btn.addEventListener('click', () => {
                container.classList.toggle('open');
            });
            window.addEventListener('click', (event) => {
                if (event.target !== btn) {
                    if (container.classList.contains('open')) {
                        container.classList.remove('open');
                    }
                }
            });
        };

        const { unwatchedEpisodes, show, nextEpisode } = showRecord;
        const listElem = templates.showRow.cloneNode(true);
        const titleLink = listElem.querySelector('.show-title a');
        const showTitle1 = titleLink.querySelector('.show-title-1');
        const showTitle2 = titleLink.querySelector('.show-title-2');
        const nextEpisodeElem = titleLink.querySelector('.next-episode');
        const nextEpisodeDateElem = titleLink.querySelector('.next-episode-date');
        const unwatchedElem = listElem.querySelector('.unwatched-ep');

        const externalBlock = listElem.querySelector('.external-block');
        const externalButton = listElem.querySelector('.external');
        externalBlock.appendChild(renderOpenExternalMenu(show.titleOriginal));
        toggleExternalLinksMenu(externalButton);
        if (withOpenedMenu) { externalBlock.classList.add('open'); }

        titleLink.dataset.id = show.id;
        titleLink.title = show.titleOriginal;
        titleLink.href = `https://myshows.me/view/${show.id}/`;

        const { showTwoTitles, title1, title2 } = titleOptions;
        showTitle1.textContent = title1 === 'original' ? show.titleOriginal : show.title;
        if (showTwoTitles) {
            showTitle2.textContent = title2 === 'original' ? show.titleOriginal : show.title;
        }
        nextEpisodeElem.textContent = nextEpisode.shortName;
        const date = nextEpisode.airDateUTC ? new Date(nextEpisode.airDateUTC) : null;
        if (date) {
            nextEpisodeDateElem.textContent = '(' + date.toLocaleDateString(dateLocale) + ')';
            nextEpisodeDateElem.title = date.toLocaleString(dateLocale);
        }
        titleLink.addEventListener('click', onClick);

        if (unwatchedEpisodes > 0) {
            unwatchedElem.hidden = false;
            unwatchedElem.dataset.id = show.id;
            unwatchedElem.textContent = unwatchedEpisodes;
            unwatchedElem.addEventListener('click', onClick);
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
        const dateElems = dateElem.querySelectorAll('span');
        const showTitle = calendarRowElem.querySelector('.calendar-show-title a');
        const epNumber = calendarRowElem.querySelector('.calendar-ep-number');
        const epTitle = calendarRowElem.querySelector('.calendar-ep-title a');
        const daysLeftElem = calendarRowElem.querySelector('.calendar-days-left');
        const daysLeftElems = daysLeftElem.querySelectorAll('span');

        dateElems[0].textContent = airDate.getDate().toString();
        dateElems[1].textContent = airDate.toLocaleDateString(dateLocale, { weekday: 'short' });
        dateElem.title = airDate.toLocaleString(dateLocale);

        showTitle.href = `https://myshows.me/view/${showId}/`;
        showTitle.title = (titleOptions.showTwoTitles && titleOptions.title2 !== 'original') ? showsInfo[showId].title : showsInfo[showId].titleOriginal;
        showTitle.textContent = titleOptions.title1 === 'original' ? showsInfo[showId].titleOriginal : showsInfo[showId].title;

        epNumber.textContent = shortName;

        epTitle.textContent = title;
        epTitle.title = title;
        epTitle.href = `https://myshows.me/view/episode/${id}/`;

        const countDays = Math.ceil((airDate - now) / 1000 / 60 / 60 / 24);
        daysLeftElems[0].textContent = countDays.toString();
        daysLeftElems[1].textContent = getPluralForm('daysNumber', countDays);
        daysLeftElem.title = airDate.toLocaleString(dateLocale);

        return calendarRowElem;
    }

    function renderCalendars(upcomingEpisodes) {
    // TODO: show shows that will air today on top of the list in different category

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
            totalNumber.textContent = getPluralForm('episodesNumber', episodes.length); // `${episodes.length} episodes`
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
        handleRatingClicks(epRatingBlock, id, showId, epListElem);
        if (date) {
            epDate.textContent = date.toLocaleDateString(dateLocale);
            epDate.title = date.toLocaleString(dateLocale);
        }

        if (commentsCount) {
            ep.querySelector('.ep-comments').hidden = false;
            epComments.textContent = commentsCount;
            epComments.href = `https://en.myshows.me/view/episode/${id}/#comments`;
        }

        return ep;
    }

    function renderSeasonBlocks(episodes) {
        const order = options.episodesSortOrder === 'firstNew' ? 'firstNew' : 'firstOld';

        const groupCb = (acc, ep) => {
            const { seasonNumber: N } = ep;
            acc[N] ? acc[N].push(ep) : acc[N] = [ep]; // eslint-disable-line no-unused-expressions
            return acc;
        };

        const groupedBySeasons = order === 'firstNew'
            ? episodes.reduce(groupCb, {})
            : episodes.reduceRight(groupCb, {});

        const getSortOrderFunc = () => (order === 'firstNew'
            ? (a, b) => b - a
            : (a, b) => a - b);

        return Object.keys(groupedBySeasons)
            .sort(getSortOrderFunc())
            .map((season, idx, seasons) => {
                const seasonBlock = templates.seasonBlock.cloneNode(true);
                const seasonHeader = seasonBlock.querySelector('.season-header');
                const seasonTitle = seasonBlock.querySelector('.season-title');
                const seasonEpisodesNumber = seasonBlock.querySelector('.episodes-in-season');
                const episodeList = seasonBlock.querySelector('.episode-list');
                let episodesInSeason = groupedBySeasons[season].length;

                seasonTitle.textContent = `${season} ${browser.i18n.getMessage('season')}`;
                seasonEpisodesNumber.textContent = getPluralForm('episodesNumber', episodesInSeason);

                seasonHeader.dataset.season = season;
                seasonHeader.addEventListener('click', () => {
                    seasonHeader.classList.toggle('expanded');
                    const panel = seasonHeader.nextElementSibling;
                    panel.hidden = !panel.hidden;
                });
                seasonHeader.addEventListener('episoderemoved', () => {
                    episodesInSeason -= 1;
                    seasonEpisodesNumber.textContent = getPluralForm('episodesNumber', episodesInSeason);
                    if (episodesInSeason === 0) {
                        seasonHeader.parentNode.removeChild(seasonHeader);
                        episodeList.parentNode.removeChild(episodeList);
                    }
                });

                if ((order === 'firstNew' && idx < seasons.length - 1)
                    || (order === 'firstOld' && idx !== 0)) {
                    episodeList.hidden = true;
                } else {
                    seasonHeader.classList.add('expanded');
                }

                const seasonEps = groupedBySeasons[season];
                episodeList.append(...seasonEps.map(ep => renderEpisodeRow(ep)));
                return seasonBlock;
            });
    }

    function renderShowListBlock(shows, nav, showWithOpenedMenu) {
        const showListBlock = templates.showListBlock.cloneNode(true);
        const showList = showListBlock.querySelector('.show-list');

        const clickHandler = (e) => {
            const { id } = e.currentTarget.dataset;
            e.preventDefault();
            nav.navigate(nav.places.episodeList, { id });
        };

        if (options.showsWithNewEpAtTop) {
            shows.sort((s1, s2) => Date.parse(s2.latestEpisode.airDateUTC) - Date.parse(s1.latestEpisode.airDateUTC));
        }

        showList.append(...shows
            .map((show) => {
                const openMenu = showWithOpenedMenu && (Number(show.show.id) === Number(showWithOpenedMenu));
                return renderShowRow(show, clickHandler, openMenu);
            }));
        return showListBlock;
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
        async navigate(location, params = {}) {
            switch (location) {
                case this.places.showList: {
                    this.places.current = location;
                    const shows = await storage.getWatchingShows();
                    document.body.style.background = '#FFFFFF';

                    toggleHidden(
                        [backBtn, episodeView, calendarContainer],
                        [mainView, showContainer],
                    );
                    this.updateLogoNav();
                    showContainer.innerHTML = '';

                    updateShowsInfo(shows);

                    const showsWithEp = shows ? shows.filter(show => show.unwatchedEpisodes) : null;

                    if (!showsWithEp || !showsWithEp.length) {
                        showContainer.appendChild(templates.blankPage.cloneNode(true));
                    } else {
                        showContainer.appendChild(renderShowListBlock(showsWithEp, nav, params.showWithOpenedMenu));
                    }
                    break;
                }

                case this.places.upcomingList: {
                    this.places.current = location;
                    const episodes = await storage.getUpcomingEpisodes();

                    toggleHidden(
                        [episodeView, backBtn, showContainer],
                        [mainView, calendarContainer],
                    );

                    calendarContainer.innerHTML = '';

                    if (!episodes || !episodes.length) {
                        calendarContainer.appendChild(templates.blankPage.cloneNode(true));
                    } else {
                        calendarContainer.append(...renderCalendars(episodes));
                    }
                    break;
                }

                case this.places.episodeList: {
                    this.places.current = location;
                    // save showId in the object to retrieve it after reloading
                    this.showId = params.id || this.showId;
                    const container = episodeView.querySelector('.episodes-container');
                    const showTitle = episodeView.querySelector('.show-title a');
                    const title1 = showTitle.querySelector('.show-title-1');
                    const title2 = showTitle.querySelector('.show-title-2');
                    const allEpisodes = await storage.getEpisodes();
                    const episodes = allEpisodes ? allEpisodes[this.showId] : null;
                    if (!episodes) break;

                    const show = showsInfo[this.showId];
                    showTitle.href = `https://myshows.me/view/${this.showId}/`;
                    title1.textContent = titleOptions.title1 !== 'original' ? show.title : show.titleOriginal;
                    if (titleOptions.showTwoTitles) {
                        title2.textContent = titleOptions.title2 !== 'original' ? show.title : show.titleOriginal;
                    }
                    document.body.style.background = `white url(${show.image}) no-repeat`;
                    document.body.style.backgroundSize = 'cover';
                    document.body.style.backgroundAttachment = 'fixed';

                    toggleHidden([mainView], [episodeView, backBtn]);

                    this.updateLogoNav();
                    container.innerHTML = '';

                    container.append(...renderSeasonBlocks(episodes));
                    break;
                }
                default:
            }
        },
        updateLogoNav() {
            if (nav.places.current === nav.places.episodeList) {
                logoLink.title = browser.i18n.getMessage('backButton_title');
                logoLink.onclick = (e) => {
                    e.preventDefault();
                    nav.navigate(nav.places.showList);
                };
            } else {
                logoLink.title = browser.i18n.getMessage('logoLink_title');
                logoLink.onclick = null;
            }
        },
    };

    const initDropdownMenu = (loginName) => {
        const menu = document.querySelector('.user .menu');

        getElem('settings').addEventListener('click', async () => {
            await browser.runtime.openOptionsPage();
            window.close();
        });

        getElem('sign-out').addEventListener('click', async () => {
            bgScriptPort.postMessage({ type: types.SIGN_OUT });
            window.close();
        });

        loginName.addEventListener('click', () => menu.classList.toggle('open'));

        window.addEventListener('click', (event) => {
            if (event.target !== loginName) {
                if (menu.classList.contains('open')) {
                    menu.classList.remove('open');
                }
            }
        });
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
        const loginName = getElem('loginname');

        backBtn.addEventListener('click', () => {
            nav.navigate(nav.places.showList);
        });

        (async () => { loginName.textContent = await storage.getProfile(); })();

        initDropdownMenu(loginName);
        initTabs();

        const episodesToRemove = new Set();
        bgScriptPort.onMessage.addListener(async (message) => {
            const { type, payload } = message;
            switch (type) {
                case types.INFO_UPDATED: {
                    // Upon receiving a new information, update the current view
                    // but not refresh episode list because a user might rate an episode in the meantime
                    // if there is show with opened search menu, pass id of the show to the next render
                    const openedSearch = document.querySelector('.external-block.open');
                    const showElement = openedSearch && openedSearch.previousElementSibling;
                    const showId = showElement && showElement.querySelector('a').dataset.id;
                    updateShowsInfo(await storage.getWatchingShows());
                    if (nav.places.current !== nav.places.episodeList) {
                        nav.navigate(nav.places.current, showId ? { showWithOpenedMenu: showId } : {});
                    }
                    break;
                }
                case types.LOADING_START:
                    loadingSpinner.hidden = false;
                    break;
                case types.LOADING_ENDED:
                    loadingSpinner.hidden = true;
                    break;
                case types.EPISODE_WAS_RATED: {
                    const episodeElem = document.querySelector(`.episode-row[data-id="${payload.episodeId}"]`);
                    if (!episodeElem) return;
                    if (episodesToRemove.has(payload.episodeId)) return; // to prevent double removing from DOM
                    episodesToRemove.add(payload.episodeId);

                    const { season } = episodeElem.dataset;
                    const seasonHeader = document.querySelector(`.season-header[data-season="${season}"]`);

                    episodeElem.addEventListener('mouseleave', () => {
                        episodeElem.classList.add('remove');
                        const tm = setTimeout(() => {
                            episodeElem.parentNode.removeChild(episodeElem);
                            episodesToRemove.delete(payload.episodeId);
                            seasonHeader.dispatchEvent(customEvents.episodeRemoved);
                        }, 500);

                        episodeElem.addEventListener('mouseover', () => {
                            episodeElem.classList.remove('remove');
                            clearTimeout(tm);
                        }, { once: true });
                    });
                    // forcefully trigger 'mouseleave' if mouse already leaved episode before the event was added
                    if (episodeElem.dataset.mouseleaved) episodeElem.dispatchEvent(new Event('mouseleave'));
                    break;
                }

                default:
            }
        });

        await nav.navigate(nav.places.showList);
    }

    init()
        .catch(e => console.error(e));
}, {
    capture: true,
    passive: true,
    once: true,
});
