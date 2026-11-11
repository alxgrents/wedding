(() => {
    'use strict';

    const storageKey = 'wedding-language';
    const translations = {
        ru: {},
        en: {
            title: 'Maria and Alexander — February 6, 2027',
            description: 'Join us for the wedding of Maria and Alexander on February 6, 2027. The schedule, venue and wishes for our guests.',
            loading: 'Please wait — your invitation is loading :)',
            homeLabel: 'Back to the top of the invitation',
            navigationLabel: 'Invitation sections',
            languageLabel: 'Invitation language',
            mariaInitial: 'M',
            alexanderInitial: 'A',
            schedule: 'Schedule for the Day',
            dressCode: 'Dress Code',
            meetingPlace: 'Venue',
            eyebrow: 'YOU ARE INVITED TO OUR WEDDING',
            maria: 'Maria',
            and: 'and',
            alexander: 'Alexander',
            date: 'February 6, 2027',
            couple: 'Maria and Alexander',
            invitationLabel: 'Wedding invitation',
            invitation: "Our wedding won't be as happy, cozy, and fun without you! We invite you to celebrate this day with us!",
            photosLabel: 'Wedding photos',
            arrivalTime: '3:30 p.m.',
            arrival: 'Guests arrive',
            ceremonyTime: '4:00 p.m.',
            ceremony: 'Outdoor ceremony',
            receptionTime: '5:00 p.m.',
            reception: 'Reception',
            venueTitle: 'Venue',
            venue: 'Chelyabinsk, More Amore Banquet Hall, GRANDE Hall',
            address: '107 Engels Street',
            venueExterior: 'The More Amore building and entrance to the banquet hall',
            venueInterior: 'Inside More Amore: the buffet area',
            mapLink: 'Open in Yandex Maps ↗️',
            mapToggle: 'Show / hide map',
            mapVenue: 'More Amore',
            mapCategory: 'Banquet hall in Chelyabinsk',
            mapRental: 'Event venue hire in Chelyabinsk',
            mapTitle: 'More Amore — our wedding venue on Yandex Maps',
            dressMessage: "We've worked hard to make this a beautiful celebration, and we'd love it if you could incorporate touches of green or purple into your outfits. This is not required.",
            green: 'Green',
            purple: 'Purple',
            flowersLabel: 'A note about flowers',
            flowersMessage: 'Please do not give us flowers, as our pets will not let us fully enjoy their beauty.',
            dog: 'A close-up of a dog',
            greyCat: 'A grey cat with amber eyes',
            calicoCat: 'A calico cat with green eyes',
            tabbyCat: 'A tabby cat',
            contactTitle: 'Still have questions?',
            contactMessage: 'If you have any questions about our wedding or would like to prepare something special, you can contact our wedding planner, Tanya, via any messaging app.',
            organizer: 'Tanya:',
        },
    };
    const switcher = document.querySelector('.language-switch');
    const buttons = switcher.querySelectorAll('[data-language]');
    const bindings = [];

    // Keep the Russian HTML as the default and as a fallback without JavaScript.
    for (const attribute of ['text', 'content', 'aria-label', 'alt', 'title']) {
        const dataAttribute = attribute === 'text' ? 'data-i18n' : `data-i18n-${attribute}`;
        document.querySelectorAll(`[${dataAttribute}]`).forEach(element => {
            const key = element.getAttribute(dataAttribute);
            translations.ru[key] = attribute === 'text' ? element.textContent : element.getAttribute(attribute);
            bindings.push({ element, attribute, key });
        });
    }

    function setLanguage (language) {
        if (!Object.prototype.hasOwnProperty.call(translations, language)) language = 'ru';

        document.documentElement.lang = language;
        bindings.forEach(({ element, attribute, key }) => {
            const value = translations[language][key] ?? translations.ru[key];
            if (attribute === 'text') element.textContent = value;
            else element.setAttribute(attribute, value);
        });
        buttons.forEach(button => {
            button.setAttribute('aria-pressed', String(button.dataset.language === language));
        });
    }

    let savedLanguage = 'ru';
    try {
        savedLanguage = localStorage.getItem(storageKey) || 'ru';
    } catch {
        // Switching still works when browser storage is unavailable.
    }
    setLanguage(savedLanguage);
    switcher.hidden = false;

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const language = button.dataset.language;
            setLanguage(language);
            try {
                localStorage.setItem(storageKey, language);
            } catch {
                // Keep the selected language for the current visit.
            }
        });
    });
})();
