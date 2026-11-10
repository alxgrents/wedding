(() => {
    'use strict';

    const toggle = document.querySelector('.map-toggle');
    if (!toggle) return;
    const map = document.getElementById(toggle.getAttribute('aria-controls'));
    if (!map) return;

    toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') !== 'true';
        toggle.setAttribute('aria-expanded', String(expanded));
        map.hidden = !expanded;
    });
})();
