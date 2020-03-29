if (TARGET === 'chrome') {
    // chrome doesn't open links by default
    window.addEventListener('click', (e) => {
        const aElem = e.target.closest('a');
        if (aElem && aElem.href) {
            browser.tabs.create({ url: aElem.href });
        }
    });
}
