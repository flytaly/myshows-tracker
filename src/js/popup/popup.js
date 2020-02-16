import UILang from './ui-language.js';
import types from '../types.js';
import templates from './templates.js';
import storage from '../storage.js';
import ShowList from './components/show-list.js';
import ShowEpisodes from './components/show-episodes.js';
import ShowCalendar from './components/show-calendar.js';
import getOptions from './options.js';
import { toggleClassOnClick } from './toggle-class.js';
import { getTitleOptions } from './utils.js';

const runExtension = async () => {
    const options = await getOptions();
    const dateLocale = options.dateLocale ? options.dateLocale : UILang;

    // If browser's standard size is 16px then +2 diff means 12px, -2 means 8px ...
    if (options.fSizeDiff) document.documentElement.style.fontSize = `${(100 / 16) * (10 + Number(options.fSizeDiff))}%`;
    const getElem = document.getElementById.bind(document);
    const mainView = getElem('main-view');
    const episodeView = getElem('episode-view');
    const backBtn = getElem('back-btn');
    const showContainer = mainView.querySelector('.show-container');
    const calendarContainer = mainView.querySelector('.calendar-container');
    const logoLink = document.querySelector('.logo > a');

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

    function renderShowList(shows, nav, showWithOpenedMenu) {
        const showList = new ShowList(nav, options, dateLocale);
        showList.setRows(shows, showWithOpenedMenu);
        return showList;
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

                    const showsWithEp = shows ? shows.filter((show) => show.unwatchedEpisodes) : null;

                    if (!showsWithEp || !showsWithEp.length) {
                        showContainer.appendChild(templates.blankPage.cloneNode(true));
                    } else {
                        showContainer.appendChild(renderShowList(showsWithEp, nav, params.showWithOpenedMenu));
                    }
                    break;
                }

                case this.places.upcomingList: {
                    this.places.current = location;
                    const upcomingEpisodes = await storage.getUpcomingEpisodes();

                    toggleHidden(
                        [episodeView, backBtn, showContainer],
                        [mainView, calendarContainer],
                    );

                    calendarContainer.innerHTML = '';

                    if (!upcomingEpisodes || !upcomingEpisodes.length) {
                        calendarContainer.appendChild(templates.blankPage.cloneNode(true));
                    } else {
                        calendarContainer.appendChild(
                            new ShowCalendar({
                                upcomingEpisodes, showsInfo, titleOptions, dateLocale,
                            }),
                        );
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

                    container.append(new ShowEpisodes({
                        episodes, options, dateLocale, bgScriptPort,
                    }));
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
        toggleClassOnClick(loginName, menu);
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
        .catch((e) => console.error(e));
};

runExtension();
