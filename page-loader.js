(() => {
    'use strict';

    const root = document.documentElement;
    root.classList.add('is-loading');

    function waitForImage (image) {
        return new Promise(resolve => {
            let settled = false;

            async function finish () {
                if (settled) return;
                settled = true;
                image.removeEventListener('load', finish);
                image.removeEventListener('error', finish);

                if (image.naturalWidth && typeof image.decode === 'function') {
                    try {
                        await image.decode();
                    } catch {
                        // A failed image must not prevent the page from opening.
                    }
                }
                resolve();
            }

            image.addEventListener('load', finish);
            image.addEventListener('error', finish);
            // Images below the fold must load without waiting for a scroll.
            image.loading = 'eager';
            if (image.complete) finish();
        });
    }

    // Deferred preview selection runs before DOMContentLoaded.
    document.addEventListener('DOMContentLoaded', async () => {
        const content = Array.from(document.querySelectorAll('body > header, body > main, body > footer'));
        content.forEach(element => { element.inert = true; });

        await Promise.all(Array.from(document.images, waitForImage));

        root.classList.remove('is-loading');
        content.forEach(element => { element.inert = false; });
        document.querySelector('.page-loader').remove();
    }, { once: true });
})();
