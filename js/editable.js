/* Inline editor & Auth header sync & Comments for school administrators and users. */
(async () => {
  if (!window.supabase || !window.SUPABASE_URL) return;
  const db = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  const page = location.pathname === '/' || location.pathname.endsWith('/') ? '/index.html' : location.pathname;

  console.log('[editable.js] Page key:', page);

  // 1. Загрузка измененных текстов
  const editableSelector = 'h1,h2,h3,h4,p,li,td,th,.contact-item,.top-contacts span,.leader-contact span';
  const fields = [...document.querySelectorAll(editableSelector)]
    .filter(el => !el.closest('nav, footer, #edit-toolbar, #comments-section') && el.textContent.trim());

  fields.forEach((el, index) => el.dataset.editable = `${page}:${index}`);
  
  try {
    const { data: content } = await db.from('site_content').select('key,value').eq('page', page);
    (content || []).forEach(row => {
      const el = document.querySelector(`[data-editable="${CSS.escape(row.key)}"]`);
      if (el) el.innerHTML = sanitizeEditableHtml(row.value);
    });
  } catch (e) {
    console.warn('[editable.js] Could not load site content:', e);
  }

  // 2. Аутентификация и профиль пользователя
  // Try getSession first, then listen for auth state changes
  let currentSession = null;
  const { data: { session } } = await db.auth.getSession();
  currentSession = session;

  // Also listen for auth state changes (handles redirects, token refresh)
  db.auth.onAuthStateChange((event, sess) => {
    console.log('[editable.js] Auth state changed:', event);
    if (event === 'SIGNED_IN' && !currentSession && sess) {
      currentSession = sess;
      // Re-init if we just got a session
      location.reload();
    }
  });

  if (currentSession) {
    const email = currentSession.user.email.toLowerCase();
    const username = email.split('@')[0];
    const avatarUrl = `https://www.gravatar.com/avatar/${md5Hex(email)}?d=mp&s=80`;

    console.log('[editable.js] Authenticated as:', email);

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
    // Check admin_users table first
    let isAdmin = false;
    try {
      const { data: member, error: memberErr } = await db.from('admin_users').select('role').eq('email', email).maybeSingle();
      if (memberErr) {
        console.warn('[editable.js] admin_users query error:', memberErr.message);
      }
      if (member && ['admin','super_admin'].includes(member.role)) {
        isAdmin = true;
        console.log('[editable.js] Admin role confirmed from DB:', member.role);
      }
    } catch (e) {
      console.warn('[editable.js] admin_users check failed:', e);
    }

    // Fallback: check SUPER_ADMIN_EMAIL from config
    if (!isAdmin && window.SUPER_ADMIN_EMAIL && email === window.SUPER_ADMIN_EMAIL.toLowerCase()) {
      isAdmin = true;
      console.log('[editable.js] Admin confirmed via SUPER_ADMIN_EMAIL fallback');
    }

    if (isAdmin) {
      setupInlineEditor(db, page, fields, email, currentSession);
    } else {
      console.log('[editable.js] User is not an admin, editor not activated');
    }
  } else {
    console.log('[editable.js] No active session');
  }

  // 4. Инициализация блока комментариев
  initCommentsSection(db, page, currentSession);
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

function setupInlineEditor(db, page, fields, email, session) {
  const style = document.createElement('style');
  style.textContent = `#edit-toolbar{position:fixed;right:20px;bottom:20px;z-index:9999;display:flex;gap:8px;align-items:center;font:14px system-ui}#edit-toolbar button,#edit-toolbar a{border:0;border-radius:7px;padding:10px 13px;color:#fff;text-decoration:none;cursor:pointer;background:#0f2942;box-shadow:0 4px 12px rgba(0,0,0,0.15)}#edit-toolbar .save{background:#16803a;display:none}#edit-toolbar .status{font-size:12px;color:#94a3b8;max-width:200px;text-align:right}body.edit-mode [data-editable]{outline:2px dashed #2563eb;outline-offset:3px;cursor:text}body.edit-mode [data-editable]:focus{outline-color:#16803a}`;
  document.head.append(style);

  const bar = document.createElement('div');
  bar.id = 'edit-toolbar';
  bar.innerHTML = `<span class="status">✅ Режим адміна</span><a href="admin/dashboard.html"><i class="fa-solid fa-gauge"></i> Адмін-панель</a><button class="save"><i class="fa-solid fa-floppy-disk"></i> Зберегти зміни</button><button class="toggle"><i class="fa-solid fa-pen-to-square"></i> Редагувати сайт</button>`;
  document.body.append(bar);

  const toggle = bar.querySelector('.toggle'), save = bar.querySelector('.save'), status = bar.querySelector('.status');
  let active = false;

  toggle.onclick = () => {
    active = !active;
    document.body.classList.toggle('edit-mode', active);
    fields.forEach(el => el.contentEditable = String(active));
    toggle.innerHTML = active ? '<i class="fa-solid fa-xmark"></i> Вийти з редагування' : '<i class="fa-solid fa-pen-to-square"></i> Редагувати сайт';
    save.style.display = active ? 'block' : 'none';
    status.textContent = active ? '✏️ Режим редагування' : '✅ Режим адміна';
  };

  save.onclick = async () => {
    save.disabled = true;
    save.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Зберігаю…';
    status.textContent = '⏳ Збереження...';

    // Refresh session before save to ensure token is fresh
    const { data: { session: freshSession } } = await db.auth.getSession();
    if (!freshSession) {
      alert('❌ Сесія закінчилась. Будь ласка, увійдіть знову.');
      status.textContent = '❌ Сесія закінчилась';
      save.disabled = false;
      save.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Зберегти зміни';
      return;
    }

    const rows = fields.map(el => ({
      key: el.dataset.editable,
      page,
      value: sanitizeEditableHtml(el.innerHTML),
      updated_by: email,
      updated_at: new Date().toISOString()
    }));

    console.log('[editable.js] Saving', rows.length, 'fields...');
    
    const { error } = await db.from('site_content').upsert(rows, { onConflict: 'key' });
    if (error) {
      console.error('[editable.js] Save error:', error);
      alert(`❌ Помилка збереження: ${error.message}\n\nКод: ${error.code || 'N/A'}\nДеталі: ${error.details || 'N/A'}\nПідказка: ${error.hint || 'N/A'}`);
      status.textContent = '❌ Помилка збереження';
    } else {
      console.log('[editable.js] Save successful!');
      alert('✅ Зміни на сайті успішно збережено!');
      status.textContent = '✅ Збережено!';
    }
    save.disabled = false;
    save.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Зберегти зміни';
  };
}


function sanitizeEditableHtml(html) {
  if (window.DOMPurify) {
    return window.DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['a', 'b', 'br', 'em', 'i', 'span', 'strong', 'u', 'p'],
      ALLOWED_ATTR: ['href', 'title', 'target', 'rel']
    });
  }

  const allowedTags = new Set(['A', 'B', 'BR', 'EM', 'I', 'SPAN', 'STRONG', 'U', 'P']);
  const template = document.createElement('template');
  template.innerHTML = html;

  template.content.querySelectorAll('*').forEach(element => {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(...element.childNodes);
      return;
    }

    [...element.attributes].forEach(attribute => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();
      const allowedLinkAttribute = element.tagName === 'A'
        && ['href', 'title', 'target', 'rel'].includes(name);

      if (!allowedLinkAttribute) {
        element.removeAttribute(attribute.name);
        return;
      }

      if (name === 'href' && !/^(https?:|mailto:|\/|#)/i.test(value)) {
        element.removeAttribute('href');
      }
    });

    if (element.tagName === 'A' && element.getAttribute('target') === '_blank') {
      element.setAttribute('rel', 'noopener noreferrer');
    }
  });

  return template.innerHTML;
}

async function initCommentsSection(db, page, session) {
  const mainCol = document.querySelector('.primary-column') || document.querySelector('main');
  if (!mainCol) return;

  const section = document.createElement('section');
  section.id = 'comments-section';
  section.className = 'content-block';
  section.style.cssText = 'padding:20px; margin-top:24px; border-top:3px solid #1a365d;';

  const user = session ? session.user : null;
  const isAuth = !!user;
  const userEmail = user ? user.email.toLowerCase() : null;
  const userName = user ? (user.user_metadata?.full_name || user.user_metadata?.name || userEmail.split('@')[0]) : 'Гість';
  const userAvatar = user ? (user.user_metadata?.avatar_url || user.user_metadata?.picture || `https://www.gravatar.com/avatar/${md5Hex(userEmail)}?d=mp&s=60`) : null;

  // Make sure Turnstile API script is loaded
  if (!window.turnstile && !document.querySelector('script[src*="turnstile"]')) {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }

  section.innerHTML = `
    <div class="block-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
      <h2><i class="fa-solid fa-comments"></i> Обговорення та відгуки</h2>
    </div>

    ${isAuth ? `
      <form id="comment-form" style="margin-bottom:24px; background:#f8fafc; padding:16px; border-radius:6px; border:1px solid #e2e8f0;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
          <div style="display:flex; align-items:center; gap:10px; font-weight:600; font-size:0.88rem; color:#1e293b;">
            <img src="${userAvatar}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;border:1px solid #cbd5e1;">
            <span>${escapeHTML(userName)} <span style="font-size:0.75rem; color:#64748b; font-weight:normal;">(${userEmail})</span></span>
          </div>
          <button type="button" id="logout-comment-btn" style="background:none; border:none; color:#64748b; cursor:pointer; font-size:0.8rem; text-decoration:underline;">
            <i class="fa-solid fa-right-from-bracket"></i> Вийти
          </button>
        </div>

        <div style="margin-bottom:12px;">
          <label style="display:block; font-size:0.82rem; font-weight:600; color:#334155; margin-bottom:4px;">Текст відгуку чи запитання:</label>
          <textarea id="comment-text" rows="3" required placeholder="Напишіть ваш відгук, враження чи запитання..." style="width:100%; padding:8px 10px; border:1px solid #cbd5e1; border-radius:4px; font-size:0.88rem; outline:none; font-family:inherit;"></textarea>
        </div>

        <div style="margin-bottom:12px; display:flex; justify-content:flex-start;">
          <div class="cf-turnstile" data-sitekey="0x4AAAAAAEV0LFYhuw2h7WOY" data-theme="light"></div>
        </div>

        <div id="comment-feedback" style="font-size:0.82rem; margin-bottom:10px; display:none;"></div>

        <button type="submit" id="comment-submit-btn" style="background:#1a365d; color:#fff; border:0; padding:9px 20px; border-radius:4px; font-weight:700; cursor:pointer; font-size:0.88rem; display:inline-flex; align-items:center; gap:8px;">
          <i class="fa-solid fa-paper-plane"></i> Опублікувати відгук
        </button>
      </form>
    ` : `
      <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:20px; border-radius:8px; margin-bottom:24px; text-align:center;">
        <p style="font-size:0.92rem; color:#334155; margin-bottom:14px; font-weight:500;">
          Увійдіть через акаунт Google, щоб залишити відгук чи ставити запитання адміністрації.
        </p>
        <button id="google-login-comment-btn" style="background:#ffffff; color:#334155; border:1px solid #cbd5e1; padding:10px 20px; border-radius:6px; font-weight:600; font-size:0.9rem; cursor:pointer; display:inline-flex; align-items:center; gap:10px; box-shadow:0 1px 3px rgba(0,0,0,0.08); transition:background 0.2s;">
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
          Увійти через Google
        </button>
      </div>
    `}

    <div id="comments-list" style="display:flex; flex-direction:column; gap:12px;">
      <div style="color:#64748b; font-size:0.85rem;">Завантаження відгуків...</div>
    </div>
  `;

  mainCol.appendChild(section);

  // Google Login button handler
  document.getElementById('google-login-comment-btn')?.addEventListener('click', async () => {
    try {
      await db.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.href }
      });
    } catch (e) {
      alert('Помилка входу через Google: ' + e.message);
    }
  });

  // Logout button handler
  document.getElementById('logout-comment-btn')?.addEventListener('click', async () => {
    await db.auth.signOut();
    location.reload();
  });

  // Check admin role for delete rights
  let currentUserRole = null;
  if (userEmail) {
    try {
      const { data: member } = await db.from('admin_users').select('role').eq('email', userEmail).maybeSingle();
      currentUserRole = member ? member.role : null;
    } catch (e) {}
    if (!currentUserRole && window.SUPER_ADMIN_EMAIL && userEmail === window.SUPER_ADMIN_EMAIL.toLowerCase()) {
      currentUserRole = 'super_admin';
    }
  }

  // Load comments
  async function loadComments() {
    const listEl = document.getElementById('comments-list');
    try {
      const { data: comments, error } = await db.from('comments').select('*').eq('page', page).order('created_at', { ascending: false });
      if (error) throw error;

      if (!comments || comments.length === 0) {
        listEl.innerHTML = '<div style="color:#94a3b8; font-size:0.85rem;">Відгуків поки немає. Будьте першим, хто залишить відгук!</div>';
        return;
      }

      listEl.innerHTML = comments.map(c => {
        const canDelete = currentUserRole === 'super_admin' || currentUserRole === 'admin' || (userEmail && c.author_email && userEmail === c.author_email.toLowerCase());
        const authorName = c.author_name || (c.author_email ? c.author_email.split('@')[0] : 'Користувач');
        const dateStr = new Date(c.created_at).toLocaleString('uk-UA', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
        const avatarUrl = c.author_email ? `https://www.gravatar.com/avatar/${md5Hex(c.author_email)}?d=mp&s=60` : null;

        return `
          <div style="background:#fff; border:1px solid #e2e8f0; padding:14px 16px; border-radius:6px; position:relative; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <div style="display:flex; align-items:center; gap:10px;">
                ${avatarUrl ? `<img src="${avatarUrl}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;">` : '<i class="fa-solid fa-circle-user" style="font-size:1.5rem; color:#94a3b8;"></i>'}
                <div>
                  <strong style="font-size:0.9rem; color:#0f172a; display:block;">${escapeHTML(authorName)}</strong>
                  <span style="font-size:0.72rem; color:#94a3b8;">${dateStr}</span>
                </div>
              </div>
              ${canDelete ? `<button onclick="deleteComment('${c.id}')" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:0.85rem; padding:4px;" title="Видалити відгук"><i class="fa-solid fa-trash"></i></button>` : ''}
            </div>
            <div style="font-size:0.88rem; color:#334155; line-height:1.5; white-space:pre-wrap;">${escapeHTML(c.content)}</div>
          </div>
        `;
      }).join('');
    } catch (e) {
      listEl.innerHTML = '<div style="color:#94a3b8; font-size:0.85rem;">Відгуків поки немає.</div>';
    }
  }

  window.deleteComment = async (id) => {
    if (!confirm('Видалити цей відгук?')) return;
    await db.from('comments').delete().eq('id', id);
    loadComments();
  };

  const form = document.getElementById('comment-form');
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();

      const feedbackEl = document.getElementById('comment-feedback');
      const submitBtn = document.getElementById('comment-submit-btn');

      // Rate limit
      const lastCommentTime = localStorage.getItem('last_comment_time');
      const now = Date.now();
      if (lastCommentTime && (now - parseInt(lastCommentTime, 10) < 20000)) {
        const waitSec = Math.ceil((20000 - (now - parseInt(lastCommentTime, 10))) / 1000);
        feedbackEl.style.display = 'block';
        feedbackEl.style.color = '#dc2626';
        feedbackEl.textContent = `Зачекайте ${waitSec} сек. перед додаванням наступного відгуку.`;
        return;
      }

      const input = document.getElementById('comment-text');
      const text = input.value.trim();
      if (!text) return;

      // Get Turnstile token
      const turnstileInput = form.querySelector('[name="cf-turnstile-response"]');
      const turnstileToken = turnstileInput ? turnstileInput.value : '';

      if (!turnstileToken) {
        feedbackEl.style.display = 'block';
        feedbackEl.style.color = '#dc2626';
        feedbackEl.textContent = 'Будь ласка, пройдіть перевірку безпеки (капчу).';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Відправка...';
      feedbackEl.style.display = 'none';

      try {
        const { data, error } = await db.rpc('submit_comment_secure', {
          p_page: page,
          p_author_name: userName,
          p_content: text,
          p_turnstile_token: turnstileToken
        });

        if (error) throw error;

        localStorage.setItem('last_comment_time', Date.now().toString());
        input.value = '';

        feedbackEl.style.display = 'block';
        feedbackEl.style.color = '#166534';
        feedbackEl.textContent = '✅ Ваш відгук успішно опубліковано!';
        setTimeout(() => { feedbackEl.style.display = 'none'; }, 4000);

        if (window.turnstile) { try { turnstile.reset(); } catch(err) {} }
        loadComments();
      } catch (err) {
        feedbackEl.style.display = 'block';
        feedbackEl.style.color = '#dc2626';
        feedbackEl.textContent = '❌ Помилка: ' + (err.message || 'Не вдалося опублікувати відгук.');
        if (window.turnstile) { try { turnstile.reset(); } catch(err) {} }
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Опублікувати відгук';
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
