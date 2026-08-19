// Admin Dashboard logic
const { createClient } = window.supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let currentRole = null;

const roleLabels = {
    super_admin: 'Супер Адмін',
    admin: 'Адміністратор',
    editor: 'Редактор'
};

const catLabels = { general: 'Загальне', important: 'Важливо', it: 'IT-освіта', sport: 'Спорт' };
const docTypeLabels = { normative: 'Нормативний', order: 'Наказ', report: 'Звіт', other: 'Інше' };

const roleDescriptions = {
    super_admin: `<strong>Ваша роль: Супер Адміністратор</strong><br>✅ Повний доступ до управління сайтом, новинами, розкладом та документами<br>✅ Управління правами та ролями користувачів`,
    admin: `<strong>Ваша роль: Адміністратор</strong><br>✅ Публікація та редагування новин та оголошень<br>✅ Редагування розкладу занять та документів`,
    editor: `<strong>Ваша роль: Редактор</strong><br>✅ Публікація новин та оголошень закладу`
};

function escHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function handleLogout() {
    try {
        await db.auth.signOut();
    } catch (e) {
        console.error(e);
    }
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = 'login.html';
}

// ─── INIT ──────────────────────────────────────────────────────────────
async function init() {
    const { data: { session }, error } = await db.auth.getSession();
    if (error || !session) { window.location.href = 'login.html'; return; }

    currentUser = session.user;
    const email = currentUser.email.toLowerCase();

    const { data: member, error: memberError } = await db
        .from('admin_users').select('role').eq('email', email).maybeSingle();

    if (memberError || !member) {
        await db.auth.signOut();
        window.location.href = 'login.html';
        return;
    }
    currentRole = member.role;

    document.getElementById('user-email').textContent = email;
    const badge = document.getElementById('role-badge');
    badge.textContent = roleLabels[currentRole];
    badge.className = 'role-badge ' + currentRole;

    document.getElementById('stat-role').textContent =
        currentRole === 'super_admin' ? 'Супер Адмін' :
        currentRole === 'admin' ? 'Адмін' : 'Редактор';
    document.getElementById('role-description').innerHTML = roleDescriptions[currentRole];

    if (currentRole === 'admin' || currentRole === 'super_admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
    }
    if (currentRole === 'super_admin') {
        document.querySelectorAll('.super-only').forEach(el => el.style.display = 'block');
        loadUsers();
    }

    loadNewsList();
    loadStats();
}

async function loadStats() {
    try {
        const [newsRes, usersRes, docsRes, trustRes] = await Promise.allSettled([
            db.from('news').select('id', { count: 'exact', head: true }),
            db.from('admin_users').select('email', { count: 'exact', head: true }),
            db.from('documents').select('id', { count: 'exact', head: true }),
            db.from('trust_messages').select('id', { count: 'exact', head: true })
        ]);
        document.getElementById('stat-news').textContent = newsRes.status === 'fulfilled' ? (newsRes.value.count ?? 0) : 0;
        document.getElementById('stat-users').textContent = usersRes.status === 'fulfilled' ? (usersRes.value.count ?? 0) : 0;
        document.getElementById('stat-docs').textContent = docsRes.status === 'fulfilled' ? (docsRes.value.count ?? 0) : 0;
        const trustStatEl = document.getElementById('stat-trust');
        if (trustStatEl) trustStatEl.textContent = trustRes.status === 'fulfilled' ? (trustRes.value.count ?? 0) : 0;
    } catch (e) {
        console.error('Error loading stats:', e);
    }
}

window.addEventListener('DOMContentLoaded', init);

// ─── PANEL ────────────────────────────────────────────────────────────
function showPanel(name) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    document.getElementById('panel-' + name).classList.add('active');
    const navEl = document.getElementById('nav-' + name);
    if (navEl) navEl.classList.add('active');
    const titles = {
        home: '<i class="fa-solid fa-gauge"></i> Огляд',
        news: '<i class="fa-solid fa-newspaper"></i> Новини',
        schedule: '<i class="fa-solid fa-calendar-check"></i> Розклад',
        documents: '<i class="fa-solid fa-file-lines"></i> Документи',
        trust: '<i class="fa-solid fa-envelope-open-text"></i> Скринька довіри',
        users: '<i class="fa-solid fa-users-gear"></i> Користувачі',
        settings: '<i class="fa-solid fa-gear"></i> Налаштування',
    };
    document.getElementById('panel-title').innerHTML = titles[name] || name;
    if (name === 'news') loadNewsList();
    if (name === 'documents') loadDocsList();
    if (name === 'settings') loadSettings();
    if (name === 'trust') loadTrustMessages();
}

// ─── FEEDBACK ─────────────────────────────────────────────────────────
function showFeedback(id, type, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = 'feedback-msg ' + type;
    el.textContent = msg;
    setTimeout(() => { el.className = 'feedback-msg'; el.textContent = ''; }, 5000);
}

function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── NEWS ──────────────────────────────────────────────────────────────
async function loadNewsList() {
    const tbody = document.getElementById('news-table-body');
    if (!tbody) return;
    const { data, error } = await db.from('news').select('*').order('created_at', { ascending: false });
    if (error) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#dc2626;">Помилка: ${error.message}</td></tr>`; return; }
    if (!data || data.length === 0) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:20px;">Новин ще немає</td></tr>'; return; }

    const canDelete = currentRole === 'super_admin' || currentRole === 'admin';
    tbody.innerHTML = data.map(n => `
        <tr>
            <td style="max-width:260px; word-break:break-word;">${escHtml(n.title)}</td>
            <td><span class="cat-pill ${n.category}">${catLabels[n.category] || n.category}</span></td>
            <td style="font-size:0.78rem; color:#64748b;">${escHtml(n.author_email)}</td>
            <td style="font-size:0.78rem; color:#64748b;">${fmtDate(n.created_at)}</td>
            <td>
                <div style="display:flex; gap:6px;">
                    <button class="btn-edit" onclick="editNews(${n.id})"><i class="fa-solid fa-pen"></i></button>
                    ${canDelete ? `<button class="btn-danger" onclick="deleteNews(${n.id})"><i class="fa-solid fa-trash"></i></button>` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

async function handleNewsSave() {
    const id = document.getElementById('news-edit-id').value;
    const title = document.getElementById('news-title').value.trim();
    const category = document.getElementById('news-category').value;
    const body = document.getElementById('news-body').value.trim();
    if (!title || !body) { showFeedback('news-feedback', 'error', 'Заповніть всі обов\'язкові поля'); return; }

    let error;
    if (id) {
        ({ error } = await db.from('news').update({ title, category, body }).eq('id', id));
    } else {
        ({ error } = await db.from('news').insert({ title, category, body, author_email: currentUser.email, created_at: new Date().toISOString() }));
    }

    if (error) { showFeedback('news-feedback', 'error', 'Помилка: ' + error.message); return; }
    showFeedback('news-feedback', 'success', id ? '✅ Новину оновлено!' : '✅ Новину опубліковано!');
    cancelNewsEdit();
    loadNewsList();
    loadStats();
}

async function editNews(id) {
    const { data, error } = await db.from('news').select('*').eq('id', id).single();
    if (error || !data) return;
    document.getElementById('news-edit-id').value = data.id;
    document.getElementById('news-title').value = data.title;
    document.getElementById('news-category').value = data.category;
    document.getElementById('news-body').value = data.body;
    document.getElementById('news-form-title').innerHTML = '<i class="fa-solid fa-pen"></i> Редагувати новину';
    document.getElementById('news-btn-label').textContent = 'Зберегти зміни';
    document.getElementById('news-cancel-btn').style.display = 'inline-flex';
    document.getElementById('news-form-card').scrollIntoView({ behavior: 'smooth' });
}

function cancelNewsEdit() {
    document.getElementById('news-edit-id').value = '';
    document.getElementById('news-title').value = '';
    document.getElementById('news-category').value = 'general';
    document.getElementById('news-body').value = '';
    document.getElementById('news-form-title').innerHTML = '<i class="fa-solid fa-plus"></i> Додати новину / оголошення';
    document.getElementById('news-btn-label').textContent = 'Опублікувати';
    document.getElementById('news-cancel-btn').style.display = 'none';
}

async function deleteNews(id) {
    if (!confirm('Видалити цю новину?')) return;
    const { error } = await db.from('news').delete().eq('id', id);
    if (error) { showFeedback('news-feedback', 'error', 'Помилка: ' + error.message); return; }
    showFeedback('news-feedback', 'success', '✅ Новину видалено');
    loadNewsList();
    loadStats();
}

// ─── DOCUMENTS ────────────────────────────────────────────────────────
async function loadDocsList() {
    const tbody = document.getElementById('docs-table-body');
    if (!tbody) return;
    const { data, error } = await db.from('documents').select('*').order('created_at', { ascending: false });
    if (error) { tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#dc2626;">Помилка: ${error.message}</td></tr>`; return; }
    if (!data || data.length === 0) { tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:20px;">Документів ще немає</td></tr>'; return; }

    tbody.innerHTML = data.map(d => `
        <tr>
            <td><a href="${escHtml(d.url)}" target="_blank" style="color:#1a365d;">${escHtml(d.title)}</a></td>
            <td><span class="cat-pill general">${docTypeLabels[d.type] || d.type}</span></td>
            <td style="font-size:0.78rem; color:#64748b;">${fmtDate(d.created_at)}</td>
            <td>
                <div style="display:flex; gap:6px;">
                    <button class="btn-edit" onclick="editDoc(${d.id})"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-danger" onclick="deleteDoc(${d.id})"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function handleDocSave() {
    const id = document.getElementById('doc-edit-id').value;
    const title = document.getElementById('doc-title').value.trim();
    const type = document.getElementById('doc-type').value;
    const url = document.getElementById('doc-url').value.trim();
    if (!title || !url) { showFeedback('docs-feedback', 'error', 'Заповніть всі обов\'язкові поля'); return; }

    let error;
    if (id) {
        ({ error } = await db.from('documents').update({ title, type, url }).eq('id', id));
    } else {
        ({ error } = await db.from('documents').insert({ title, type, url, author_email: currentUser.email, created_at: new Date().toISOString() }));
    }

    if (error) { showFeedback('docs-feedback', 'error', 'Помилка: ' + error.message); return; }
    showFeedback('docs-feedback', 'success', id ? '✅ Документ оновлено!' : '✅ Документ додано!');
    cancelDocEdit();
    loadDocsList();
    loadStats();
}

async function editDoc(id) {
    const { data, error } = await db.from('documents').select('*').eq('id', id).single();
    if (error || !data) return;
    document.getElementById('doc-edit-id').value = data.id;
    document.getElementById('doc-title').value = data.title;
    document.getElementById('doc-type').value = data.type;
    document.getElementById('doc-url').value = data.url;
    document.getElementById('doc-btn-label').textContent = 'Зберегти зміни';
    document.getElementById('doc-cancel-btn').style.display = 'inline-flex';
}

function cancelDocEdit() {
    document.getElementById('doc-edit-id').value = '';
    document.getElementById('doc-title').value = '';
    document.getElementById('doc-type').value = 'normative';
    document.getElementById('doc-url').value = '';
    document.getElementById('doc-btn-label').textContent = 'Зберегти';
    document.getElementById('doc-cancel-btn').style.display = 'none';
}

async function deleteDoc(id) {
    if (!confirm('Видалити цей документ?')) return;
    const { error } = await db.from('documents').delete().eq('id', id);
    if (error) { showFeedback('docs-feedback', 'error', 'Помилка: ' + error.message); return; }
    showFeedback('docs-feedback', 'success', '✅ Документ видалено');
    loadDocsList();
    loadStats();
}

// ─── SCHEDULE ──────────────────────────────────────────────────────────
const DAYS = ['Понеділок','Вівторок','Середа','Четвер','П\'ятниця'];
let scheduleData = {};

async function loadSchedule() {
    const cls = document.getElementById('schedule-class').value;
    if (!cls) { document.getElementById('schedule-editor').style.display = 'none'; return; }

    document.getElementById('schedule-editor').style.display = 'block';
    const { data } = await db.from('schedule').select('*').eq('class', cls).maybeSingle();
    scheduleData = data?.lessons || {};
    renderScheduleGrid(cls);
}

function renderScheduleGrid(cls) {
    const grid = document.getElementById('schedule-grid');
    const maxLessons = Math.max(7, ...DAYS.map(d => (scheduleData[d] || []).length));
    grid.innerHTML = DAYS.map(day => {
        const lessons = scheduleData[day] || Array(7).fill('');
        const rows = lessons.concat(Array(Math.max(0, maxLessons - lessons.length)).fill(''));
        return `
            <div class="schedule-day">
                <h4>${day}</h4>
                ${rows.map((s, i) => `
                    <div class="schedule-lesson">
                        <div class="lesson-num">${i + 1}</div>
                        <input class="lesson-input" data-day="${day}" data-idx="${i}"
                               value="${escHtml(s)}" placeholder="Предмет">
                    </div>
                `).join('')}
            </div>
        `;
    }).join('');
}

function addScheduleLesson() {
    DAYS.forEach(day => {
        if (!scheduleData[day]) scheduleData[day] = [];
        scheduleData[day].push('');
    });
    renderScheduleGrid(document.getElementById('schedule-class').value);
}

async function saveSchedule() {
    const cls = document.getElementById('schedule-class').value;
    if (!cls) return;
    document.querySelectorAll('.lesson-input').forEach(inp => {
        const day = inp.dataset.day;
        const idx = parseInt(inp.dataset.idx);
        if (!scheduleData[day]) scheduleData[day] = [];
        scheduleData[day][idx] = inp.value.trim();
    });
    DAYS.forEach(day => {
        scheduleData[day] = (scheduleData[day] || []).filter((v, i, arr) => v || arr.slice(i + 1).some(Boolean));
    });

    const { error } = await db.from('schedule').upsert(
        { class: cls, lessons: scheduleData, updated_by: currentUser.email, updated_at: new Date().toISOString() },
        { onConflict: 'class' }
    );
    if (error) { showFeedback('schedule-feedback', 'error', 'Помилка: ' + error.message); return; }
    showFeedback('schedule-feedback', 'success', '✅ Розклад збережено!');
}

// ─── USERS ────────────────────────────────────────────────────────────
async function loadUsers() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    const { data, error } = await db.from('admin_users').select('*').order('created_at', { ascending: false });
    if (error) { tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#dc2626;">Помилка: ${error.message}</td></tr>`; return; }

    tbody.innerHTML = data.map(u => `
        <tr>
            <td><strong>${escHtml(u.email)}</strong></td>
            <td><span class="role-badge ${u.role}">${roleLabels[u.role] || u.role}</span></td>
            <td>
                ${u.email !== currentUser.email ? `<button class="btn-edit" onclick="openRoleModal('${escHtml(u.email)}', '${u.role}')"><i class="fa-solid fa-user-pen"></i> Змінити роль</button>` : '<span style="font-size:0.75rem; color:#94a3b8;">Це ви</span>'}
            </td>
        </tr>
    `).join('');
}

function openRoleModal(email, currentRole) {
    document.getElementById('modal-role-email').value = email;
    document.getElementById('modal-role-select').value = currentRole;
    document.getElementById('modal-role').classList.add('open');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}

async function saveUserRole() {
    const email = document.getElementById('modal-role-email').value;
    const role = document.getElementById('modal-role-select').value;
    const { error } = await db.from('admin_users').update({ role }).eq('email', email);
    if (error) { alert('Помилка: ' + error.message); return; }
    closeModal('modal-role');
    loadUsers();
}

async function loadSettings() {
    // Load current site settings if table exists
}

// Export functions to global window for inline HTML onclick compatibility
window.handleLogout = handleLogout;
window.showPanel = showPanel;
window.handleNewsSave = handleNewsSave;
window.editNews = editNews;
window.cancelNewsEdit = cancelNewsEdit;
window.deleteNews = deleteNews;
window.handleDocSave = handleDocSave;
window.editDoc = editDoc;
window.cancelDocEdit = cancelDocEdit;
window.deleteDoc = deleteDoc;
window.loadSchedule = loadSchedule;
window.addScheduleLesson = addScheduleLesson;
window.saveSchedule = saveSchedule;
window.openRoleModal = openRoleModal;
window.closeModal = closeModal;
window.saveUserRole = saveUserRole;
