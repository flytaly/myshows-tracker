/* eslint-disable no-param-reassign */
import templates from '../templates.js';
import { getPluralForm, getBaseUrl } from '../utils.js';

export default class ShowCalendar extends HTMLElement {
    constructor({ upcomingEpisodes, showsInfo, titleOptions, dateLocale, forceEnglishVersion }) {
        super();
        this.upcomingEpisodes = upcomingEpisodes;
        this.showsInfo = showsInfo;
        this.titleOptions = titleOptions;
        this.dateLocale = dateLocale;
        this.forceEnglishVersion = forceEnglishVersion;
        this.generateCalendar();
    }

    static groupEpisodesWithTheSameDate(episodes) {
        const result = [];
        let lastStack = [];
        let prevEpDate = null;
        let prevShowId = null;

        episodes.forEach((episode) => {
            const currentEpDate = new Date(episode.airDateUTC || episode.airDate);
            const { showId } = episode;

            if (prevShowId === showId && prevEpDate && +prevEpDate === +currentEpDate) {
                lastStack.push(episode);
            } else {
                if (lastStack.length) result.push(lastStack);
                lastStack = [episode];
            }

            prevEpDate = currentEpDate;
            prevShowId = showId;
        });
        if (lastStack.length) result.push(lastStack);

        return result;
    }

    generateCalendar() {
        const now = new Date();

        // -1 month means today
        const getMonthGroup = (date) => {
            const midnight = new Date(now);
            midnight.setHours(24, 0, 0, 0);
            return midnight > date ? -1 : date.getMonth();
        };

        /**
         * Group episodes by months. Episodes have to be sorted in time order beforehand.
         * Today episodes are grouped into "Today" category.
         * */
        const groupByMonth = this.upcomingEpisodes.reduce((acc, ep) => {
            const date = new Date(ep.airDateUTC || ep.airDate);
            const [month, year] = [getMonthGroup(date), date.getFullYear()];
            const last = acc[acc.length - 1];
            if (!last || last.month !== month || last.year !== year) {
                acc.push({
                    month,
                    year,
                    episodes: [ep],
                    groupName:
                        month < 0
                            ? browser.i18n.getMessage('calendar_today')
                            : date.toLocaleDateString(this.dateLocale, { month: 'long' }),
                });
            } else {
                last.episodes.push(ep);
            }
            return acc;
        }, []);

        const currentYear = new Date().getFullYear();

        const months = groupByMonth.map(({ groupName, year, episodes }) => {
            const calendarElem = templates.calendar.cloneNode(true);
            const name = calendarElem.querySelector('.month-name');
            const totalNumber = calendarElem.querySelector('.month-total');
            const calendarList = calendarElem.querySelector('.calendar');
            name.textContent = `${groupName} ${year === currentYear ? '' : year}`;
            totalNumber.textContent = getPluralForm('episodesNumber', episodes.length); // `${episodes.length} episodes`
            const episodeBatches = ShowCalendar.groupEpisodesWithTheSameDate(episodes);
            calendarList.append(...episodeBatches.map((batch) => this.renderCalendarRow(batch)));
            return calendarElem;
        });

        this.append(...months);
    }

    renderCalendarRow(episodeBatch) {
        if (episodeBatch.length === 0) return null;
        const isMany = episodeBatch.length > 1;
        const firstEpisode = episodeBatch[0];
        const { showId, airDateUTC, airDate: aDate } = firstEpisode;
        const airDate = new Date(airDateUTC || aDate);
        const now = new Date();

        const calendarRowElem = templates.calendarRow.cloneNode(true);
        const liElem = calendarRowElem.querySelector('li');
        const dateElem = calendarRowElem.querySelector('.calendar-date');
        const dateElems = dateElem.querySelectorAll('span');
        const showTitle = calendarRowElem.querySelector('.calendar-show-title a');
        const epNumber = calendarRowElem.querySelector('.calendar-ep-number');
        const epTitle = calendarRowElem.querySelector('.calendar-ep-title a');
        const daysLeftElem = calendarRowElem.querySelector('.calendar-days-left');
        const daysLeftElems = daysLeftElem.querySelectorAll('span');
        const episodeListElem = calendarRowElem.querySelector('.calendar-episodes-batch ul');

        dateElems[0].textContent = airDate.getDate().toString();
        dateElems[1].textContent = airDate.toLocaleDateString(this.dateLocale, { weekday: 'short' });
        dateElem.title = airDate.toLocaleString(this.dateLocale);

        showTitle.href = `${getBaseUrl(this.forceEnglishVersion)}/view/${showId}/`;
        showTitle.title =
            this.titleOptions.showTwoTitles && this.titleOptions.title2 !== 'original'
                ? this.showsInfo[showId].title
                : this.showsInfo[showId].titleOriginal;
        showTitle.textContent =
            this.titleOptions.title1 === 'original'
                ? this.showsInfo[showId].titleOriginal
                : this.showsInfo[showId].title;

        if (!isMany) {
            this.renderEpisodeInfo(firstEpisode, calendarRowElem);
        } else {
            liElem.classList.add('expandable');
            liElem.addEventListener('click', () => {
                liElem.classList.toggle('expanded');
            });
            epNumber.textContent = `${episodeBatch[0].shortName} -  ${episodeBatch[episodeBatch.length - 1].shortName}`;
            epTitle.textContent = getPluralForm('episodesNumber', episodeBatch.length);
            epTitle.title = getPluralForm('episodesNumber', episodeBatch.length);
            epTitle.href = '#';
            episodeListElem.append(
                ...episodeBatch.map((ep) => {
                    const episodeRow = templates.calendarEpBatchRow.cloneNode(true);
                    this.renderEpisodeInfo(ep, episodeRow);
                    return episodeRow;
                }),
            );
        }

        const countHours = Math.ceil((airDate - now) / 1000 / 60 / 60);
        const countDays = Math.ceil(countHours / 24);
        if (countHours < 24) {
            daysLeftElems[0].textContent = countHours.toString();
            daysLeftElems[1].textContent = getPluralForm('hoursNumber', countHours);
        } else {
            daysLeftElems[0].textContent = countDays.toString();
            daysLeftElems[1].textContent = getPluralForm('daysNumber', countDays);
        }
        daysLeftElem.title = airDate.toLocaleString(this.dateLocale);

        return calendarRowElem;
    }

    renderEpisodeInfo(episode, template) {
        const epNumber = template.querySelector('.calendar-ep-number');
        const epTitle = template.querySelector('.calendar-ep-title a');
        const { id, title, shortName } = episode;
        epNumber.textContent = shortName;
        epTitle.textContent = title;
        epTitle.title = title;
        epTitle.href = `${getBaseUrl(this.forceEnglishVersion)}/view/episode/${id}/`;
    }
}

window.customElements.define('show-calendar', ShowCalendar);
