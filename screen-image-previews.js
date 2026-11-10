(() => {
    'use strict';

    // Match the editor: use Lanczos PNG previews on screen and originals in print.
    const previewWidths = [50, 100, 200, 400, 800, 1600];
    const pictures = Array.from(document.querySelectorAll('picture.screen-preview'));

    function updatePreview (picture) {
        const image = picture.querySelector('img');
        const source = picture.querySelector('source');
        const width = Number(image.getAttribute('width'));
        const height = Number(image.getAttribute('height'));
        if (!width || !height || !image.clientWidth || !image.clientHeight) return;

        const fittedWidth = Math.max(image.clientWidth, image.clientHeight * width / height);
        const requiredWidth = fittedWidth * (window.devicePixelRatio || 1);
        const previewWidth = previewWidths.find(candidate => candidate >= requiredWidth && candidate < width);
        const original = image.getAttribute('src');
        const file = previewWidth
            ? original.replace(/\/([^/]+)\.(?:jpe?g|png)$/i, `/previews/$1-${previewWidth}.png`)
            : original;
        if (source.srcset !== file) source.srcset = file;
    }

    function updateAllPreviews () {
        pictures.forEach(updatePreview);
    }

    updateAllPreviews();
    window.addEventListener('resize', updateAllPreviews);
    window.addEventListener('beforeprint', updateAllPreviews);
    window.addEventListener('afterprint', updateAllPreviews);

    if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(entries => {
            entries.forEach(({ target }) => updatePreview(target.closest('picture')));
        });
        pictures.forEach(picture => observer.observe(picture.querySelector('img')));
    }
})();
