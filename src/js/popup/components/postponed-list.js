import templates from '../templates.js';
import { getPluralForm } from '../utils.js';

export default class PostponedList extends HTMLElement {
    constructor({ laterShows, titleOptions }) {
        super();
        this.laterShows = laterShows;
        this.titleOptions = titleOptions;

        this.container = templates.postponed.cloneNode(true);
        const showCountElem = this.container.querySelector('h2 .show-count');
        showCountElem.textContent = getPluralForm('showsNumber', this.laterShows.length);
        this.composeList();

        this.appendChild(this.container);
    }

    composeList() {
        const ul = this.container.querySelector('ul');
        const rows = this.laterShows.map((showEntry) => {
            const { show, watchedEpisodes, totalEpisodes } = showEntry;
            const li = templates.postponedRow.cloneNode(true).querySelector('li');
            const link = li.querySelector('a');
            const showTitle1 = li.querySelector('.title-1');
            const showTitle2 = li.querySelector('.title-2');
            const epCountElem = li.querySelector('.postponed-episodes-count');


            link.href = `https://myshows.me/view/${show.id}/`;
            const { showTwoTitles, title1, title2 } = this.titleOptions;
            showTitle1.textContent = title1 === 'original' ? show.titleOriginal : show.title;
            if (showTwoTitles) {
                showTitle2.textContent = title2 === 'original' ? show.titleOriginal : show.title;
            }
            epCountElem.textContent = `${watchedEpisodes} / ${totalEpisodes}`;

            return li;
        });

        ul.append(...rows);
    }
}

window.customElements.define('postponed-list', PostponedList);
