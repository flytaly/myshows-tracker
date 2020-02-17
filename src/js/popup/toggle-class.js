/**
 * Toggle class on toggleTarget. Remove after click anywhere outside
 * @param {HTMLElement} button
 * @param {HTMLElement} toggleTarget
 * @param {string} className
 */
export const toggleClassOnClick = (button, toggleTarget, className = 'open') => {
    const cb = (event) => {
        if (event.target !== button) {
            if (toggleTarget.classList.contains(className)) {
                toggleTarget.classList.remove(className);
                window.removeEventListener('click', cb);
            }
        }
    };
    button.addEventListener('click', () => {
        if (toggleTarget.classList.contains(className)) {
            toggleTarget.classList.remove(className);
            window.removeEventListener('click', cb);
        } else {
            window.addEventListener('click', cb);
            toggleTarget.classList.add(className);
        }
    });
};
