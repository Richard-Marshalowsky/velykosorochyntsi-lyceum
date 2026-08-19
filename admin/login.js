// Admin login page logic
document.addEventListener('DOMContentLoaded', () => {
    if (!window.supabase || !window.SUPABASE_URL) return;

    const { createClient } = window.supabase;
    const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Якщо вже залогінений — редирект одразу на дашборд
    db.auth.getSession().then(({ data: { session } }) => {
        if (session) window.location.href = 'dashboard.html';
    });

    // === BRUTE-FORCE PROTECTION: persistent cross-tab backoff ===
    let loginFailures = parseInt(localStorage.getItem('login_failures') || '0', 10);
    let lockedUntil = parseInt(localStorage.getItem('login_locked_until') || '0', 10);

    function getBackoffDelay(failures) {
        if (failures <= 0) return 0;
        return Math.min(2 ** failures * 1000, 30000);
    }

    const form = document.getElementById('login-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const btn = document.getElementById('login-btn');
            const errorEl = document.getElementById('error-msg');

            // Check lockout
            const now = Date.now();
            if (lockedUntil > now) {
                const secsLeft = Math.ceil((lockedUntil - now) / 1000);
                errorEl.textContent = `⏳ Забагато невдалих спроб. Зачекайте ${secsLeft} сек. перед наступною спробою.`;
                errorEl.classList.add('show');
                return;
            }

            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Вхід...';
            errorEl.classList.remove('show');

            const { data, error } = await db.auth.signInWithPassword({ email, password });

            if (error) {
                loginFailures++;
                const delay = getBackoffDelay(loginFailures);
                lockedUntil = Date.now() + delay;
                localStorage.setItem('login_failures', loginFailures.toString());
                localStorage.setItem('login_locked_until', lockedUntil.toString());

                let msg = 'Невірний email або пароль. Перевірте дані та спробуйте ще раз.';
                if (loginFailures >= 3 && delay > 0) {
                    msg += ` (Спроба ${loginFailures}. Наступна спроба через ${delay / 1000} сек.)`;
                }
                errorEl.textContent = msg;
                errorEl.classList.add('show');
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Увійти';
                return;
            }

            // Успішний вхід — скидаємо лічильник і редиректимо
            localStorage.removeItem('login_failures');
            localStorage.removeItem('login_locked_until');
            window.location.href = 'dashboard.html';
        });
    }
});
