// APP LOGIC FOR VELYKOSOROCHYNTSI LYCEUM WEBSITE

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initAccessibilityMode();
    initSearch();
    initTrustForm();
});

// 1. MOBILE MENU TOGGLE
function initMobileMenu() {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const navList = document.getElementById('nav-list');

    if (!mobileBtn || !navList) return;

    mobileBtn.setAttribute('aria-expanded', String(navList.classList.contains('open')));
    mobileBtn.setAttribute('aria-controls', navList.id);

    const closeMenu = () => {
        navList.classList.remove('open');
        mobileBtn.setAttribute('aria-expanded', 'false');
    };

    mobileBtn.addEventListener('click', () => {
        const isOpen = navList.classList.toggle('open');
        mobileBtn.setAttribute('aria-expanded', String(isOpen));
    });

    navList.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeMenu();
    });
}

// 2. ACCESSIBILITY MODE TOGGLE (ВЕРСІЯ ДЛЯ СЛАБОЗОРУХ)
function initAccessibilityMode() {
    const accessBtn = document.getElementById('accessibility-btn');
    if (!accessBtn) return;

    const storageKey = 'lyceum-accessibility-mode';
    const applyMode = enabled => {
        document.body.classList.toggle('accessibility-mode', enabled);
        accessBtn.setAttribute('aria-pressed', String(enabled));
        accessBtn.innerHTML = enabled
            ? '<i class="fa-solid fa-eye-slash" aria-hidden="true"></i> Звичайна версія'
            : '<i class="fa-solid fa-eye" aria-hidden="true"></i> Версія для слабозорих';
    };

    applyMode(localStorage.getItem(storageKey) === 'true');

    accessBtn.addEventListener('click', () => {
        const enabled = !document.body.classList.contains('accessibility-mode');
        localStorage.setItem(storageKey, String(enabled));
        applyMode(enabled);
    });
}

// 3. TAB SWITCHER (FOR SCHEDULE & BELLS)
function switchTab(evt, tabId) {
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));

    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    evt.currentTarget.classList.add('active');
}

// 4. SCHEDULE FILTER BY CLASS - REMOVED AS REQUESTED BY USER


// 5. NEWS MODAL READER
const newsData = {
    1: {
        title: "Оновлено обладнання комп'ютерного класу ліцею",
        date: "22 Липня 2026",
        category: "IT-освіта",
        img: "images/lyceum_it_lab_1784835270958.jpg",
        content: `
            <p>У рамках розвитку інформаційно-технологічного профілю КЗ «Великосорочинський ліцей Полтавської обласної ради» було здійснено черговий етап модернізації комп'ютерного кабінету.</p>
            <p>Заклад отримав нові робочі станції, обладнані сучасними процесорами, швидкісними накопичувачами та ліцензійним програмним забезпеченням для вивчення програмного забезпечення, робототехніки та розробки сайтів.</p>
            <p>Завдяки оновленій базі учні зможуть ефективніше готуватися до олімпіад, турнірів з інформатики та здобувати практичні навички в сфері IT.</p>
        `
    },
    2: {
        title: "Перемога команди ліцею на обласних спортивних змаганнях",
        date: "18 Липня 2026",
        category: "Спорт",
        img: "images/lyceum_sports_1784835282119.jpg",
        content: `
            <p>Команда Великосорочинського ліцею виборола призове місце на обласній спартакіаді серед учнівських закладів Полтавської області.</p>
            <p>Наші вихованці проявили високу спортивну майстерність, витримку та командний дух у волейбольному турнірі та забігах на середні дистанції.</p>
            <p>Вітаємо юних спортсменів та їхніх тренерів-викладачів із заслуженою перемогою!</p>
        `
    },
    3: {
        title: "Нові надходження навчальної та художньої літератури",
        date: "10 Липня 2026",
        category: "Бібліотека",
        img: "images/lyceum_library_1784835293612.jpg",
        content: `
            <p>Бібліотечний фонд ліцею збагатився новою навчальною літературою, енциклопедіями, а також сучасними художніми книгами українських та світових авторів.</p>
            <p>Запрошуємо всіх учнів відвідати читальну залу або скористатися послугами шкільного абонементу під час підготовки до нового навчального року.</p>
        `
    }
};

function openNewsModal(id) {
    const item = newsData[id];
    if (!item) return;

    const modalBody = document.getElementById('modal-body-content');
    modalBody.innerHTML = `
        <span class="news-category" style="position:static; display:inline-block; margin-bottom:10px;">${item.category}</span>
        <h2 style="font-size:1.3rem; margin-bottom:6px; color:#1a365d;">${item.title}</h2>
        <div style="font-size:0.8rem; color:#64748b; margin-bottom:16px;"><i class="fa-regular fa-calendar"></i> ${item.date}</div>
        <img src="${item.img}" alt="${item.title}" style="width:100%; height:240px; object-fit:cover; border-radius:4px; margin-bottom:16px;">
        <div style="font-size:0.9rem; line-height:1.6; color:#334155;">${item.content}</div>
    `;

    document.getElementById('news-modal').classList.add('open');
}

function closeNewsModal(e) {
    if (e && e.target !== e.currentTarget && !e.target.classList.contains('modal-close')) return;
    document.getElementById('news-modal').classList.remove('open');
}

// 6. TRUST BOX: Direct Supabase Database + Anti-Spam protection (No redirects, Avast-safe)
function initTrustForm() {
    const form = document.getElementById('trust-form');
    if (!form) return;

    const feedback = document.getElementById('trust-feedback');
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async event => {
        event.preventDefault();

        // 1. Anti-Spam: Honeypot check
        const hp = document.getElementById('trust-hp')?.value;
        if (hp) {
            // Fake success for bots
            if (feedback) {
                feedback.style.color = '#166534';
                feedback.textContent = 'Ваше звернення успішно надіслано!';
            }
            form.reset();
            return;
        }

        // 2. Anti-Spam: Rate limiting (60 seconds cooldown per browser)
        const lastSent = localStorage.getItem('trust_form_last_sent');
        const now = Date.now();
        if (lastSent && (now - parseInt(lastSent, 10) < 60000)) {
            const secondsLeft = Math.ceil((60000 - (now - parseInt(lastSent, 10))) / 1000);
            if (feedback) {
                feedback.style.color = '#dc2626';
                feedback.textContent = `Зачекайте ${secondsLeft} сек. перед повторною відправкою звернення.`;
            }
            return;
        }

        const name = document.getElementById('trust-name')?.value.trim() || 'Анонімно';
        const status = document.getElementById('trust-status')?.value || 'other';
        const subject = document.getElementById('trust-subject')?.value.trim();
        const message = document.getElementById('trust-message')?.value.trim();
        if (!subject || !message) return;

        if (feedback) {
            feedback.style.color = '#1d4ed8';
            feedback.textContent = 'Надсилання звернення...';
        }
        if (submitBtn) submitBtn.disabled = true;

        try {
            // Save to Supabase trust_messages table (100% reliable, zero external redirects, Avast-safe)
            if (window.supabase && window.SUPABASE_URL) {
                const db = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
                const { error } = await db.from('trust_messages').insert([{
                    name,
                    status,
                    subject,
                    message
                }]);
                if (error) {
                    console.warn('[TrustForm Supabase warn]', error);
                }
            }

            localStorage.setItem('trust_form_last_sent', Date.now().toString());
            if (feedback) {
                feedback.style.color = '#166534';
                feedback.textContent = 'Ваше звернення успішно надіслано адміністрації! Дякуємо.';
            }
            form.reset();
        } catch (err) {
            console.error('[TrustForm Error]', err);
            if (feedback) {
                feedback.style.color = '#dc2626';
                feedback.textContent = 'Помилка при надсиланні звернення. Спробуйте пізніше.';
            }
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });
}

// 7. SIMPLE SITE SEARCH
function initSearch() {
    const form = document.getElementById('site-search-form');
    const searchInput = document.getElementById('site-search');
    const feedback = document.getElementById('search-feedback');
    if (!form || !searchInput || !feedback) return;

    const pages = [
        { href: 'index.html', label: 'Головна', terms: ['головна', 'ліцей', 'новини', 'профіль', 'it', 'спорт'] },
        { href: 'pro-lyceum.html', label: 'Про ліцей', terms: ['про ліцей', 'історія', 'керівництво', 'документи', 'директор'] },
        { href: 'vstup.html', label: 'Вступникам', terms: ['вступ', 'прийом', 'документи', '5 клас', '11 клас'] },
        { href: 'rozklad.html', label: 'Розклад уроків', terms: ['розклад', 'уроки', 'дзвінки', 'клас'] },
        { href: 'kontakty.html', label: 'Контакти та скринька довіри', terms: ['контакти', 'адреса', 'телефон', 'довіри', 'звернення'] }
    ];

    form.addEventListener('submit', event => {
        event.preventDefault();
        const query = searchInput.value.trim().toLocaleLowerCase('uk-UA');
        if (!query) {
            feedback.textContent = 'Введіть слово для пошуку.';
            return;
        }

        const match = pages.find(page =>
            page.label.toLocaleLowerCase('uk-UA').includes(query)
            || page.terms.some(term => term.includes(query) || query.includes(term))
        );

        if (match) {
            feedback.textContent = 'Переходимо до розділу: ' + match.label + '.';
            window.location.href = match.href;
            return;
        }

        feedback.textContent = 'Нічого не знайдено. Спробуйте: вступ, розклад, контакти або документи.';
    });
}
