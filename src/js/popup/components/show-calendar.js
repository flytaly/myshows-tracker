/* eslint-disable no-param-reassign */
import templates from '../templates.js';
import { getPluralForm } from '../utils.js';

export default class ShowCalendar extends HTMLElement {
    constructor({
        upcomingEpisodes, showsInfo, titleOptions, dateLocale,
    }) {
        super();
        this.upcomingEpisodes = upcomingEpisodes;
        this.showsInfo = showsInfo;
        this.titleOptions = titleOptions;
        this.dateLocale = dateLocale;
        this.generateCalendar();
    }

    generateCalendar() {
        // TODO: show shows that will air today on top of the list in different category

        // group episodes by month, episodes have to be sorted in time order beforehand
        const groupByMonth = this.upcomingEpisodes.reduce((acc, ep) => {
            const date = new Date(ep.airDateUTC);
            const [month, year] = [date.getMonth(), date.getFullYear()];
            const last = acc[acc.length - 1];
            if (!last || last.month !== month || last.year !== year) {
                acc.push({
                    month,
                    year,
                    episodes: [ep],
                    monthName: date.toLocaleDateString(this.dateLocale, { month: 'long' }),
                });
            } else {
                last.episodes.push(ep);
            }
            return acc;
        }, []);

        const currentYear = new Date().getFullYear();

        const months = groupByMonth.map(({ monthName, year, episodes }) => {
            const calendarElem = templates.calendar.cloneNode(true);
            const name = calendarElem.querySelector('.month-name');
            const totalNumber = calendarElem.querySelector('.month-total');
            const calendarList = calendarElem.querySelector('.calendar');
            name.textContent = `${monthName} ${year === currentYear ? '' : year}`;
            totalNumber.textContent = getPluralForm('episodesNumber', episodes.length); // `${episodes.length} episodes`
            calendarList.append(...episodes.map((ep) => this.renderCalendarRow(ep)));
            return calendarElem;
        });
        this.append(...months);
    }

    renderCalendarRow({
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
        dateElems[1].textContent = airDate.toLocaleDateString(this.dateLocale, { weekday: 'short' });
        dateElem.title = airDate.toLocaleString(this.dateLocale);

        showTitle.href = `https://myshows.me/view/${showId}/`;
        showTitle.title = (this.titleOptions.showTwoTitles && this.titleOptions.title2 !== 'original') ? this.showsInfo[showId].title : this.showsInfo[showId].titleOriginal;
        showTitle.textContent = this.titleOptions.title1 === 'original' ? this.showsInfo[showId].titleOriginal : this.showsInfo[showId].title;

        epNumber.textContent = shortName;

        epTitle.textContent = title;
        epTitle.title = title;
        epTitle.href = `https://myshows.me/view/episode/${id}/`;

        const countDays = Math.ceil((airDate - now) / 1000 / 60 / 60 / 24);
        daysLeftElems[0].textContent = countDays.toString();
        daysLeftElems[1].textContent = getPluralForm('daysNumber', countDays);
        daysLeftElem.title = airDate.toLocaleString(this.dateLocale);

        return calendarRowElem;
    }
}

window.customElements.define('show-calendar', ShowCalendar);
