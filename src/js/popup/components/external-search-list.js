import templates from '../templates.js';

export default class ExternalSearchList extends HTMLUListElement {
    constructor(showTitle = '', externalLinks = []) {
        super();

        let externalLinksElements = [];

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

        this.setAttribute('is', 'external-search-list');
        this.append(...externalLinksElements);
    }
}

window.customElements.define('external-search-list', ExternalSearchList, { extends: 'ul' });
