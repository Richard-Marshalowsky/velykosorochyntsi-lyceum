/* Inline editor & Auth header sync for school administrators. */
(async () => {
  if (!window.supabase || !window.SUPABASE_URL) return;
  const db = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  const page = location.pathname === '/' ? '/index.html' : location.pathname;
  const editableSelector = 'h1,h2,h3,h4,p,li,td,th,.contact-item,.top-contacts span,.leader-contact span';
  const fields = [...document.querySelectorAll(editableSelector)]
    .filter(el => !el.closest('nav, footer, #edit-toolbar') && el.textContent.trim());

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

  const { data: { session } } = await db.auth.getSession();
  if (!session) return;

  const email = session.user.email.toLowerCase();
  
  // Оновлюємо кнопку входу в шапці сайту
  const loginBtns = document.querySelectorAll('.btn-login-link');
  loginBtns.forEach(btn => {
    btn.href = 'admin/dashboard.html';
    btn.innerHTML = `<i class="fa-solid fa-user-shield"></i> Адмін-панель (${email.split('@')[0]})`;
    btn.title = `Авторизовано як ${email}`;
  });

  const { data: member } = await db.from('admin_users').select('role').eq('email', email).maybeSingle();
  if (!member || !['admin','super_admin'].includes(member.role)) return;

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
    active = !active; document.body.classList.toggle('edit-mode', active);
    fields.forEach(el => el.contentEditable = String(active));
    toggle.innerHTML = active ? '<i class="fa-solid fa-xmark"></i> Вийти з редагування' : '<i class="fa-solid fa-pen-to-square"></i> Редагувати сайт';
    save.style.display = active ? 'block' : 'none';
  };

  save.onclick = async () => {
    save.disabled = true; save.textContent = 'Зберігаю…';
    const rows = fields.map(el => ({ key: el.dataset.editable, page, value: el.innerHTML, updated_by: email, updated_at: new Date().toISOString() }));
    
    // Перевіряємо та використовуємо активну сесію
    const { error } = await db.from('site_content').upsert(rows, { onConflict: 'key' });
    if (error) {
      alert(`Помилка збереження: ${error.message}\nПеревірте RLS політики в Supabase або увійдіть повторно.`);
    } else {
      fields.forEach(el => {
        const link = el.closest('a');
        if (link?.href.startsWith('tel:')) link.href = `tel:${el.textContent.replace(/\D/g, '')}`;
        if (link?.href.startsWith('mailto:')) link.href = `mailto:${el.textContent.trim()}`;
      });
      alert('✅ Зміни на сайті успішно збережено!');
    }
    save.disabled = false;
    save.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Зберегти зміни';
  };
})();
