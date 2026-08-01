# Robot Memory Admin — relocate under the API domain (cookie session)

**For:** a Claude Code instance working in the **`robo-buddy-api`** repo (Vercel).

**Why:** we want a hidden admin page to view/prune the robot's shared memory **without pasting
the token every visit**. The page can't live on `robboyett.github.io` and use a session cookie,
because that would be a cross-site cookie (`buddy.robboyett.com` cookie on a `github.io` page) —
browsers block those. So the admin page **moves into this repo** and is served from
`buddy.robboyett.com/admin`, making its calls to `/api/memory` **same-origin**. That lets us use a
proper **httpOnly session cookie**: paste the token once → the API sets a signed cookie the browser
sends automatically → no re-paste, and the session is never readable by JavaScript.

(The static-site version has been removed from `robboyett.github.io`.)

## Backend tasks

### 1. Serve the admin page at `/admin`
Add `public/admin/index.html` (or wherever this project serves static assets) with the HTML at the
end of this doc, or add a `vercel.json` rewrite mapping `/admin` → that file. It must be served from
`buddy.robboyett.com` so it's same-origin with the API.

### 2. `POST /api/admin/login`
- Body: `{ "token": "..." }`.
- If `ADMIN_TOKEN` env is unset → **503** (endpoint disabled, same rule as `/api/memory`).
- **Constant-time** compare `token` to `ADMIN_TOKEN`. Mismatch → **401**.
- Match → set the session cookie and return `200 { ok: true }`.

Cookie (stateless, signed — no server storage needed on serverless):
```
Set-Cookie: admin_session=<payload>.<sig>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000
```
where
```
payload = base64url(JSON.stringify({ exp: Date.now() + 2592000_000 }))
sig     = base64url(HMAC_SHA256(payload, SESSION_SECRET))
```
Use a dedicated `SESSION_SECRET` env (or derive one from `ADMIN_TOKEN`). 30-day Max-Age is a
reasonable default.

### 3. `POST /api/admin/logout`
- Clear it: `Set-Cookie: admin_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`. Return `200`.

### 4. `GET` / `DELETE /api/memory` — accept the cookie *or* the existing token
Authorise a request if **either**:
- a valid `admin_session` cookie (verify the HMAC and that `exp` is in the future) — used by the admin page, **or**
- the existing `Authorization: Bearer` / `X-Admin-Token` / `?token=` — keep this for curl/scripts.

Neither valid → **401**. `ADMIN_TOKEN` unset → **503** (unchanged).

### 5. CORS / origin
The admin page is now **same-origin** with the API, so its `/api/memory` and `/api/admin/*` calls need
no CORS. Keep the existing allowlist for `/api/buddy` (the public site). As defence-in-depth for the
cookie-authed routes, you can also require same-origin (check `Sec-Fetch-Site: same-origin`, or
`Origin`/`Referer` against `buddy.robboyett.com`).

## Security notes
- **`HttpOnly`** → JS (and any XSS) cannot read the session cookie. **`Secure`** → HTTPS only.
  **`SameSite=Strict`** → the cookie isn't sent on cross-site requests, so the `DELETE` actions are
  safe from CSRF; same-origin admin fetches still send it.
- **Never put the raw `ADMIN_TOKEN` in the cookie** — sign a short `{exp}` payload as above.
- The token only exists in browser JS during the one-time login `POST`, then it's discarded; the
  session is the httpOnly cookie thereafter.
- The admin page is hidden by obscurity + `noindex`, but the real gate is the token/cookie — don't
  rely on the path being secret.

## Env
- `ADMIN_TOKEN` — long random string (already added per the memory work).
- `SESSION_SECRET` — long random string for signing the cookie (add to `.env.example` + Vercel).

---

## Admin page — `public/admin/index.html`

Same-origin, cookie-session flow: on load it probes `GET /api/memory` (cookie sent automatically); if
that succeeds you're already in — no paste. Otherwise it shows the login form; you paste the token
once, it `POST`s to `/api/admin/login`, and the cookie takes over from there.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>Robot memory — admin</title>
<style>
  :root { --bg:#f4f4f5; --card:#fff; --ink:#18181b; --muted:#71717a; --line:#e4e4e7; --danger:#dc2626; --accent:#2563eb; }
  * { box-sizing: border-box; }
  body { margin:0; padding:40px 20px; background:var(--bg); color:var(--ink);
    font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; -webkit-font-smoothing:antialiased; }
  .wrap { max-width:720px; margin:0 auto; }
  h1 { font-size:20px; margin:0 0 4px; letter-spacing:-0.01em; }
  .sub { color:var(--muted); font-size:13px; margin:0 0 24px; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:20px; }
  label { display:block; font-size:13px; font-weight:600; margin-bottom:8px; }
  input[type=password] { width:100%; padding:10px 12px; font-size:14px; font-family:inherit;
    border:1px solid var(--line); border-radius:9px; background:#fafafa; color:var(--ink); }
  input:focus { outline:2px solid var(--accent); outline-offset:1px; }
  button { font-family:inherit; font-size:13px; font-weight:600; cursor:pointer; border:1px solid var(--line);
    background:#fff; color:var(--ink); padding:8px 14px; border-radius:9px; }
  button:hover { background:#f4f4f5; }
  button:disabled { opacity:.5; cursor:default; }
  button.primary { background:var(--ink); color:#fff; border-color:var(--ink); }
  button.primary:hover { background:#000; }
  button.danger { color:var(--danger); border-color:#f1c9c9; }
  button.danger:hover { background:#fef2f2; }
  button.link { border:none; background:none; padding:4px 6px; color:var(--muted); }
  button.link:hover { color:var(--ink); text-decoration:underline; }
  .row { display:flex; gap:10px; align-items:center; }
  .grow { flex:1; }
  .hidden { display:none !important; }
  .toolbar { display:flex; flex-wrap:wrap; align-items:center; gap:12px; margin-bottom:16px; color:var(--muted); font-size:13px; }
  .toolbar .spacer { flex:1; }
  .fact { display:flex; gap:12px; align-items:flex-start; padding:12px 0; border-top:1px solid var(--line); }
  .fact:first-child { border-top:none; }
  .fact .text { flex:1; font-size:14px; line-height:1.45; white-space:pre-wrap; word-break:break-word; }
  .fact .idx { color:var(--muted); font-size:12px; font-variant-numeric:tabular-nums; min-width:22px; padding-top:2px; }
  .empty { color:var(--muted); font-size:14px; padding:8px 0; }
  .msg { font-size:13px; margin-top:14px; padding:10px 12px; border-radius:9px; }
  .msg.err { background:#fef2f2; color:var(--danger); border:1px solid #f1c9c9; }
  .msg.ok { background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; }
  .note { color:var(--muted); font-size:12px; margin-top:14px; line-height:1.5; }
</style>
</head>
<body>
  <div class="wrap">
    <h1>Robot memory</h1>
    <p class="sub">Shared memory the buddy has learned.</p>

    <section id="lock" class="card hidden">
      <label for="token">Admin token</label>
      <div class="row">
        <input class="grow" type="password" id="token" placeholder="Paste ADMIN_TOKEN once" autocomplete="off" spellcheck="false">
        <button class="primary" id="unlock">Sign in</button>
      </div>
      <p class="note">You'll only need this once — a secure session cookie keeps you signed in after.
        The token is sent only to sign in, never stored in the page.</p>
      <div id="lockMsg"></div>
    </section>

    <section id="panel" class="card hidden">
      <div class="toolbar">
        <span id="meta">—</span>
        <span class="spacer"></span>
        <button id="refresh">Refresh</button>
        <button class="danger" id="clearAll">Clear all</button>
        <button class="link" id="logout">Sign out</button>
      </div>
      <div id="facts"></div>
      <div id="panelMsg"></div>
    </section>
  </div>

<script>
(() => {
  const $ = (id) => document.getElementById(id);

  // Same-origin — the session cookie is sent automatically; no token in JS after login.
  async function mem(method, query) {
    let res;
    try { res = await fetch('/api/memory' + (query || ''), { method, credentials: 'same-origin' }); }
    catch (e) { throw new Error('Couldn’t reach the server.'); }
    if (res.status === 401) throw new Error('SESSION');
    if (res.status === 503) throw new Error('Admin is disabled on the server (ADMIN_TOKEN not set).');
    if (!res.ok) throw new Error('Server error (' + res.status + ').');
    if (res.status === 204) return null;
    const t = await res.text(); return t ? JSON.parse(t) : null;
  }

  function fmtDate(v){ if(!v) return 'never'; const d=new Date(v); return isNaN(d)?String(v):d.toLocaleString(); }
  function showMsg(el,text,kind){ el.innerHTML = text ? `<div class="msg ${kind}">${text.replace(/</g,'&lt;')}</div>` : ''; }

  function render(m){
    const facts=(m&&Array.isArray(m.facts))?m.facts:[];
    $('meta').textContent = `${facts.length} fact${facts.length===1?'':'s'} · updated ${fmtDate(m&&m.updatedAt)}`;
    const list=$('facts'); list.innerHTML='';
    if(!facts.length){ list.innerHTML='<div class="empty">No facts stored yet.</div>'; return; }
    facts.forEach((fact,i)=>{
      const row=document.createElement('div'); row.className='fact';
      const idx=document.createElement('div'); idx.className='idx'; idx.textContent=(i+1);
      const text=document.createElement('div'); text.className='text'; text.textContent=fact;
      const btn=document.createElement('button'); btn.className='danger'; btn.textContent='Remove';
      btn.addEventListener('click',()=>removeFact(fact,btn));
      row.append(idx,text,btn); list.appendChild(row);
    });
  }

  function showLock(){ $('panel').classList.add('hidden'); $('lock').classList.remove('hidden'); $('facts').innerHTML=''; }
  function showPanel(m){ $('lock').classList.add('hidden'); $('panel').classList.remove('hidden'); render(m); }

  async function load(){
    showMsg($('panelMsg'),'','');
    try { showPanel(await mem('GET')); }
    catch(e){ if(e.message==='SESSION') showLock(); else showMsg($('panelMsg'), e.message, 'err'); }
  }

  async function removeFact(fact,btn){
    btn.disabled=true;
    try { await mem('DELETE','?fact='+encodeURIComponent(fact)); showPanel(await mem('GET')); showMsg($('panelMsg'),'Removed.','ok'); }
    catch(e){ btn.disabled=false; if(e.message==='SESSION') showLock(); else showMsg($('panelMsg'), e.message,'err'); }
  }

  async function clearAll(){
    if(!confirm('Clear ALL of the robot’s memory? This cannot be undone.')) return;
    try { await mem('DELETE'); showPanel(await mem('GET')); showMsg($('panelMsg'),'Memory cleared.','ok'); }
    catch(e){ if(e.message==='SESSION') showLock(); else showMsg($('panelMsg'), e.message,'err'); }
  }

  async function signIn(){
    const token=$('token').value.trim();
    if(!token){ showMsg($('lockMsg'),'Enter the admin token.','err'); return; }
    try {
      const res=await fetch('/api/admin/login',{ method:'POST', credentials:'same-origin',
        headers:{'Content-Type':'application/json'}, body:JSON.stringify({ token }) });
      $('token').value='';
      if(res.status===503){ showMsg($('lockMsg'),'Admin is disabled on the server (ADMIN_TOKEN not set).','err'); return; }
      if(res.status===401){ showMsg($('lockMsg'),'Invalid token.','err'); return; }
      if(!res.ok){ showMsg($('lockMsg'),'Sign-in failed ('+res.status+').','err'); return; }
      showMsg($('lockMsg'),'','');
      load();
    } catch(e){ showMsg($('lockMsg'),'Couldn’t reach the server.','err'); }
  }

  async function signOut(){
    try { await fetch('/api/admin/logout',{ method:'POST', credentials:'same-origin' }); } catch(e){}
    showLock();
  }

  $('unlock').addEventListener('click', signIn);
  $('token').addEventListener('keydown', (e)=>{ if(e.key==='Enter') signIn(); });
  $('refresh').addEventListener('click', load);
  $('clearAll').addEventListener('click', clearAll);
  $('logout').addEventListener('click', signOut);

  // On load: cookie may already sign us in → straight to the panel, no paste.
  load();
})();
</script>
</body>
</html>
```

## Interim
Until these routes ship, you can inspect memory directly with the token header (see README curl
examples). The previous static admin page is in this site's git history if you want it back
temporarily.
