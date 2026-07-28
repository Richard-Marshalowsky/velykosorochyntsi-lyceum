/* Inline editor for approved school administrators. */
(async () => {
  if (!window.supabase || !window.SUPABASE_URL) return;
  const db = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  const page = location.pathname === '/' ? '/index.html' : location.pathname;
  const editableSelector = 'h1,h2,h3,h4,p,li,td,th,.contact-item,.top-contacts span,.leader-contact span';
  const fields = [...document.querySelectorAll(editableSelector)]
    .filter(el => !el.closest('nav, footer, #edit-toolbar') && el.textContent.trim());

  fields.forEach((el, index) => el.dataset.editable = `${page}:${index}`);
  const { data: content } = await db.from('site_content').select('key,value').eq('page', page);
  (content || []).forEach(row => {
    const el = document.querySelector(`[data-editable="${CSS.escape(row.key)}"]`);
    if (el) el.innerHTML = row.value;
  });

  const { data: { session } } = await db.auth.getSession();
  if (!session) return;
  const email = session.user.email.toLowerCase();
  const { data: member } = await db.from('admin_users').select('role').eq('email', email).maybeSingle();
  if (!member || !['admin','super_admin'].includes(member.role)) return;

  const style = document.createElement('style');
  style.textContent = `#edit-toolbar{position:fixed;right:20px;bottom:20px;z-index:9999;display:flex;gap:8px;align-items:center;font:14px system-ui}#edit-toolbar button,#edit-toolbar a{border:0;border-radius:7px;padding:10px 13px;color:#fff;text-decoration:none;cursor:pointer;background:#12385f}#edit-toolbar .save{background:#16803a;display:none}body.edit-mode [data-editable]{outline:2px dashed #2563eb;outline-offset:3px;cursor:text}body.edit-mode [data-editable]:focus{outline-color:#16803a}`;
  document.head.append(style);
  const bar = document.createElement('div');
  bar.id = 'edit-toolbar';
  bar.innerHTML = `<a href="/admin/dashboard.html">Адмін-панель</a><button class="save">Зберегти зміни</button><button class="toggle">Редагувати сайт</button>`;
  document.body.append(bar);
  const toggle = bar.querySelector('.toggle'), save = bar.querySelector('.save');
  let active = false;
  toggle.onclick = () => {
    active = !active; document.body.classList.toggle('edit-mode', active);
    fields.forEach(el => el.contentEditable = String(active));
    toggle.textContent = active ? 'Вийти з редагування' : 'Редагувати сайт';
    save.style.display = active ? 'block' : 'none';
  };
  save.onclick = async () => {
    save.disabled = true; save.textContent = 'Зберігаю…';
    const rows = fields.map(el => ({ key: el.dataset.editable, page, value: el.innerHTML, updated_by: email }));
    const { error } = await db.from('site_content').upsert(rows, { onConflict: 'key' });
    if (error) alert(`Не вдалося зберегти: ${error.message}`);
    else { fields.forEach(el => { const link = el.closest('a'); if (link?.href.startsWith('tel:')) link.href = `tel:${el.textContent.replace(/\D/g, '')}`; if (link?.href.startsWith('mailto:')) link.href = `mailto:${el.textContent.trim()}`; }); alert('Зміни збережено'); }
    save.disabled = false; save.textContent = 'Зберегти зміни';
  };
})();
