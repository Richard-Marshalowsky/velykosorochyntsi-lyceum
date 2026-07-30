/* Inline editor & Auth header sync & Comments for school administrators and users. */
(async () => {
  if (!window.supabase || !window.SUPABASE_URL) return;
  const db = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  const page = location.pathname === '/' || location.pathname.endsWith('/') ? '/index.html' : location.pathname;

  // 1. Загрузка измененных текстов
  const editableSelector = 'h1,h2,h3,h4,p,li,td,th,.contact-item,.top-contacts span,.leader-contact span';
  const fields = [...document.querySelectorAll(editableSelector)]
    .filter(el => !el.closest('nav, footer, #edit-toolbar, #comments-section') && el.textContent.trim());

  fields.forEach((el, index) => el.dataset.editable = `${page}:${index}`);
  
  try {
    const { data: content } = await db.from('site_content').select('key,value').eq('page', page);
    (content || []).forEach(row => {
      const el = document.querySelector(`[data-editable="${CSS.escape(row.key)}"]`);
      if (el) el.innerHTML = row.value;
    });
  } catch (e) {
    console.warn('Could not load site content:', e);
  }

  // 2. Аутентификация и профиль пользователя
  const { data: { session } } = await db.auth.getSession();
  
  if (session) {
    const email = session.user.email.toLowerCase();
    const username = email.split('@')[0];
    const avatarUrl = `https://www.gravatar.com/avatar/${md5Hex(email)}?d=mp&s=80`;

    // Синхронизация кнопки входа в шапке (Профиль пользователя)
    const loginBtns = document.querySelectorAll('.btn-login-link');
    loginBtns.forEach(btn => {
      btn.href = 'admin/dashboard.html';
      btn.style.display = 'inline-flex';
      btn.style.alignItems = 'center';
      btn.style.gap = '8px';
      btn.innerHTML = `<img src="${avatarUrl}" alt="Avatar" style="width:22px;height:22px;border-radius:50%;object-fit:cover;border:1px solid #f59e0b;">
                       <span>${username}</span>`;
      btn.title = `Авторизовано як ${email}`;
    });

    // 3. Инлайн-редактирование для админов
    const { data: member } = await db.from('admin_users').select('role').eq('email', email).maybeSingle();
    if (member && ['admin','super_admin'].includes(member.role)) {
      setupInlineEditor(db, page, fields, email);
    }
  }

  // 4. Инициализация блока комментариев
  initCommentsSection(db, page, session);
})();

function md5Hex(str) {
  // Простой хешер для Gravatar аватарок
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

function setupInlineEditor(db, page, fields, email) {
  const style = document.createElement('style');
  style.textContent = `#edit-toolbar{position:fixed;right:20px;bottom:20px;z-index:9999;display:flex;gap:8px;align-items:center;font:14px system-ui}#edit-toolbar button,#edit-toolbar a{border:0;border-radius:7px;padding:10px 13px;color:#fff;text-decoration:none;cursor:pointer;background:#0f2942;box-shadow:0 4px 12px rgba(0,0,0,0.15)}#edit-toolbar .save{background:#16803a;display:none}body.edit-mode [data-editable]{outline:2px dashed #2563eb;outline-offset:3px;cursor:text}body.edit-mode [data-editable]:focus{outline-color:#16803a}`;
  document.head.append(style);

  const bar = document.createElement('div');
  bar.id = 'edit-toolbar';
  bar.innerHTML = `<a href="admin/dashboard.html"><i class="fa-solid fa-gauge"></i> Адмін-панель</a><button class="save"><i class="fa-solid fa-floppy-disk"></i> Зберегти зміни</button><button class="toggle"><i class="fa-solid fa-pen-to-square"></i> Редагувати сайт</button>`;
  document.body.append(bar);

  const toggle = bar.querySelector('.toggle'), save = bar.querySelector('.save');
  let active = false;

  toggle.onclick = () => {
    active = !active;
    document.body.classList.toggle('edit-mode', active);
    fields.forEach(el => el.contentEditable = String(active));
    toggle.innerHTML = active ? '<i class="fa-solid fa-xmark"></i> Вийти з редагування' : '<i class="fa-solid fa-pen-to-square"></i> Редагувати сайт';
    save.style.display = active ? 'block' : 'none';
  };

  save.onclick = async () => {
    save.disabled = true; save.textContent = 'Зберігаю…';
    const rows = fields.map(el => ({
      key: el.dataset.editable,
      page,
      value: el.innerHTML,
      updated_by: email,
      updated_at: new Date().toISOString()
    }));
    
    const { error } = await db.from('site_content').upsert(rows, { onConflict: 'key' });
    if (error) {
      alert(`Помилка збереження: ${error.message}`);
    } else {
      alert('✅ Зміни на сайті успішно збережено!');
    }
    save.disabled = false;
    save.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Зберегти зміни';
  };
}

async function initCommentsSection(db, page, session) {
  const mainCol = document.querySelector('.primary-column') || document.querySelector('main');
  if (!mainCol) return;

  const section = document.createElement('section');
  section.id = 'comments-section';
  section.className = 'content-block';
  section.style.cssText = 'padding:20px; margin-top:24px; border-top:3px solid #1a365d;';

  const userEmail = session ? session.user.email.toLowerCase() : null;

  section.innerHTML = `
    <div class="block-header" style="display:flex; justify-content:space-between; align-items:center;">
      <h2><i class="fa-solid fa-comments"></i> Обговорення та відгуки</h2>
    </div>
    
    ${session ? `
      <form id="comment-form" style="margin-bottom:20px; background:#f8fafc; padding:14px; border-radius:6px; border:1px solid #e2e8f0;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px; font-weight:600; font-size:0.85rem; color:#1e293b;">
          <img src="https://www.gravatar.com/avatar/${md5Hex(userEmail)}?d=mp&s=60" style="width:24px;height:24px;border-radius:50%;">
          <span>Ваш коментар (${userEmail}):</span>
        </div>
        <textarea id="comment-text" rows="3" required placeholder="Напишіть ваш коментар чи запитання..." style="width:100%; padding:8px 10px; border:1px solid #cbd5e1; border-radius:4px; font-size:0.88rem; outline:none; font-family:inherit;"></textarea>
        <button type="submit" style="margin-top:8px; background:#1a365d; color:#fff; border:0; padding:8px 16px; border-radius:4px; font-weight:700; cursor:pointer; font-size:0.85rem;">
          <i class="fa-solid fa-paper-plane"></i> Надіслати коментар
        </button>
      </form>
    ` : `
      <div style="background:#eff6ff; border:1px solid #bfdbfe; color:#1e3a5f; padding:12px; border-radius:6px; margin-bottom:20px; font-size:0.88rem;">
        <i class="fa-solid fa-lock"></i> Щоб залишити коментар, будь ласка, <a href="admin/login.html" style="font-weight:700; color:#1d4ed8;">увійдіть в акаунт</a>.
      </div>
    `}

    <div id="comments-list" style="display:flex; flex-direction:column; gap:12px;">
      <div style="color:#64748b; font-size:0.85rem;">Завантаження коментарів...</div>
    </div>
  `;

  mainCol.appendChild(section);

  // Проверка роли пользователя
  let currentUserRole = null;
  if (userEmail) {
    const { data: member } = await db.from('admin_users').select('role').eq('email', userEmail).maybeSingle();
    currentUserRole = member ? member.role : null;
  }

  // Загрузка комментариев
  async function loadComments() {
    const listEl = document.getElementById('comments-list');
    try {
      const { data: comments, error } = await db.from('comments').select('*').eq('page', page).order('created_at', { ascending: false });
      if (error) throw error;

      if (!comments || comments.length === 0) {
        listEl.innerHTML = '<div style="color:#94a3b8; font-size:0.85rem;">Коментарів поки немає. Будьте першим!</div>';
        return;
      }

      listEl.innerHTML = comments.map(c => {
        const canDelete = currentUserRole === 'super_admin' || currentUserRole === 'admin' || (userEmail && userEmail === c.author_email);
        const name = c.author_email.split('@')[0];
        const dateStr = new Date(c.created_at).toLocaleString('uk-UA', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
        return `
          <div style="background:#fff; border:1px solid #e2e8f0; padding:12px 14px; border-radius:6px; position:relative;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <img src="https://www.gravatar.com/avatar/${md5Hex(c.author_email)}?d=mp&s=60" style="width:26px;height:26px;border-radius:50%;">
                <strong style="font-size:0.88rem; color:#0f172a;">${name}</strong>
                <span style="font-size:0.75rem; color:#94a3b8;">(${dateStr})</span>
              </div>
              ${canDelete ? `<button onclick="deleteComment('${c.id}')" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:0.8rem;" title="Видалити коментар"><i class="fa-solid fa-trash"></i></button>` : ''}
            </div>
            <div style="font-size:0.88rem; color:#334155; line-height:1.5; white-space:pre-wrap;">${escapeHTML(c.content)}</div>
          </div>
        `;
      }).join('');
    } catch (e) {
      listEl.innerHTML = '<div style="color:#94a3b8; font-size:0.85rem;">Коментарів поки немає.</div>';
    }
  }

  window.deleteComment = async (id) => {
    if (!confirm('Видалити цей коментар?')) return;
    await db.from('comments').delete().eq('id', id);
    loadComments();
  };

  const form = document.getElementById('comment-form');
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const input = document.getElementById('comment-text');
      const text = input.value.trim();
      if (!text) return;

      const { error } = await db.from('comments').insert({
        page,
        author_email: userEmail,
        content: text,
        created_at: new Date().toISOString()
      });

      if (error) {
        alert('Помилка при додаванні коментаря: ' + error.message);
      } else {
        input.value = '';
        loadComments();
      }
    };
  }

  loadComments();
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
