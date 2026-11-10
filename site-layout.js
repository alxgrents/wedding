(() => {
    'use strict';

    const masthead = document.querySelector('.masthead');

    function updateHeaderHeight () {
        const height = Math.ceil(masthead.getBoundingClientRect().height);
        document.documentElement.style.setProperty('--masthead-height', `${height}px`);
    }

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    window.addEventListener('orientationchange', updateHeaderHeight);
    window.addEventListener('pageshow', updateHeaderHeight);
    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(updateHeaderHeight).observe(masthead);
    }
})();
