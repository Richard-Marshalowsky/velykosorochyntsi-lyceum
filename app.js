// APP LOGIC FOR VELYKOSOROCHYNTSI LYCEUM WEBSITE

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initAccessibilityMode();
    initSearch();
    initTrustForm();
    initCookieBanner();
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

// 2. ACCESSIBILITY MODE TOGGLE (Р’Р•Р РЎР†РЇ Р”Р›РЇ РЎР›РђР‘РћР—РћР РЈРҐ)
function initAccessibilityMode() {
    const accessBtn = document.getElementById('accessibility-btn');
    if (!accessBtn) return;

    const storageKey = 'lyceum-accessibility-mode';
    const applyMode = enabled => {
        document.body.classList.toggle('accessibility-mode', enabled);
        accessBtn.setAttribute('aria-pressed', String(enabled));
        accessBtn.innerHTML = enabled
            ? '<i class="fa-solid fa-eye-slash" aria-hidden="true"></i> Р—РІРёС‡Р°Р№РЅР° РІРµСЂСЃС–СЏ'
            : '<i class="fa-solid fa-eye" aria-hidden="true"></i> Р’РµСЂСЃС–СЏ РґР»СЏ СЃР»Р°Р±РѕР·РѕСЂРёС…';
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
        title: "РћРЅРѕРІР»РµРЅРѕ РѕР±Р»Р°РґРЅР°РЅРЅСЏ РєРѕРјРї'СЋС‚РµСЂРЅРѕРіРѕ РєР»Р°СЃСѓ Р»С–С†РµСЋ",
        date: "22 Р›РёРїРЅСЏ 2026",
        category: "IT-РѕСЃРІС–С‚Р°",
        img: "images/lyceum_it_lab_1784835270958.jpg",
        content: `
            <p>РЈ СЂР°РјРєР°С… СЂРѕР·РІРёС‚РєСѓ С–РЅС„РѕСЂРјР°С†С–Р№РЅРѕ-С‚РµС…РЅРѕР»РѕРіС–С‡РЅРѕРіРѕ РїСЂРѕС„С–Р»СЋ РљР— В«Р’РµР»РёРєРѕСЃРѕСЂРѕС‡РёРЅСЃСЊРєРёР№ Р»С–С†РµР№ РџРѕР»С‚Р°РІСЃСЊРєРѕС— РѕР±Р»Р°СЃРЅРѕС— СЂР°РґРёВ» Р±СѓР»Рѕ Р·РґС–Р№СЃРЅРµРЅРѕ С‡РµСЂРіРѕРІРёР№ РµС‚Р°Рї РјРѕРґРµСЂРЅС–Р·Р°С†С–С— РєРѕРјРї'СЋС‚РµСЂРЅРѕРіРѕ РєР°Р±С–РЅРµС‚Сѓ.</p>
            <p>Р—Р°РєР»Р°Рґ РѕС‚СЂРёРјР°РІ РЅРѕРІС– СЂРѕР±РѕС‡С– СЃС‚Р°РЅС†С–С—, РѕР±Р»Р°РґРЅР°РЅС– СЃСѓС‡Р°СЃРЅРёРјРё РїСЂРѕС†РµСЃРѕСЂР°РјРё, С€РІРёРґРєС–СЃРЅРёРјРё РЅР°РєРѕРїРёС‡СѓРІР°С‡Р°РјРё С‚Р° Р»С–С†РµРЅР·С–Р№РЅРёРј РїСЂРѕРіСЂР°РјРЅРёРј Р·Р°Р±РµР·РїРµС‡РµРЅРЅСЏРј РґР»СЏ РІРёРІС‡РµРЅРЅСЏ РїСЂРѕРіСЂР°РјРЅРѕРіРѕ Р·Р°Р±РµР·РїРµС‡РµРЅРЅСЏ, СЂРѕР±РѕС‚РѕС‚РµС…РЅС–РєРё С‚Р° СЂРѕР·СЂРѕР±РєРё СЃР°Р№С‚С–РІ.</p>
            <p>Р—Р°РІРґСЏРєРё РѕРЅРѕРІР»РµРЅС–Р№ Р±Р°Р·С– СѓС‡РЅС– Р·РјРѕР¶СѓС‚СЊ РµС„РµРєС‚РёРІРЅС–С€Рµ РіРѕС‚СѓРІР°С‚РёСЃСЏ РґРѕ РѕР»С–РјРїС–Р°Рґ, С‚СѓСЂРЅС–СЂС–РІ Р· С–РЅС„РѕСЂРјР°С‚РёРєРё С‚Р° Р·РґРѕР±СѓРІР°С‚Рё РїСЂР°РєС‚РёС‡РЅС– РЅР°РІРёС‡РєРё РІ СЃС„РµСЂС– IT.</p>
        `
    },
    2: {
        title: "РџРµСЂРµРјРѕРіР° РєРѕРјР°РЅРґРё Р»С–С†РµСЋ РЅР° РѕР±Р»Р°СЃРЅРёС… СЃРїРѕСЂС‚РёРІРЅРёС… Р·РјР°РіР°РЅРЅСЏС…",
        date: "18 Р›РёРїРЅСЏ 2026",
        category: "РЎРїРѕСЂС‚",
        img: "images/lyceum_sports_1784835282119.jpg",
        content: `
            <p>РљРѕРјР°РЅРґР° Р’РµР»РёРєРѕСЃРѕСЂРѕС‡РёРЅСЃСЊРєРѕРіРѕ Р»С–С†РµСЋ РІРёР±РѕСЂРѕР»Р° РїСЂРёР·РѕРІРµ РјС–СЃС†Рµ РЅР° РѕР±Р»Р°СЃРЅС–Р№ СЃРїР°СЂС‚Р°РєС–Р°РґС– СЃРµСЂРµРґ СѓС‡РЅС–РІСЃСЊРєРёС… Р·Р°РєР»Р°РґС–РІ РџРѕР»С‚Р°РІСЃСЊРєРѕС— РѕР±Р»Р°СЃС‚С–.</p>
            <p>РќР°С€С– РІРёС…РѕРІР°РЅС†С– РїСЂРѕСЏРІРёР»Рё РІРёСЃРѕРєСѓ СЃРїРѕСЂС‚РёРІРЅСѓ РјР°Р№СЃС‚РµСЂРЅС–СЃС‚СЊ, РІРёС‚СЂРёРјРєСѓ С‚Р° РєРѕРјР°РЅРґРЅРёР№ РґСѓС… Сѓ РІРѕР»РµР№Р±РѕР»СЊРЅРѕРјСѓ С‚СѓСЂРЅС–СЂС– С‚Р° Р·Р°Р±С–РіР°С… РЅР° СЃРµСЂРµРґРЅС– РґРёСЃС‚Р°РЅС†С–С—.</p>
            <p>Р’С–С‚Р°С”РјРѕ СЋРЅРёС… СЃРїРѕСЂС‚СЃРјРµРЅС–РІ С‚Р° С—С…РЅС–С… С‚СЂРµРЅРµСЂС–РІ-РІРёРєР»Р°РґР°С‡С–РІ С–Р· Р·Р°СЃР»СѓР¶РµРЅРѕСЋ РїРµСЂРµРјРѕРіРѕСЋ!</p>
        `
    },
    3: {
        title: "РќРѕРІС– РЅР°РґС…РѕРґР¶РµРЅРЅСЏ РЅР°РІС‡Р°Р»СЊРЅРѕС— С‚Р° С…СѓРґРѕР¶РЅСЊРѕС— Р»С–С‚РµСЂР°С‚СѓСЂРё",
        date: "10 Р›РёРїРЅСЏ 2026",
        category: "Р‘С–Р±Р»С–РѕС‚РµРєР°",
        img: "images/lyceum_library_1784835293612.jpg",
        content: `
            <p>Р‘С–Р±Р»С–РѕС‚РµС‡РЅРёР№ С„РѕРЅРґ Р»С–С†РµСЋ Р·Р±Р°РіР°С‚РёРІСЃСЏ РЅРѕРІРѕСЋ РЅР°РІС‡Р°Р»СЊРЅРѕСЋ Р»С–С‚РµСЂР°С‚СѓСЂРѕСЋ, РµРЅС†РёРєР»РѕРїРµРґС–СЏРјРё, Р° С‚Р°РєРѕР¶ СЃСѓС‡Р°СЃРЅРёРјРё С…СѓРґРѕР¶РЅС–РјРё РєРЅРёРіР°РјРё СѓРєСЂР°С—РЅСЃСЊРєРёС… С‚Р° СЃРІС–С‚РѕРІРёС… Р°РІС‚РѕСЂС–РІ.</p>
            <p>Р—Р°РїСЂРѕС€СѓС”РјРѕ РІСЃС–С… СѓС‡РЅС–РІ РІС–РґРІС–РґР°С‚Рё С‡РёС‚Р°Р»СЊРЅСѓ Р·Р°Р»Сѓ Р°Р±Рѕ СЃРєРѕСЂРёСЃС‚Р°С‚РёСЃСЏ РїРѕСЃР»СѓРіР°РјРё С€РєС–Р»СЊРЅРѕРіРѕ Р°Р±РѕРЅРµРјРµРЅС‚Сѓ РїС–Рґ С‡Р°СЃ РїС–РґРіРѕС‚РѕРІРєРё РґРѕ РЅРѕРІРѕРіРѕ РЅР°РІС‡Р°Р»СЊРЅРѕРіРѕ СЂРѕРєСѓ.</p>
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
            if (feedback) {
                feedback.style.color = '#166534';
                feedback.textContent = 'Р’Р°С€Рµ Р·РІРµСЂРЅРµРЅРЅСЏ СѓСЃРїС–С€РЅРѕ РЅР°РґС–СЃР»Р°РЅРѕ!';
            }
            form.reset();
            return;
        }

        // 3. Privacy Consent check
        const consent = document.getElementById('trust-consent')?.checked;
        if (!consent) {
            if (feedback) {
                feedback.style.color = '#dc2626';
                feedback.textContent = 'Р‘СѓРґСЊ Р»Р°СЃРєР°, РїС–РґС‚РІРµСЂРґС–С‚СЊ Р·РіРѕРґСѓ РЅР° РѕР±СЂРѕР±РєСѓ РїРµСЂСЃРѕРЅР°Р»СЊРЅРёС… РґР°РЅРёС….';
            }
            return;
        }

        // 4. Anti-Spam: Rate limiting (60 seconds cooldown per browser)
        const lastSent = localStorage.getItem('trust_form_last_sent');
        const now = Date.now();
        if (lastSent && (now - parseInt(lastSent, 10) < 60000)) {
            const secondsLeft = Math.ceil((60000 - (now - parseInt(lastSent, 10))) / 1000);
            if (feedback) {
                feedback.style.color = '#dc2626';
                feedback.textContent = `Р—Р°С‡РµРєР°Р№С‚Рµ ${secondsLeft} СЃРµРє. РїРµСЂРµРґ РїРѕРІС‚РѕСЂРЅРѕСЋ РІС–РґРїСЂР°РІРєРѕСЋ Р·РІРµСЂРЅРµРЅРЅСЏ.`;
            }
            return;
        }

        const name = document.getElementById('trust-name')?.value.trim() || 'РђРЅРѕРЅС–РјРЅРѕ';
        const status = document.getElementById('trust-status')?.value || 'other';
        const subject = document.getElementById('trust-subject')?.value.trim();
        const message = document.getElementById('trust-message')?.value.trim();
        if (!subject || !message) return;

        if (feedback) {
            feedback.style.color = '#1d4ed8';
            feedback.textContent = 'РќР°РґСЃРёР»Р°РЅРЅСЏ Р·РІРµСЂРЅРµРЅРЅСЏ...';
        }
        if (submitBtn) submitBtn.disabled = true;

        try {
            if (!window.supabase || !window.SUPABASE_URL) {
                throw new Error('Р‘Р°Р·Р° РґР°РЅРёС… РЅРµРґРѕСЃС‚СѓРїРЅР°. Р—РІРµСЂРЅС–С‚СЊСЃСЏ РґРѕ Р°РґРјС–РЅС–СЃС‚СЂР°С‚РѕСЂР°.');
            }

            const db = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
            
            // Get Turnstile captcha token
            const turnstileEl = document.querySelector('[name="cf-turnstile-response"]');
            const turnstileToken = turnstileEl ? turnstileEl.value : '';
            if (!turnstileToken) {
                if (feedback) {
                    feedback.style.color = '#dc2626';
                    feedback.textContent = 'Будь ласка, пройдіть перевірку безпеки (капчу).';
                }
                if (submitBtn) submitBtn.disabled = false;
                return;
            }

            // Call server-side IP rate limited RPC function with Turnstile token
            let { data: rpcData, error: rpcError } = await db.rpc('submit_trust_message_secure', {
                p_name: name,
                p_status: status,
                p_subject: subject,
                p_message: message,
                p_turnstile_token: turnstileToken
            });

            if (rpcError) {
                console.error('[TrustForm RPC Error]', rpcError);
                throw new Error(rpcError.message || 'РџРѕРјРёР»РєР° РІРёРєРѕРЅР°РЅРЅСЏ Р·Р°РїРёС‚Сѓ');
            }

            localStorage.setItem('trust_form_last_sent', Date.now().toString());
            if (feedback) {
                feedback.style.color = '#166534';
                feedback.textContent = 'вњ… Р’Р°С€Рµ Р·РІРµСЂРЅРµРЅРЅСЏ СѓСЃРїС–С€РЅРѕ РЅР°РґС–СЃР»Р°РЅРѕ Р°РґРјС–РЅС–СЃС‚СЂР°С†С–С—! Р”СЏРєСѓС”РјРѕ.';
            }
            form.reset();
            // Reset Turnstile for next submission
            if (window.turnstile) { try { turnstile.reset(); } catch(e) {} }
        } catch (err) {
            console.error('[TrustForm Error]', err);
            if (feedback) {
                feedback.style.color = '#dc2626';
                feedback.textContent = 'вќЊ ' + (err.message || 'РџРѕРјРёР»РєР° РїСЂРё РЅР°РґСЃРёР»Р°РЅРЅС– Р·РІРµСЂРЅРµРЅРЅСЏ. РЎРїСЂРѕР±СѓР№С‚Рµ РїС–Р·РЅС–С€Рµ.');
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
        { href: 'index.html', label: 'Р“РѕР»РѕРІРЅР°', terms: ['РіРѕР»РѕРІРЅР°', 'Р»С–С†РµР№', 'РЅРѕРІРёРЅРё', 'РїСЂРѕС„С–Р»СЊ', 'it', 'СЃРїРѕСЂС‚'] },
        { href: 'pro-lyceum.html', label: 'РџСЂРѕ Р»С–С†РµР№', terms: ['РїСЂРѕ Р»С–С†РµР№', 'С–СЃС‚РѕСЂС–СЏ', 'РєРµСЂС–РІРЅРёС†С‚РІРѕ', 'РґРѕРєСѓРјРµРЅС‚Рё', 'РґРёСЂРµРєС‚РѕСЂ'] },
        { href: 'vstup.html', label: 'Р’СЃС‚СѓРїРЅРёРєР°Рј', terms: ['РІСЃС‚СѓРї', 'РїСЂРёР№РѕРј', 'РґРѕРєСѓРјРµРЅС‚Рё', '5 РєР»Р°СЃ', '11 РєР»Р°СЃ'] },
        { href: 'rozklad.html', label: 'Р РѕР·РєР»Р°Рґ СѓСЂРѕРєС–РІ', terms: ['СЂРѕР·РєР»Р°Рґ', 'СѓСЂРѕРєРё', 'РґР·РІС–РЅРєРё', 'РєР»Р°СЃ'] },
        { href: 'kontakty.html', label: 'РљРѕРЅС‚Р°РєС‚Рё С‚Р° СЃРєСЂРёРЅСЊРєР° РґРѕРІС–СЂРё', terms: ['РєРѕРЅС‚Р°РєС‚Рё', 'Р°РґСЂРµСЃР°', 'С‚РµР»РµС„РѕРЅ', 'РґРѕРІС–СЂРё', 'Р·РІРµСЂРЅРµРЅРЅСЏ'] }
    ];

    form.addEventListener('submit', event => {
        event.preventDefault();
        const query = searchInput.value.trim().toLocaleLowerCase('uk-UA');
        if (!query) {
            feedback.textContent = 'Р’РІРµРґС–С‚СЊ СЃР»РѕРІРѕ РґР»СЏ РїРѕС€СѓРєСѓ.';
            return;
        }

        const match = pages.find(page =>
            page.label.toLocaleLowerCase('uk-UA').includes(query)
            || page.terms.some(term => term.includes(query) || query.includes(term))
        );

        if (match) {
            feedback.textContent = 'РџРµСЂРµС…РѕРґРёРјРѕ РґРѕ СЂРѕР·РґС–Р»Сѓ: ' + match.label + '.';
            window.location.href = match.href;
            return;
        }

        feedback.textContent = 'РќС–С‡РѕРіРѕ РЅРµ Р·РЅР°Р№РґРµРЅРѕ. РЎРїСЂРѕР±СѓР№С‚Рµ: РІСЃС‚СѓРї, СЂРѕР·РєР»Р°Рґ, РєРѕРЅС‚Р°РєС‚Рё Р°Р±Рѕ РґРѕРєСѓРјРµРЅС‚Рё.';
    });
}

// 8. COOKIE / LOCALSTORAGE PRIVACY BANNER
function initCookieBanner() {
    if (localStorage.getItem('cookie_consent_accepted')) return;

    const banner = document.createElement('div');
    banner.id = 'cookie-consent-banner';
    banner.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #0f172a;
        color: #f8fafc;
        padding: 14px 20px;
        font-size: 0.85rem;
        z-index: 9999;
        box-shadow: 0 -4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
        flex-wrap: wrap;
        border-top: 2px solid #2563eb;
    `;

    banner.innerHTML = `
        <div style="flex: 1; min-width: 250px;">
            <i class="fa-solid fa-cookie-bite" style="color: #f59e0b; margin-right: 6px;"></i>
            Р¦РµР№ СЃР°Р№С‚ РІРёРєРѕСЂРёСЃС‚РѕРІСѓС” С‚РµС…РЅС–С‡РЅС– С„Р°Р№Р»Рё cookie С‚Р° localStorage РґР»СЏ Р·Р°Р±РµР·РїРµС‡РµРЅРЅСЏ СЂРѕР±РѕС‚Рё С„РѕСЂРј, Р·Р±РµСЂРµР¶РµРЅРЅСЏ РЅР°Р»Р°С€С‚СѓРІР°РЅСЊ РґРѕСЃС‚СѓРїРЅРѕСЃС‚С– С‚Р° Р·Р°С…РёСЃС‚Сѓ РІС–Рґ СЃРїР°РјСѓ.
            <a href="privacy.html" style="color: #60a5fa; text-decoration: underline; margin-left: 4px;">РџРѕР»С–С‚РёРєР° РєРѕРЅС„С–РґРµРЅС†С–Р№РЅРѕСЃС‚С–</a>
        </div>
        <button id="accept-cookie-btn" style="
            background: #2563eb;
            color: #fff;
            border: none;
            padding: 8px 18px;
            border-radius: 4px;
            font-weight: 700;
            font-size: 0.82rem;
            cursor: pointer;
            white-space: nowrap;
        ">Р—СЂРѕР·СѓРјС–Р»Рѕ</button>
    `;

    document.body.appendChild(banner);

    document.getElementById('accept-cookie-btn')?.addEventListener('click', () => {
        localStorage.setItem('cookie_consent_accepted', 'true');
        banner.remove();
    });
}
