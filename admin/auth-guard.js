(async () => {
    try {
        if (!window.supabase || !window.SUPABASE_URL) {
            location.href = 'login.html';
            return;
        }
        const db = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
        const { data: { session } } = await db.auth.getSession();
        if (!session) {
            location.href = 'login.html';
        } else {
            document.documentElement.style.display = 'block';
            document.body.style.display = 'block';
        }
    } catch (e) {
        location.href = 'login.html';
    }
})();
