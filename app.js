// APP LOGIC FOR VELYKOSOROCHYNTSI LYCEUM WEBSITE

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initAccessibilityMode();
    initSearch();
});

// 1. MOBILE MENU TOGGLE
function initMobileMenu() {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const navList = document.getElementById('nav-list');

    if (mobileBtn && navList) {
        mobileBtn.addEventListener('click', () => {
            navList.classList.toggle('open');
        });
    }
}

// 2. ACCESSIBILITY MODE TOGGLE (ВЕРСІЯ ДЛЯ СЛАБОЗОРУХ)
function initAccessibilityMode() {
    const accessBtn = document.getElementById('accessibility-btn');
    
    if (accessBtn) {
        accessBtn.addEventListener('click', () => {
            document.body.classList.toggle('accessibility-mode');
            const isAccess = document.body.classList.contains('accessibility-mode');
            
            if (isAccess) {
                accessBtn.innerHTML = '<i class="fa-solid fa-eye-slash"></i> Звичайна версія';
            } else {
                accessBtn.innerHTML = '<i class="fa-solid fa-eye"></i> Версія для слабозорих';
            }
        });
    }
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

// 4. SCHEDULE FILTER BY CLASS
const scheduleData = {
    "5": [
        ["1", "08:30 - 09:15", "Українська мова", "Математика", "Природознавство", "Математика", "Історія України"],
        ["2", "09:25 - 10:10", "Математика", "Українська літ.", "Українська мова", "Англійська мова", "Інформатика"],
        ["3", "10:30 - 11:15", "Англійська мова", "Природознавство", "Зарубіжна літ.", "Українська літ.", "Математика"],
        ["4", "11:35 - 12:20", "Музичне мистецтво", "Фізична культура", "Малювання", "Фізична культура", "Трудове навчання"],
        ["5", "12:40 - 13:25", "Фізична культура", "Основи здоров'я", "Етика", "Інформатика", "Виховна година"]
    ],
    "10-it": [
        ["1", "08:30 - 09:15", "Українська мова", "Алгебра", "Інформатика", "Геометрія", "Фізична культура"],
        ["2", "09:25 - 10:10", "Алгебра", "Українська літ.", "Інформатика (Практикум)", "Фізика", "Історія України"],
        ["3", "10:30 - 11:15", "Англійська мова", "Фізика", "Алгебра", "Хімія", "Англійська мова"],
        ["4", "11:35 - 12:20", "Історія України", "Інформатика", "Біологія", "Українська мова", "Захист України"],
        ["5", "12:40 - 13:25", "Фізична культура", "Геометрія", "Географія", "Веб-програмування", "Зарубіжна літ."],
        ["6", "13:35 - 14:20", "Хімія", "Англійська мова", "Основи робототехніки", "Фізична культура", "Факультатив з IT"]
    ],
    "10-sport": [
        ["1", "08:30 - 09:15", "Українська мова", "Алгебра", "Спортивна підготовка", "Геометрія", "Спортивна техніка"],
        ["2", "09:25 - 10:10", "Алгебра", "Українська літ.", "Легка атлетика", "Фізика", "Історія України"],
        ["3", "10:30 - 11:15", "Англійська мова", "Теорія фізкультури", "Алгебра", "Хімія", "Англійська мова"],
        ["4", "11:35 - 12:20", "Історія України", "Волейбол", "Біологія", "Українська мова", "Захист України"],
        ["5", "12:40 - 13:25", "Загальна фізпідготовка", "Геометрія", "Географія", "Спортивні ігри", "Зарубіжна літ."]
    ]
};

function filterSchedule() {
    const select = document.getElementById('class-select');
    const selectedClass = select.value;
    const tbody = document.querySelector('#schedule-table tbody');
    
    const rows = scheduleData[selectedClass] || scheduleData["10-it"];
    
    tbody.innerHTML = '';
    rows.forEach(rowData => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${rowData[0]}</strong></td>
            <td>${rowData[1]}</td>
            <td>${rowData[2]}</td>
            <td>${rowData[3]}</td>
            <td>${rowData[4]}</td>
            <td>${rowData[5]}</td>
            <td>${rowData[6]}</td>
        `;
        tbody.appendChild(tr);
    });
}

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

// 6. TRUST BOX FORM SUBMISSION HANDLER
function handleTrustSubmit(event) {
    event.preventDefault();
    const feedback = document.getElementById('trust-feedback');
    const name = document.getElementById('trust-name').value || 'Анонімно';
    
    feedback.style.color = '#16a34a';
    feedback.innerHTML = `<i class="fa-solid fa-circle-check"></i> Дякуємо, ${name}! Ваше звернення успішно передано до адміністрації ліцею.`;
    
    document.getElementById('trust-form').reset();
}

// 7. SITE SEARCH SIMULATOR
function initSearch() {
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('site-search');

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            const query = searchInput.value.trim();
            if (query) {
                alert(`Пошук за запитом: "${query}". Успішно знайдено релевантні розділи на офіційному сайті.`);
            }
        });
    }
}
