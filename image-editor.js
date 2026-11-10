(() => {
    'use strict';

    // Dimensions of the originals; previews keep the same aspect ratio.
    const imageSizes = [
        [2560, 1707], [1707, 2560], [4480, 6720], [4399, 6598],
        [4480, 6720], [4480, 6720], [4480, 6720], [4480, 6720],
        [4480, 6720], [4480, 6720], [4480, 6720], [4480, 6720],
        [4480, 6720], [1707, 2560], [1707, 2560], [1707, 2560],
        [4480, 6720],
    ];
    const availableImages = imageSizes.map((size, index) => ({
        file: `assets/images_person/${index + 1}.jpg`,
        label: `Фото ${index + 1} · ${index + 1}.jpg`,
        size,
    }));
    const page = document.body.dataset.editorPage;
    const previewWidths = [50, 100, 200, 400, 800, 1600];
    const controls = document.getElementById('image-controls');
    const status = document.getElementById('editor-status');
    const fileInput = document.getElementById('import-file');
    const adjustments = [
        { key: 'x', label: 'X, %', min: -100, max: 100, step: 'any' },
        { key: 'y', label: 'Y, %', min: -100, max: 100, step: 'any' },
        { key: 'scale', label: 'Масштаб, %', min: 10, max: 500, step: 'any' },
    ];

    function showStatus (message, isError = false) {
        status.textContent = message;
        status.dataset.error = String(isError);
    }

    const slots = Array.from(document.querySelectorAll('main img[data-image-id]'), image => {
        const initial = { file: image.getAttribute('src'), x: 0, y: 0, scale: 100 };
        return {
            id: image.dataset.imageId,
            label: image.dataset.imageLabel,
            image,
            frame: image.parentElement,
            originalAlt: image.alt,
            originalSize: [Number(image.getAttribute('width')), Number(image.getAttribute('height'))],
            originalPosition: window.getComputedStyle(image).objectPosition.split(/\s+/).map(value => parseFloat(value) / 100),
            initial,
            value: { ...initial },
            inputs: {},
        };
    });

    function getImageSize (slot) {
        return availableImages.find(image => image.file === slot.value.file)?.size || slot.originalSize;
    }

    function applyImageGeometry (slot) {
        const [sourceWidth, sourceHeight] = getImageSize(slot);
        const frameWidth = slot.frame.clientWidth;
        const frameHeight = slot.frame.clientHeight;
        if (!sourceWidth || !sourceHeight || !frameWidth || !frameHeight) return;

        const fit = Math.max(frameWidth / sourceWidth, frameHeight / sourceHeight);
        const width = sourceWidth * fit;
        const height = sourceHeight * fit;
        const [positionX, positionY] = slot.originalPosition;
        const zoom = slot.value.scale / 100;
        const left = (frameWidth - width) * positionX;
        const top = (frameHeight - height) * positionY;

        // Size the entire photo before the frame clips it. Keep zoom centred on
        // the frame and measure X/Y against the frame, not the photo's dimensions.
        slot.image.style.width = `${width * zoom}px`;
        slot.image.style.height = `${height * zoom}px`;
        slot.image.style.left = `${frameWidth / 2 + (left - frameWidth / 2) * zoom + frameWidth * slot.value.x / 100}px`;
        slot.image.style.top = `${frameHeight / 2 + (top - frameHeight / 2) * zoom + frameHeight * slot.value.y / 100}px`;
        slot.image.style.transform = 'none';
    }

    function createScreenPreview (slot) {
        const picture = document.createElement('picture');
        const source = document.createElement('source');
        // A screen-only source lets printing use the untouched original img.src.
        source.media = 'screen';
        slot.image.replaceWith(picture);
        picture.append(source, slot.image);

        return () => {
            const [width, height] = getImageSize(slot);
            if (!width || !height) {
                source.removeAttribute('srcset');
                return;
            }

            const fittedWidth = Math.max(slot.frame.clientWidth, slot.frame.clientHeight * width / height);
            const requiredWidth = fittedWidth * slot.value.scale / 100 * (window.devicePixelRatio || 1);
            const previewWidth = previewWidths.find(candidate => candidate >= requiredWidth && candidate < width);
            const file = previewWidth
                ? slot.value.file.replace(/\/([^/]+)\.(?:jpe?g|png)$/i, `/previews/$1-${previewWidth}.png`)
                : slot.value.file;
            // Pick explicitly so zooming back out cannot reuse an oversized cached JPEG.
            if (source.srcset !== file) source.srcset = file;
        };
    }

    function applySlot (slot) {
        const { file } = slot.value;
        slot.image.src = file;
        slot.image.alt = file === slot.initial.file
            ? slot.originalAlt
            : `${slot.label}: ${availableImages.find(image => image.file === file).label}`;
        applyImageGeometry(slot);
        slot.updatePreview?.();
        slot.select.value = file;
        adjustments.forEach(({ key }) => { slot.inputs[key].value = slot.value[key]; });
    }

    slots.forEach(slot => {
        const group = document.createElement('fieldset');
        group.className = 'image-control';
        const legend = document.createElement('legend');
        legend.textContent = slot.label;
        const label = document.createElement('label');
        label.htmlFor = `image-${slot.id}`;
        label.textContent = 'Фотография';
        const select = document.createElement('select');
        select.id = label.htmlFor;
        [{ file: slot.initial.file, label: 'Исходная фотография' }, ...availableImages].forEach(image => {
            const option = document.createElement('option');
            option.value = image.file;
            option.textContent = image.label;
            select.append(option);
        });
        slot.select = select;
        const fields = document.createElement('div');
        fields.className = 'image-adjustments';

        adjustments.forEach(({ key, label: title, min, max, step }) => {
            const fieldLabel = document.createElement('label');
            fieldLabel.textContent = title;
            const input = document.createElement('input');
            input.type = 'number';
            input.min = min;
            input.max = max;
            input.step = step;
            input.value = slot.value[key];
            input.setAttribute('aria-label', `${slot.label}: ${title}`);
            slot.inputs[key] = input;
            input.addEventListener('input', () => {
                if (input.value === '' || !input.validity.valid) return;
                slot.value[key] = Number(input.value);
                applyImageGeometry(slot);
                if (key === 'scale') slot.updatePreview?.();
                showStatus('');
            });
            input.addEventListener('change', () => {
                if (input.value === '' || !input.validity.valid) {
                    input.value = slot.value[key];
                    showStatus(`${slot.label}: ${title} — от ${min} до ${max}.`, true);
                }
            });
            fieldLabel.append(input);
            fields.append(fieldLabel);
        });

        select.addEventListener('change', () => {
            slot.value = { file: select.value, x: 0, y: 0, scale: 100 };
            applySlot(slot);
            showStatus('');
        });
        slot.image.addEventListener('error', () => {
            showStatus(`Не удалось загрузить изображение: ${slot.value.file}`, true);
        });
        group.append(legend, label, select, fields);
        controls.append(group);
        slot.updatePreview = createScreenPreview(slot);
        applySlot(slot);
    });

    function updateAllSlots () {
        slots.forEach(slot => {
            applyImageGeometry(slot);
            slot.updatePreview?.();
        });
    }

    window.addEventListener('resize', updateAllSlots);
    window.addEventListener('beforeprint', updateAllSlots);
    window.addEventListener('afterprint', updateAllSlots);

    // Responsive frames can also resize when their container changes, or when
    // print styles are applied without a window resize event.
    if (typeof ResizeObserver !== 'undefined') {
        const slotsByFrame = new Map(slots.map(slot => [slot.frame, slot]));
        const observer = new ResizeObserver(entries => entries.forEach(({ target }) => {
            const slot = slotsByFrame.get(target);
            applyImageGeometry(slot);
            slot.updatePreview?.();
        }));
        slots.forEach(slot => observer.observe(slot.frame));
    }

    document.getElementById('reset-images').addEventListener('click', () => {
        slots.forEach(slot => {
            slot.value = { ...slot.initial };
            applySlot(slot);
        });
        showStatus('Все изображения и настройки сброшены.');
    });

    document.getElementById('export-images').addEventListener('click', () => {
        const settings = {
            version: 1,
            page,
            images: slots.map(slot => ({ id: slot.id, ...slot.value })),
        };
        const blob = new Blob([JSON.stringify(settings, null, 2) + '\n'], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${page}-images.json`;
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showStatus('Настройки экспортированы в JSON.');
    });

    function parseSettings (text) {
        let settings;
        try {
            settings = JSON.parse(text.replace(/^\uFEFF/, ''));
        } catch {
            throw new Error('Файл содержит некорректный JSON.');
        }
        if (!settings || typeof settings !== 'object' || settings.version !== 1) {
            throw new Error('Неизвестный формат настроек. Требуется version: 1.');
        }
        if (settings.page !== page) {
            throw new Error('Эти настройки предназначены для другой версии страницы.');
        }
        // Keep settings exported before the single story photo became three cards.
        const addedStorySlots = slots.filter(slot => ['story-2', 'story-3'].includes(slot.id));
        if (page === 'index' && addedStorySlots.length === 2 && Array.isArray(settings.images)
            && settings.images.length === slots.length - 2
            && addedStorySlots.every(slot => !settings.images.some(image => image && image.id === slot.id))) {
            settings.images.push(...addedStorySlots.map(slot => ({ id: slot.id, ...slot.initial })));
        }
        if (!Array.isArray(settings.images) || settings.images.length !== slots.length) {
            throw new Error(`В JSON должно быть ${slots.length} изображений.`);
        }

        const seenIds = new Set();
        return slots.map(slot => {
            const entry = settings.images.find(image => image && image.id === slot.id);
            if (!entry || seenIds.has(entry.id) || settings.images.filter(image => image && image.id === slot.id).length !== 1) {
                throw new Error(`Неверная или повторяющаяся позиция: ${slot.id}.`);
            }
            seenIds.add(entry.id);
            const allowedFiles = [slot.initial.file, ...availableImages.map(image => image.file)];
            if (!allowedFiles.includes(entry.file)) {
                throw new Error(`${slot.label}: выберите файл из доступного списка изображений.`);
            }
            adjustments.forEach(({ key, label, min, max }) => {
                if (typeof entry[key] !== 'number' || !Number.isFinite(entry[key]) || entry[key] < min || entry[key] > max) {
                    throw new Error(`${slot.label}: ${label} должно быть числом от ${min} до ${max}.`);
                }
            });
            return { file: entry.file, x: entry.x, y: entry.y, scale: entry.scale };
        });
    }

    document.getElementById('import-images').addEventListener('click', () => {
        fileInput.value = '';
        fileInput.click();
    });

    fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0];
        if (!file) return;
        try {
            if (file.size > 1024 * 1024) throw new Error('Файл настроек слишком большой (максимум 1 МБ).');
            const values = parseSettings(await file.text());
            slots.forEach((slot, index) => {
                slot.value = values[index];
                applySlot(slot);
            });
            showStatus(`Настройки загружены: ${file.name}`);
        } catch (error) {
            showStatus(error.message || 'Не удалось прочитать файл настроек.', true);
        }
    });
})();
