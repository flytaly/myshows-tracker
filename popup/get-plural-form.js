import UILang from './ui-language';

/** Get plural forms based on given number. The functions uses Intl.PluralRules API if it available,
 *  and currently supports only russian and english languages. */
export default function getPluralForm(i18nMessageName, number) {
    if (Intl.PluralRules) {
        const rules = new Intl.PluralRules(UILang === 'ru' ? UILang : 'en');
        return browser.i18n.getMessage(`${i18nMessageName}_${rules.select(number)}`, number);
    }
    let rule;

    if (UILang === 'ru') {
        // 0, 5..20... - many (дней); 1, 21, 31... - one (день); 2, 3, 4, 22, 23... - few (дня)
        const l2 = Number(number.toString().slice(-2)); // 2 last digits
        const l1 = Number(number.toString().slice(-1)); // 1 last digit
        rule = 'many';
        if (l1 === 1 && l2 !== 11) {
            rule = 'one';
        } else if (l1 > 1 && l1 < 5 && (l2 > 20 || l2 < 10)) {
            rule = 'few';
        }
    } else {
        rule = number === 1 ? 'one' : 'other';
    }
    return browser.i18n.getMessage(`${i18nMessageName}_${rule}`, number);
}
