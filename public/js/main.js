let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  loadFeed();
  initUserSearch();
});

async function checkSession() {
  try {
    const res = await fetch('/api/users/me');
    if (res.ok) { currentUser = await res.json(); onLoginSuccess(); }
  } catch (_) {}
}

function openModal() { document.getElementById('login-modal').classList.add('active'); }
function closeModal() { document.getElementById('login-modal').classList.remove('active'); document.getElementById('login-error').textContent = ''; }
function openRegisterModal() { document.getElementById('register-modal').classList.add('active'); }
function closeRegisterModal() { document.getElementById('register-modal').classList.remove('active'); document.getElementById('register-error').textContent = ''; }

async function handleLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  if (!username || !password) { document.getElementById('login-error').textContent = 'Bitte alle Felder ausfüllen.'; return; }
  try {
    const res = await fetch('/api/users/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username, password }) });
    const data = await res.json();
    if (!res.ok) { document.getElementById('login-error').textContent = data.error; return; }
    currentUser = { userId: data.userId, username };
    closeModal(); onLoginSuccess(); loadFeed();
  } catch (_) { document.getElementById('login-error').textContent = 'Serverfehler.'; }
}

async function handleRegister() {
  const firstname = document.getElementById('reg-firstname').value.trim();
  const lastname  = document.getElementById('reg-lastname').value.trim();
  const username  = document.getElementById('reg-username').value.trim();
  const email     = document.getElementById('reg-email').value.trim();
  const password  = document.getElementById('reg-password').value;
  if (!firstname||!lastname||!username||!email||!password) { document.getElementById('register-error').textContent = 'Bitte alle Felder ausfüllen.'; return; }
  try {
    const res = await fetch('/api/users', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ firstname, lastname, username, email, password }) });
    const data = await res.json();
    if (!res.ok) { document.getElementById('register-error').textContent = data.error; return; }
    closeRegisterModal(); openModal(); document.getElementById('login-username').value = username;
  } catch (_) { document.getElementById('register-error').textContent = 'Serverfehler.'; }
}

function onLoginSuccess() {
  document.getElementById('navbar-right').innerHTML = `
    <span style="font-size:13px;color:#7C3AED;font-weight:500">✦ ${currentUser.username}</span>
    <a href="profile.html" class="btn-outline">Profil</a>
    <button class="btn-primary" onclick="handleLogout()">Abmelden</button>
  `;
  document.getElementById('new-post-box').style.display = 'flex';
  document.getElementById('new-post-avatar').textContent = currentUser.username.slice(0,2).toUpperCase();
}

async function handleLogout() {
  await fetch('/api/users/logout', { method: 'POST' });
  currentUser = null; location.reload();
}

function showConfirm(message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `
    <div class="modal-box" style="position:relative;gap:20px;max-width:340px;text-align:center">
      <div style="font-size:28px">🗑️</div>
      <div style="font-size:14px;font-weight:500;color:#1E1E2E">${message}</div>
      <div style="display:flex;gap:10px;justify-content:center">
        <button class="btn-outline" onclick="this.closest('.modal-overlay').remove()">Abbrechen</button>
        <button class="btn-delete" style="border-radius:20px;padding:7px 18px;font-size:12px" id="confirm-ok-btn">Löschen</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#confirm-ok-btn').onclick = () => { overlay.remove(); onConfirm(); };
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
}

async function loadFeed() {
  try {
    const res = await fetch('/api/posts');
    const posts = await res.json();
    const feed = document.getElementById('feed');
    feed.innerHTML = '';

    if (posts.length === 0) {
      feed.innerHTML = `
        <div style="text-align:center;padding:60px 20px;color:#C4A8E0">
          <div style="font-size:48px;margin-bottom:16px">🌸</div>
          <div style="font-size:16px;font-weight:600;color:#7C3AED;margin-bottom:8px">Noch keine Posts</div>
          <div style="font-size:13px;color:#9CA3AF">Sei der Erste und teile etwas!</div>
        </div>`;
      return;
    }

    for (const post of posts) feed.appendChild(await createPostCard(post));
  } catch (_) {}
}

/* ── REACTIONS ── */
const REACTIONS = ['❤️','😂','😮','😢','👍'];
const reactionState = {};
function getReactionKey(type, id, emoji) { return `${type}-${id}-${emoji}`; }
function toggleReaction(type, id, emoji, wrapId) {
  if (!currentUser) { openModal(); return; }
  const key = getReactionKey(type, id, emoji);
  if (!reactionState[key]) reactionState[key] = { count: 0, active: false };
  const s = reactionState[key];
  s.active = !s.active; s.count += s.active ? 1 : -1;
  closePicker(wrapId); renderActivePills(type, id, wrapId);
}
function renderActivePills(type, id, wrapId) {
  const container = document.getElementById(`active-${wrapId}`);
  if (!container) return;
  container.innerHTML = '';
  REACTIONS.forEach(emoji => {
    const s = reactionState[getReactionKey(type, id, emoji)];
    if (s && s.count > 0) {
      const pill = document.createElement('button');
      pill.className = 'active-reaction-pill' + (s.active ? ' mine' : '');
      pill.textContent = `${emoji} ${s.count}`;
      pill.onclick = () => toggleReaction(type, id, emoji, wrapId);
      container.appendChild(pill);
    }
  });
}
function openPicker(wrapId) {
  document.querySelectorAll('.reaction-picker.open').forEach(p => p.classList.remove('open'));
  document.getElementById(`picker-${wrapId}`)?.classList.toggle('open');
}
function closePicker(wrapId) { document.getElementById(`picker-${wrapId}`)?.classList.remove('open'); }
document.addEventListener('click', e => {
  if (!e.target.closest('.reaction-wrap')) document.querySelectorAll('.reaction-picker.open').forEach(p => p.classList.remove('open'));
});
function reactionHTML(type, id) {
  const wrapId = `${type}-${id}`;
  return `<div class="reaction-wrap" id="wrap-${wrapId}">
    <div class="active-reactions" id="active-${wrapId}"></div>
    <div style="position:relative">
      <button class="reaction-trigger" onclick="openPicker('${wrapId}')">🙂</button>
      <div class="reaction-picker" id="picker-${wrapId}">
        ${REACTIONS.map(e => `<button class="picker-btn" onclick="toggleReaction('${type}',${id},'${e}','${wrapId}')">${e}</button>`).join('')}
      </div>
    </div>
  </div>`;
}

/* ── POST CARD ── */
async function createPostCard(post) {
  const commentsRes = await fetch(`/api/comments?postId=${post.postId}`);
  const comments    = await commentsRes.json();
  const isOwner     = currentUser && currentUser.userId === post.creator;
  const avatarClass = ['avatar-purple','avatar-pink','avatar-yellow'][post.creator % 3];
  const initials    = post.username.slice(0,2).toUpperCase();
  const timeStr     = relativeTime(post.creationDate);
  const card        = document.createElement('div');
  card.className    = 'post-card';
  card.id           = `post-${post.postId}`;

  card.innerHTML = `
    <div class="post-header">
      <div class="avatar ${avatarClass}">${initials}</div>
      <div class="post-meta">
        <div class="username"><a href="user.html?id=${post.creator}" style="color:inherit;text-decoration:none">${post.username}</a></div>
        <div class="post-time">${timeStr}</div>
      </div>
    </div>
    <div class="post-text" id="post-text-${post.postId}">${post.text}</div>
    <div id="post-edit-form-${post.postId}" style="display:none;margin-bottom:10px">
      <textarea id="post-edit-input-${post.postId}" style="width:100%;border:1px solid #E9D5FF;border-radius:12px;padding:9px 13px;font-size:13px;font-family:'Poppins',sans-serif;color:#1E1E2E;background:#FFF8F5;outline:none;resize:none;min-height:70px"></textarea>
      <div style="display:flex;gap:8px;margin-top:6px">
        <button class="btn-primary" onclick="savePost(${post.postId})">Speichern</button>
        <button class="btn-outline" onclick="cancelEditPost(${post.postId})">Abbrechen</button>
      </div>
    </div>
    ${reactionHTML('post', post.postId)}
    <div class="post-actions">
      ${currentUser ? `<button class="btn-comment" onclick="toggleCommentForm(${post.postId})">💬 Kommentieren</button>` : ''}
      ${isOwner ? `<button class="btn-edit" onclick="editPost(${post.postId})">✏️ Bearbeiten</button>` : ''}
      ${isOwner ? `<button class="btn-delete" onclick="deletePost(${post.postId})">🗑 Löschen</button>` : ''}
    </div>
    <button class="comments-toggle" onclick="toggleComments(${post.postId})">
      ▾ ${comments.length} Kommentar${comments.length!==1?'e':''} anzeigen
    </button>
    <div class="comments-section" id="comments-${post.postId}" style="display:none;flex-direction:column;gap:4px">
      ${renderCommentTree(comments)}
      <div class="comment-form" id="comment-form-${post.postId}" style="display:none;margin-top:6px">
        <input type="text" id="comment-input-${post.postId}" placeholder="Kommentar schreiben…" autocomplete="off">
        <button class="btn-primary" onclick="submitComment(${post.postId},null)">Senden</button>
      </div>
    </div>`;
  return card;
}

/* ── THREADED COMMENTS — minimal ── */
function renderCommentTree(comments) {
  const map = {}, roots = [];
  comments.forEach(c => { map[c.commentId] = { ...c, children: [] }; });
  comments.forEach(c => {
    if (c.parentId && map[c.parentId]) map[c.parentId].children.push(map[c.commentId]);
    else roots.push(map[c.commentId]);
  });
  return roots.map(c => renderCommentNode(c, 0)).join('');
}

function renderCommentNode(c, depth) {
  const isOwner  = currentUser && currentUser.userId === c.creator;
  const ml       = depth > 0 ? `margin-left:${Math.min(depth*16,48)}px;` : '';
  const replyBtn = currentUser
    ? `<button style="background:none;border:none;font-size:11px;color:#C084FC;cursor:pointer;font-family:'Poppins',sans-serif;padding:0" onclick="openReplyForm(${c.commentId},'${escAttr(c.username)}')">↩ Antworten</button>`
    : '';
  const children = c.children.map(ch => renderCommentNode(ch, depth+1)).join('');

  return `
    <div id="comment-${c.commentId}" style="${ml}background:${depth>0?'#FDFAFF':'#FFF0FB'};border-radius:10px;padding:7px 12px;${depth>0?'border-left:2px solid #E9D5FF;':''}">
      <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:3px">
        <a href="user.html?id=${c.creator}" style="font-size:12px;font-weight:600;color:#7C3AED;text-decoration:none">${c.username}</a>
        ${depth>0?'<span style="font-size:10px;color:#C084FC">Antwort</span>':''}
      </div>
      <div id="comment-text-${c.commentId}" style="font-size:13px;color:#374151;line-height:1.45">${c.text}</div>
      <div id="comment-edit-form-${c.commentId}" style="display:none;margin-top:5px">
        <input type="text" id="comment-edit-input-${c.commentId}"
          style="width:100%;border:1px solid #E9D5FF;border-radius:10px;padding:5px 11px;font-size:12px;font-family:'Poppins',sans-serif;color:#1E1E2E;background:#FFF8F5;outline:none"
          autocomplete="off">
        <div style="display:flex;gap:5px;margin-top:5px">
          <button class="btn-primary" style="font-size:11px;padding:3px 10px" onclick="saveComment(${c.commentId})">Speichern</button>
          <button class="btn-outline"  style="font-size:11px;padding:3px 10px" onclick="cancelEditComment(${c.commentId})">Abbrechen</button>
        </div>
      </div>
      <div id="reply-form-${c.commentId}" style="display:none;margin-top:6px;display:none">
        <div style="display:flex;gap:6px">
          <input type="text" id="reply-input-${c.commentId}"
            style="flex:1;border:1px solid #E9D5FF;border-radius:10px;padding:5px 11px;font-size:12px;font-family:'Poppins',sans-serif;color:#1E1E2E;background:#FFF8F5;outline:none"
            autocomplete="off">
          <button class="btn-primary" style="font-size:11px;padding:4px 12px" onclick="submitReply(${c.commentId})">Senden</button>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:5px;align-items:center;flex-wrap:wrap">
        ${reactionHTML('comment', c.commentId)}
        ${replyBtn}
        ${isOwner ? `
          <button class="btn-edit"   style="font-size:10px;padding:2px 8px;margin-left:auto" onclick="editComment(${c.commentId})">✏️</button>
          <button class="btn-delete" style="font-size:10px;padding:2px 8px"                  onclick="deleteComment(${c.commentId})">🗑</button>
        ` : ''}
      </div>
    </div>
    ${children}`;
}

/* ── REPLY ── */
function openReplyForm(parentId, username) {
  document.querySelectorAll('[id^="reply-form-"]').forEach(f => {
    if (f.id !== `reply-form-${parentId}`) f.style.display = 'none';
  });
  const form  = document.getElementById(`reply-form-${parentId}`);
  const input = document.getElementById(`reply-input-${parentId}`);
  const isOpen = form.style.display === 'flex';
  form.style.display = isOpen ? 'none' : 'flex';
  if (!isOpen) { input.value = `@${username} `; input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
}

async function submitReply(parentCommentId) {
  if (!currentUser) { openModal(); return; }
  const commentEl = document.getElementById(`comment-${parentCommentId}`);
  const section   = commentEl?.closest('[id^="comments-"]');
  if (!section) return;
  const postId = parseInt(section.id.replace('comments-',''));
  const input  = document.getElementById(`reply-input-${parentCommentId}`);
  const text   = input.value.trim();
  if (!text) return;
  await fetch('/api/comments', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ text, origin: postId, parentId: parentCommentId })
  });
  loadFeed();
}

function toggleComments(postId) {
  const s = document.getElementById(`comments-${postId}`);
  s.style.display = s.style.display === 'none' ? 'flex' : 'none';
}
function toggleCommentForm(postId) {
  const section = document.getElementById(`comments-${postId}`);
  const form    = document.getElementById(`comment-form-${postId}`);
  section.style.display = 'flex';
  const isOpen = form.style.display === 'flex';
  form.style.display = isOpen ? 'none' : 'flex';
  if (!isOpen) document.getElementById(`comment-input-${postId}`).focus();
}

/* ── POST CRUD ── */
async function createPost() {
  const text = document.getElementById('new-post-text').value.trim();
  if (!text) return;
  await fetch('/api/posts', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text }) });
  document.getElementById('new-post-text').value = '';
  loadFeed();
}
function editPost(postId) {
  const text = document.getElementById(`post-text-${postId}`).textContent;
  document.getElementById(`post-text-${postId}`).style.display = 'none';
  document.getElementById(`post-edit-form-${postId}`).style.display = 'block';
  document.getElementById(`post-edit-input-${postId}`).value = text;
  document.getElementById(`post-edit-input-${postId}`).focus();
}
function cancelEditPost(postId) {
  document.getElementById(`post-text-${postId}`).style.display = 'block';
  document.getElementById(`post-edit-form-${postId}`).style.display = 'none';
}
async function savePost(postId) {
  const text = document.getElementById(`post-edit-input-${postId}`).value.trim();
  if (!text) return;
  await fetch(`/api/posts/${postId}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text }) });
  cancelEditPost(postId); loadFeed();
}
function deletePost(postId) {
  showConfirm('Post wirklich löschen?', async () => {
    await fetch(`/api/posts/${postId}`, { method:'DELETE' }); loadFeed();
  });
}

/* ── COMMENT CRUD ── */
async function submitComment(postId, parentId) {
  if (!currentUser) { openModal(); return; }
  const input = document.getElementById(`comment-input-${postId}`);
  const text  = input.value.trim();
  if (!text) return;
  await fetch('/api/comments', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text, origin: postId, parentId: parentId||null }) });
  input.value = ''; loadFeed();
}
function editComment(commentId) {
  const text = document.getElementById(`comment-text-${commentId}`).textContent;
  document.getElementById(`comment-text-${commentId}`).style.display = 'none';
  document.getElementById(`comment-edit-form-${commentId}`).style.display = 'block';
  const input = document.getElementById(`comment-edit-input-${commentId}`);
  input.value = text; input.focus();
}
function cancelEditComment(commentId) {
  document.getElementById(`comment-text-${commentId}`).style.display = 'block';
  document.getElementById(`comment-edit-form-${commentId}`).style.display = 'none';
}
async function saveComment(commentId) {
  const text = document.getElementById(`comment-edit-input-${commentId}`).value.trim();
  if (!text) return;
  await fetch(`/api/comments/${commentId}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text }) });
  cancelEditComment(commentId); loadFeed();
}
function deleteComment(commentId) {
  showConfirm('Kommentar wirklich löschen?', async () => {
    await fetch(`/api/comments/${commentId}`, { method:'DELETE' }); loadFeed();
  });
}

function escAttr(str) {
  return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* ── CHARACTER COUNTER ── */
function updateCharCount() {
  const textarea = document.getElementById('new-post-text');
  const counter  = document.getElementById('char-count');
  if (!textarea || !counter) return;
  const remaining = 120 - textarea.value.length;
  counter.textContent = `${remaining} Zeichen übrig`;
  counter.style.color = remaining < 35 ? '#EF4444' : remaining < 80 ? '#F59E0B' : '#C4A8E0';
}

/* ── RELATIVE TIME ── */
function relativeTime(dateStr) {
  const now  = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60)   return 'gerade eben';
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return `vor ${m} Minute${m !== 1 ? 'n' : ''}`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return `vor ${h} Stunde${h !== 1 ? 'n' : ''}`;
  }
  if (diff < 86400 * 7) {
    const d = Math.floor(diff / 86400);
    return `vor ${d} Tag${d !== 1 ? 'en' : ''}`;
  }
  return new Date(dateStr).toLocaleDateString('de-DE', { dateStyle: 'short' });
}

/* ── USER SEARCH ── */
let allUsers = [];

async function initUserSearch() {
  try {
    const res = await fetch('/api/users');
    if (res.ok) allUsers = await res.json();
  } catch (_) {}

  const input = document.getElementById('user-search-input');
  const dropdown = document.getElementById('user-search-dropdown');
  if (!input || !dropdown) return;

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { dropdown.style.display = 'none'; return; }

    const matches = allUsers.filter(u =>
      u.username.toLowerCase().includes(q) ||
      (u.firstname + ' ' + u.lastname).toLowerCase().includes(q)
    ).slice(0, 6);

    if (matches.length === 0) { dropdown.style.display = 'none'; return; }

    dropdown.innerHTML = matches.map(u => `
      <a href="user.html?id=${u.userId}" class="search-result-item">
        <div class="search-result-avatar">${u.username.slice(0,2).toUpperCase()}</div>
        <div class="search-result-info">
          <div class="search-result-name">${escHtml(u.username)}</div>
          ${u.bio ? `<div class="search-result-bio">${escHtml(u.bio.slice(0,40))}${u.bio.length>40?'…':''}</div>` : ''}
        </div>
      </a>
    `).join('');
    dropdown.style.display = 'block';
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') { dropdown.style.display = 'none'; input.value = ''; }
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('#user-search-wrap')) dropdown.style.display = 'none';
  });
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}