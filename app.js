(function () {
  'use strict';

  const CATEGORY_FIELDS = {
    damen: [
      'fg-damen-produkttyp', 'fg-damen-dirndllaenge', 'fg-damen-hauptfarbe',
      'fg-damen-zweitfarbe', 'fg-damen-material', 'fg-damen-schuerzentyp',
      'fg-damen-blusenstil', 'fg-damen-stickerei', 'fg-damen-schmuck'
    ],
    herren: [
      'fg-herren-produkttyp', 'fg-herren-lederfarbe', 'fg-herren-material',
      'fg-herren-hemdstil', 'fg-herren-weste', 'fg-herren-stickerei',
      'fg-herren-accessoire'
    ],
    kinder: [
      'fg-kinder-typ', 'fg-kinder-hauptfarbe', 'fg-kinder-details'
    ],
    accessoires: [
      'fg-acc-typ', 'fg-acc-material', 'fg-acc-details'
    ]
  };

  const BACKGROUND_OPTIONS = {
    webshop: [
      'Weißer Studiohintergrund (clean)',
      'Hellgrauer Studiohintergrund',
      'Cremefarbener Hintergrund'
    ],
    social: [
      'Almwiese mit Bergpanorama',
      'Bayerischer See (Ufer)',
      'Rustikale Holzhütte',
      'Biergarten',
      'Münchner Altstadt',
      'Blumenwiese'
    ],
    katalog: [
      'Schloss-Kulisse',
      'Historisches Wirtshaus',
      'Berggipfel bei Sonnenaufgang',
      'Eleganter Festsaal'
    ]
  };

  const $ = (id) => document.getElementById(id);
  const allFieldIds = Object.values(CATEGORY_FIELDS).flat();

  const elements = {
    form: $('panel-form'),
    tabs: Array.from(document.querySelectorAll('.category-tab')),
    verwendungszweck: $('verwendungszweck'),
    hintergrund: $('hintergrund'),
    promptOutput: $('prompt-output'),
    copyButton: $('btn-copy'),
    toast: $('toast'),
    damenProdukttyp: $('damen-produkttyp'),
    herrenProdukttyp: $('herren-produkttyp')
  };

  let currentCategory = 'damen';
  let toastTimeoutId = null;

  function getValue(id) {
    const node = $(id);
    return node?.value?.trim() || '';
  }

  function setFieldVisibility(fieldId, isVisible) {
    const field = $(fieldId);
    if (!field) return;
    field.classList.toggle('field-hidden', !isVisible);
  }

  function populateBackgroundOptions() {
    if (!elements.verwendungszweck || !elements.hintergrund) return;

    const zweck = elements.verwendungszweck.value;
    const options = BACKGROUND_OPTIONS[zweck] || [];
    const previousValue = elements.hintergrund.value;

    elements.hintergrund.innerHTML = '';

    if (!options.length) {
      const fallback = document.createElement('option');
      fallback.value = 'Neutraler Hintergrund';
      fallback.textContent = 'Neutraler Hintergrund';
      elements.hintergrund.appendChild(fallback);
      return;
    }

    options.forEach((optionText) => {
      const option = document.createElement('option');
      option.value = optionText;
      option.textContent = optionText;
      elements.hintergrund.appendChild(option);
    });

    if (options.includes(previousValue)) {
      elements.hintergrund.value = previousValue;
    }
  }

  function updateDirndlFieldVisibility() {
    const isDirndl = currentCategory === 'damen' && elements.damenProdukttyp?.value === 'Dirndl';
    setFieldVisibility('fg-damen-dirndllaenge', isDirndl);
  }

  function updateHerrenLederFieldVisibility() {
    const produkttyp = elements.herrenProdukttyp?.value || '';
    const isLederhose = currentCategory === 'herren' && produkttyp.startsWith('Lederhose');
    setFieldVisibility('fg-herren-lederfarbe', isLederhose);
  }

  function switchCategory(category) {
    if (!CATEGORY_FIELDS[category]) return;

    currentCategory = category;

    elements.tabs.forEach((tab) => {
      const isActive = tab.dataset.category === category;
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    allFieldIds.forEach((fieldId) => setFieldVisibility(fieldId, false));
    CATEGORY_FIELDS[category].forEach((fieldId) => setFieldVisibility(fieldId, true));

    updateDirndlFieldVisibility();
    updateHerrenLederFieldVisibility();
    generatePrompt();
  }

  function buildProduktbeschreibung() {
    const freitext = getValue('freitext');
    let text = '';
    let isAccessoire = false;

    if (currentCategory === 'damen') {
      const typ = getValue('damen-produkttyp');
      const laenge = typ === 'Dirndl' ? `, ${getValue('damen-dirndllaenge')}` : '';
      const farbe = getValue('damen-hauptfarbe');
      const material = getValue('damen-material');
      const stickerei = getValue('damen-stickerei');
      const schuerze = getValue('damen-schuerzentyp');
      const zweitfarbe = getValue('damen-zweitfarbe');
      const bluse = getValue('damen-blusenstil');
      const schmuck = getValue('damen-schmuck');

      text = `PRODUKT: ${typ}${laenge} in ${farbe}. Material: ${material}.`;

      if (stickerei && stickerei !== 'Keine') text += ` Verzierung: ${stickerei}.`;
      if ((typ === 'Dirndl' || typ === 'Trachtenrock') && schuerze !== 'Ohne Schürze') {
        text += ` Schürze: ${schuerze} in ${zweitfarbe}.`;
      }
      if ((typ === 'Dirndl' || typ === 'Mieder') && bluse !== 'Keine Bluse sichtbar') {
        text += ` Bluse: ${bluse}.`;
      }
      if (schmuck && schmuck !== 'Keiner') text += ` Schmuck: ${schmuck}.`;
    }

    if (currentCategory === 'herren') {
      const typ = getValue('herren-produkttyp');
      const material = getValue('herren-material');
      const stickerei = getValue('herren-stickerei');
      const hemdstil = getValue('herren-hemdstil');
      const weste = getValue('herren-weste');
      const accessoire = getValue('herren-accessoire');
      const lederfarbe = getValue('herren-lederfarbe');
      const isLederhose = typ.startsWith('Lederhose');

      text = `PRODUKT: ${typ}${isLederhose ? ` in ${lederfarbe}` : ''}. Material: ${material}.`;

      if (stickerei && stickerei !== 'Keine') text += ` Stickerei: ${stickerei}.`;
      if ((isLederhose || typ === 'Trachtenweste' || typ === 'Janker') && hemdstil) {
        text += ` Dazu: Trachtenhemd ${hemdstil}.`;
      }
      if (weste && weste !== 'Keine') text += ` Weste: ${weste}.`;
      if (accessoire && accessoire !== 'Keiner') text += ` Accessoire: ${accessoire}.`;
    }

    if (currentCategory === 'kinder') {
      const typ = getValue('kinder-typ');
      const farbe = getValue('kinder-hauptfarbe');
      const details = getValue('kinder-details');

      text = `PRODUKT: ${typ} in ${farbe}.`;
      if (details) text += ` Details: ${details}.`;
    }

    if (currentCategory === 'accessoires') {
      isAccessoire = true;
      const typ = getValue('acc-typ');
      const material = getValue('acc-material');
      const details = getValue('acc-details');

      text = `PRODUKT: ${typ} aus ${material}.`;
      if (details) text += ` ${details}.`;
    }

    if (freitext) text += ` ${freitext}.`;

    return { text, isAccessoire };
  }

  function buildModelSection(zweck, modelTyp) {
    const isKeinModel = modelTyp === 'kein-model';

    if (isKeinModel) {
      if (zweck === 'webshop') {
        return 'Das Kleidungsstück wird als Flatlay auf einer hellen, sauberen Oberfläche präsentiert oder ist auf einer Schneiderpuppe/Mannequin drapiert.';
      }
      return 'Das Kleidungsstück ist auf einer Schneiderpuppe/Mannequin drapiert oder wird als stilvolles Flatlay auf einer rustikalen Holzoberfläche präsentiert.';
    }

    if (currentCategory === 'kinder') {
      const kinderTyp = getValue('kinder-typ');
      if (kinderTyp.includes('Madl')) return 'MODEL: Fröhliches Kindermodel (Madl) trägt das Kleidungsstück.';
      if (kinderTyp.includes('Buam')) return 'MODEL: Fröhliches Kindermodel (Bub) trägt das Kleidungsstück.';
    }

    return `MODEL: ${modelTyp || 'Model'} trägt das Kleidungsstück.`;
  }

  function buildPoseSection(isKeinModel, isAccessoire) {
    const ausschnitt = getValue('bildausschnitt');
    const pose = getValue('pose');

    if (!isKeinModel) return `POSE: ${pose}, ${ausschnitt}.`;
    if (isAccessoire) return `BILDAUSSCHNITT: ${ausschnitt}, Nahaufnahme des Accessoires.`;
    return `BILDAUSSCHNITT: ${ausschnitt}.`;
  }

  function generatePrompt() {
    if (!elements.promptOutput) return;

    const zweck = getValue('verwendungszweck');
    const modelTyp = getValue('model-typ');
    const hintergrund = getValue('hintergrund') || 'Neutraler Hintergrund';
    const licht = getValue('lichtstimmung') || 'Natürliches Tageslicht';

    const { text: produktbeschreibung, isAccessoire } = buildProduktbeschreibung();
    const modelSection = buildModelSection(zweck, modelTyp);
    const poseSection = buildPoseSection(modelTyp === 'kein-model', isAccessoire);

    const kameraExtra = zweck === 'webshop'
      ? 'Gleichmäßige Ausleuchtung, neutraler Hintergrund.'
      : 'Cinematic depth of field, natürliche Atmosphäre.';

    const introText = isAccessoire
      ? 'FOTOREALISTISCHES PRODUKTFOTO eines Trachten-Accessoires für einen professionellen Katalog.'
      : 'FOTOREALISTISCHES PRODUKTFOTO für einen professionellen Trachten-Katalog.';

    const prompt = `${introText}

${produktbeschreibung}

${modelSection}
${poseSection}

SZENE: ${hintergrund}.
LICHT: ${licht}.

KAMERA: Aufgenommen mit einer Sony A7R IV, 85mm Objektiv, f/2.8. ${kameraExtra}

STIL: Authentische Katalog-Fotografie wie in einem hochwertigen Trachten-Modekatalog. Natürliche Hauttextur, kein Weichzeichner, kein Airbrush-Look. Die Kleidung muss exakt wie beschrieben aussehen – keine kreativen Abweichungen bei Farben, Mustern oder Schnitten.
WICHTIG: Fotorealistisch. Keine KI-typischen Artefakte. Das Bild soll wie ein echtes, unbearbeitetes Katalogfoto wirken.`;

    elements.promptOutput.textContent = prompt;
  }

  async function copyPromptToClipboard() {
    const text = elements.promptOutput?.textContent?.trim();
    if (!text) return;

    let copied = false;

    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch (_error) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.cssText = 'position:fixed;left:-9999px;';
      document.body.appendChild(textarea);
      textarea.select();
      copied = document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    if (!copied || !elements.toast) return;

    clearTimeout(toastTimeoutId);
    elements.toast.classList.add('show');
    toastTimeoutId = setTimeout(() => {
      elements.toast.classList.remove('show');
    }, 2000);
  }

  function bindEvents() {
    elements.tabs.forEach((tab) => {
      tab.addEventListener('click', () => switchCategory(tab.dataset.category));
    });

    elements.form?.addEventListener('submit', (event) => event.preventDefault());

    elements.verwendungszweck?.addEventListener('change', () => {
      populateBackgroundOptions();
      generatePrompt();
    });

    elements.damenProdukttyp?.addEventListener('change', () => {
      updateDirndlFieldVisibility();
      generatePrompt();
    });

    elements.herrenProdukttyp?.addEventListener('change', () => {
      updateHerrenLederFieldVisibility();
      generatePrompt();
    });

    elements.copyButton?.addEventListener('click', copyPromptToClipboard);

    document.querySelectorAll('.form-select, .form-input, .form-textarea').forEach((field) => {
      field.addEventListener('change', generatePrompt);
      field.addEventListener('input', generatePrompt);
    });
  }

  function init() {
    bindEvents();
    populateBackgroundOptions();
    switchCategory('damen');
  }

  init();
})();
