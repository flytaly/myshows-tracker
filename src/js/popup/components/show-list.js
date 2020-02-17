import templates from '../templates.js';
import ExternalSearchList from './external-search-list.js';
import { getTitleOptions } from '../utils.js';
import { toggleClassOnClick } from '../toggle-class.js';

const elementName = 'show-list';
export default class ShowList extends HTMLUListElement {
    constructor(nav, options, dateLocale) {
        super();
        this.nav = nav;
        this.options = options;
        this.dateLocale = dateLocale;
        this.titleOptions = getTitleOptions(options);
        this.setAttribute('is', elementName);
    }

    setRows(shows, showWithOpenedMenu) {
        const clickHandler = (e) => {
            const { id } = e.currentTarget.dataset;
            e.preventDefault();
            this.nav.navigate(this.nav.places.episodeList, { id });
        };

        if (this.options.showsWithNewEpAtTop) {
            shows.sort((s1, s2) => Date.parse(s2.latestEpisode.airDateUTC) - Date.parse(s1.latestEpisode.airDateUTC));
        }
        this.append(...shows
            .map((show) => {
                const openMenu = showWithOpenedMenu && (Number(show.show.id) === Number(showWithOpenedMenu));
                return this.renderShowRow(show, clickHandler, openMenu);
            }));
    }

    renderShowRow(showRecord, onClick, withOpenedMenu = false) {
        const { unwatchedEpisodes, show, nextEpisode } = showRecord;
        const listElem = templates.showRow.cloneNode(true);
        const titleLink = listElem.querySelector('.show-title a');
        const showTitle1 = titleLink.querySelector('.show-title-1');
        const showTitle2 = titleLink.querySelector('.show-title-2');
        const nextEpisodeElem = titleLink.querySelector('.next-episode');
        const nextEpisodeDateElem = titleLink.querySelector('.next-episode-date');
        const unwatchedElem = listElem.querySelector('.unwatched-ep');

        const externalBlock = listElem.querySelector('.external-block');
        const externalButton = listElem.querySelector('button');
        let externalLinks = [];
        try {
            externalLinks = JSON.parse(this.options.externalLinks);
        } catch (e) {
            externalLinks = [];
        }
        const externalSearchList = new ExternalSearchList(show.titleOriginal, externalLinks);
        toggleClassOnClick(externalButton, externalBlock);
        externalBlock.appendChild(externalSearchList);
        if (withOpenedMenu) { externalBlock.classList.add('open'); }

        titleLink.dataset.id = show.id;
        titleLink.title = show.titleOriginal;
        titleLink.href = `https://myshows.me/view/${show.id}/`;

        const { showTwoTitles, title1, title2 } = this.titleOptions;
        showTitle1.textContent = title1 === 'original' ? show.titleOriginal : show.title;
        if (showTwoTitles) {
            showTitle2.textContent = title2 === 'original' ? show.titleOriginal : show.title;
        }
        nextEpisodeElem.textContent = nextEpisode.shortName;
        const date = nextEpisode.airDateUTC ? new Date(nextEpisode.airDateUTC) : null;
        if (date) {
            nextEpisodeDateElem.textContent = `(${date.toLocaleDateString(this.dateLocale)})`;
            nextEpisodeDateElem.title = date.toLocaleString(this.dateLocale);
        }
        if (this.options.alwaysShowNextEpisode) {
            nextEpisodeElem.classList.add('no-hide');
            nextEpisodeDateElem.classList.add('no-hide');
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
}

window.customElements.define(elementName, ShowList, { extends: 'ul' });
