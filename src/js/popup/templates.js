import { translateElement } from '../l10n.js';

const translateTemplate = ({ content }) => { translateElement(content); return content; };

const getElem = document.getElementById.bind(document);

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

export default templates;