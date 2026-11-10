(() => {
  const settings = [
    ['page', 'Общий фон листа'],
    ['purple', 'Фиолетовая полоса и «и» в именах'],
    ['green', 'Зелёная диагональная полоса'],
    ['sage-panel', 'Фон приглашения и контакта Тани'],
    ['lilac-panel', 'Фон дресс-кода и края палитры'],
    ['browser-background', 'Фон страницы за листом A6'],
    ['transparent', 'Промежутки между полосами'],
    ['panel', 'Подложка программы дня и адреса'],
    ['soft-backing', 'Размытая подложка текста о цветах'],
    ['hero-backing', 'Размытая подложка имён и даты'],
    ['text', 'Основной текст'],
    ['photo-card', 'Белые рамки карточек животных'],
    ['shadow', 'Тени листа и фотокарточек'],
    ['palette-green-dark', 'Палитра: тёмный зелёный'],
    ['palette-green-medium', 'Палитра: средний зелёный'],
    ['palette-green-light', 'Палитра: светлый зелёный'],
    ['palette-purple-dark', 'Палитра: тёмный фиолетовый'],
    ['palette-purple-medium', 'Палитра: средний фиолетовый'],
    ['palette-purple-light', 'Палитра: светлый фиолетовый'],
  ];
  const root = document.documentElement;
  const values = {};
  const defaults = {};
  const syncControls = {};
  const controls = document.getElementById('color-controls');
  const probe = document.createElement('span');
  probe.hidden = true;
  document.body.append(probe);
  function parse(value) {
    probe.style.color = value;
    const parts = getComputedStyle(probe).color.match(/[\d.]+/g).map(Number);
    return {hex: '#' + parts.slice(0, 3).map(n => Math.round(n).toString(16).padStart(2, '0')).join(''), alpha: parts[3] ?? 1};
  }
  settings.forEach(([key, title], index) => {
    const variable = '--color-' + key;
    values[variable] = getComputedStyle(root).getPropertyValue(variable).trim();
    defaults[variable] = values[variable];
    const initial = parse(values[variable]);
    const row = document.createElement('div');
    row.className = 'color-control';
    const label = document.createElement('label');
    label.htmlFor = 'color-' + index;
    label.textContent = title;
    const picker = document.createElement('input');
    picker.type = 'color'; picker.id = label.htmlFor; picker.value = initial.hex;
    const text = document.createElement('input');
    text.type = 'text'; text.value = values[variable];
    text.setAttribute('aria-label', title + ': CSS-значение');
    const alphaLabel = document.createElement('label');
    alphaLabel.className = 'alpha-row';
    alphaLabel.append('Непрозрачность');
    const alpha = document.createElement('input');
    alpha.type = 'range'; alpha.min = 0; alpha.max = 100; alpha.step = 1; alpha.value = initial.alpha * 100;
    alpha.setAttribute('aria-label', title + ': непрозрачность');
    const output = document.createElement('output');
    function showAlpha() { output.value = alpha.value + '%'; }
    function apply(value) { values[variable] = value; root.style.setProperty(variable, value); }
    function fromPicker() {
      const rgb = picker.value.match(/[a-f\d]{2}/gi).map(n => parseInt(n, 16));
      const value = +alpha.value === 100 ? picker.value : `rgba(${rgb.join(', ')}, ${+alpha.value / 100})`;
      text.value = value; text.setCustomValidity(''); showAlpha(); apply(value);
    }
    picker.addEventListener('input', fromPicker);
    alpha.addEventListener('input', fromPicker);
    text.addEventListener('input', () => {
      const value = text.value.trim();
      if (!CSS.supports('color', value) || /var\(|currentcolor|inherit|initial|unset|revert/i.test(value)) {
        text.setCustomValidity('Введите цвет: #RRGGBB, #RRGGBBAA или rgba().'); return;
      }
      text.setCustomValidity('');
      const parsed = parse(value); picker.value = parsed.hex; alpha.value = parsed.alpha * 100;
      showAlpha(); apply(value);
    });
    syncControls[variable] = value => {
      const parsed = parse(value);
      picker.value = parsed.hex; alpha.value = parsed.alpha * 100;
      text.value = value; text.setCustomValidity(''); showAlpha(); apply(value);
    };
    showAlpha(); alphaLabel.append(alpha, output); row.append(label, picker, text, alphaLabel); controls.append(row);
  });

  const status = document.getElementById('copy-status');
  const storageKey = 'wedding-a6-2-palette-version';
  document.getElementById('save-palette').addEventListener('click', () => {
    let version;
    try {
      const previous = Number(localStorage.getItem(storageKey));
      version = (Number.isSafeInteger(previous) && previous >= 0 ? previous : 0) + 1;
      localStorage.setItem(storageKey, String(version));
    } catch {
      status.textContent = 'Не удалось сохранить версию в localStorage. Разрешите браузеру локальное хранение.';
      return;
    }
    const data = {version, colors: {...values}};
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'}));
    const link = document.createElement('a');
    link.href = url; link.download = `wedding-palette-v${version}.json`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    status.textContent = `Сохранена версия ${version}`;
  });
  document.getElementById('reset-palette').addEventListener('click', () => {
    Object.entries(defaults).forEach(([key, value]) => syncControls[key](value));
    status.textContent = 'Восстановлены исходные цвета страницы';
  });
  const dialog = document.getElementById('palette-dialog');
  const input = document.getElementById('palette-json');
  const error = document.getElementById('import-error');
  document.getElementById('import-palette').addEventListener('click', () => {
    error.textContent = ''; dialog.showModal(); input.focus();
  });
  document.getElementById('cancel-import').addEventListener('click', () => dialog.close());
  async function readFile(file) {
    if (!file) return;
    try { input.value = await file.text(); error.textContent = ''; }
    catch { error.textContent = 'Не удалось прочитать файл.'; }
  }
  document.getElementById('palette-file').addEventListener('change', event => readFile(event.target.files[0]));
  dialog.addEventListener('dragover', event => { event.preventDefault(); });
  dialog.addEventListener('drop', event => {
    event.preventDefault(); readFile(event.dataTransfer.files[0]);
  });
  document.getElementById('confirm-import').addEventListener('click', () => {
    try {
      const data = JSON.parse(input.value);
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Ожидается JSON-объект с цветами.');
      const colors = data.colors ?? data;
      if (!colors || typeof colors !== 'object' || Array.isArray(colors)) throw new Error('Поле colors должно содержать объект с цветами.');
      const entries = Object.entries(colors);
      if (!entries.length) throw new Error('В JSON нет цветов.');
      for (const [key, value] of entries) {
        if (!Object.hasOwn(defaults, key)) throw new Error(`Неизвестная настройка: ${key}`);
        if (typeof value !== 'string' || !CSS.supports('color', value) || /var\(|currentcolor|inherit|initial|unset|revert/i.test(value))
          throw new Error(`Некорректный цвет: ${key}`);
      }
      entries.forEach(([key, value]) => syncControls[key](value));
      dialog.close(); status.textContent = `Применено цветов: ${entries.length}`;
    } catch (cause) {
      error.textContent = cause instanceof SyntaxError ? 'Ошибка JSON: проверьте кавычки, запятые и скобки.' : cause.message;
    }
  });
})();
