/* eslint-disable no-param-reassign */
import templates from '../templates.js';
import { getPluralForm, getBaseUrl } from '../utils.js';
import types from '../../types.js';

export default class ShowEpisodes extends HTMLElement {
    constructor({ episodes, options, dateLocale, bgScriptPort, forceEnglishVersion }) {
        super();
        this.episodes = episodes;
        this.options = options;
        this.dateLocale = dateLocale;
        this.bgScriptPort = bgScriptPort;
        this.forceEnglishVersion = forceEnglishVersion;
        this.setSeasonsBlocks();
    }

    setSeasonsBlocks() {
        const order = this.options.episodesSortOrder === 'firstNew' ? 'firstNew' : 'firstOld';

        const groupCb = (acc, ep) => {
            const { seasonNumber: N } = ep;
            acc[N] ? acc[N].push(ep) : (acc[N] = [ep]); // eslint-disable-line no-unused-expressions
            return acc;
        };

        const groupedBySeasons =
            order === 'firstNew' ? this.episodes.reduce(groupCb, {}) : this.episodes.reduceRight(groupCb, {});

        const getSortOrderFunc = () => (order === 'firstNew' ? (a, b) => b - a : (a, b) => a - b);

        const blocks = Object.keys(groupedBySeasons)
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

                if ((order === 'firstNew' && idx < seasons.length - 1) || (order === 'firstOld' && idx !== 0)) {
                    episodeList.hidden = true;
                } else {
                    seasonHeader.classList.add('expanded');
                }

                const seasonEps = groupedBySeasons[season];
                episodeList.append(...seasonEps.map((ep) => this.renderEpisodeRow(ep)));
                return seasonBlock;
            });

        this.append(...blocks);
    }

    renderEpisodeRow({ id, title, shortName, airDateUTC, airDate, commentsCount, showId, seasonNumber }) {
        const ep = templates.episodeRow.cloneNode(true);
        const link = ep.querySelector('.ep-title a');
        const epListElem = ep.querySelector('.episode-row');
        const epNumber = ep.querySelector('.ep-number');
        const epDate = ep.querySelector('.ep-date');
        const epComments = ep.querySelector('.ep-comments a');
        const epRatingBlock = ep.querySelector('.rating-block');
        const date = airDateUTC || airDate ? new Date(airDateUTC || airDate) : null;
        epListElem.dataset.id = id;
        epListElem.dataset.season = seasonNumber;
        link.href = `${getBaseUrl(this.forceEnglishVersion)}/view/episode/${id}/`;
        link.title = title;
        link.textContent = title;
        epNumber.textContent = shortName;
        this.handleRatingClicks(epRatingBlock, id, showId, epListElem);
        if (date) {
            epDate.textContent = date.toLocaleDateString(this.dateLocale);
            epDate.title = date.toLocaleString(this.dateLocale);
        }

        if (commentsCount) {
            ep.querySelector('.ep-comments').hidden = false;
            epComments.textContent = commentsCount;
            epComments.href = `${getBaseUrl(this.forceEnglishVersion)}/view/episode/${id}/#comments`;
        }

        return ep;
    }

    handleRatingClicks(ratingBlock, episodeId, showId, epListElem) {
        const ratingElems = ratingBlock.querySelectorAll('a.rating-star, a.ep-check');
        const handler = async (e) => {
            const rateElem = e.target.closest('a.rating-star, a.ep-check');
            const CHECKED = 'checked';
            e.preventDefault();

            if (rateElem) {
                const listElem = rateElem.closest('li');
                const { rating } = rateElem.dataset;

                this.bgScriptPort.postMessage({ type: types.RATE_EPISODE, payload: { episodeId, rating, showId } });
                listElem.classList.add(CHECKED);
                ratingElems.forEach((el) => {
                    if (el.dataset.rating <= rating) {
                        el.classList.add(CHECKED);
                        return;
                    }
                    el.classList.remove(CHECKED);
                });
                epListElem.addEventListener('mouseleave', () => {
                    epListElem.dataset.mouseleaved = 'true';
                });
                epListElem.addEventListener('mouseenter', () => {
                    epListElem.dataset.mouseleaved = '';
                });
            }
        };

        ratingBlock.addEventListener('click', handler);
    }
}

window.customElements.define('show-episodes', ShowEpisodes);
