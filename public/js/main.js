let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  loadFeed();
});

/* ── SESSION ── */
async function checkSession() {
  try {
    const res = await fetch('/api/users/me');
    if (res.ok) {
      currentUser = await res.json();
      onLoginSuccess();
    }
  } catch (_) {}
}

/* ── MODALS ── */
function openModal() {
  document.getElementById('login-modal').classList.add('active');
}
function closeModal() {
  document.getElementById('login-modal').classList.remove('active');
  document.getElementById('login-error').textContent = '';
}
function openRegisterModal() {
  document.getElementById('register-modal').classList.add('active');
}
function closeRegisterModal() {
  document.getElementById('register-modal').classList.remove('active');
  document.getElementById('register-error').textContent = '';
}

/* ── AUTH ── */
async function handleLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  if (!username || !password) {
    document.getElementById('login-error').textContent = 'Bitte alle Felder ausfüllen.';
    return;
  }
  try {
    const res = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) { document.getElementById('login-error').textContent = data.error; return; }
    currentUser = { userId: data.userId, username };
    closeModal();
    onLoginSuccess();
    loadFeed();
  } catch (_) {
    document.getElementById('login-error').textContent = 'Serverfehler.';
  }
}

async function handleRegister() {
  const firstname = document.getElementById('reg-firstname').value.trim();
  const lastname  = document.getElementById('reg-lastname').value.trim();
  const username  = document.getElementById('reg-username').value.trim();
  const email     = document.getElementById('reg-email').value.trim();
  const password  = document.getElementById('reg-password').value;
  if (!firstname || !lastname || !username || !email || !password) {
    document.getElementById('register-error').textContent = 'Bitte alle Felder ausfüllen.';
    return;
  }
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstname, lastname, username, email, password })
    });
    const data = await res.json();
    if (!res.ok) { document.getElementById('register-error').textContent = data.error; return; }
    closeRegisterModal();
    openModal();
    document.getElementById('login-username').value = username;
  } catch (_) {
    document.getElementById('register-error').textContent = 'Serverfehler.';
  }
}

function onLoginSuccess() {
  document.getElementById('navbar-right').innerHTML = `
    <span style="font-size:13px;color:#7C3AED;font-weight:500">✦ ${currentUser.username}</span>
    <a href="profile.html" class="btn-outline">Profil</a>
    <button class="btn-primary" onclick="handleLogout()">Abmelden</button>
  `;
  document.getElementById('new-post-box').style.display = 'flex';
  document.getElementById('new-post-avatar').textContent = currentUser.username.slice(0, 2).toUpperCase();
}

async function handleLogout() {
  await fetch('/api/users/logout', { method: 'POST' });
  currentUser = null;
  location.reload();
}

/* ── CONFIRM MODAL ── */
function showConfirm(message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `
    <div class="modal-box" style="position:relative;gap:20px;max-width:340px;text-align:center">
      <div style="font-size:32px">🗑️</div>
      <div style="font-size:15px;font-weight:500;color:#1E1E2E">${message}</div>
      <div style="display:flex;gap:10px;justify-content:center">
        <button class="btn-outline" onclick="this.closest('.modal-overlay').remove()">Abbrechen</button>
        <button class="btn-delete" style="border-radius:20px;padding:8px 20px;font-size:13px" id="confirm-ok-btn">Löschen</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#confirm-ok-btn').onclick = () => { overlay.remove(); onConfirm(); };
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
}

/* ── FEED ── */
async function loadFeed() {
  try {
    const res = await fetch('/api/posts');
    const posts = await res.json();
    const feed = document.getElementById('feed');
    feed.innerHTML = '';
    for (const post of posts) {
      feed.appendChild(await createPostCard(post));
    }
  } catch (_) {}
}

/* ── REACTIONS (client-side, session-based) ── */
const REACTIONS = ['❤️', '😂', '😮', '😢', '👍'];
const reactionState = {};

function getReactionKey(type, id, emoji) { return `${type}-${id}-${emoji}`; }

function toggleReaction(type, id, emoji, wrapId) {
  if (!currentUser) { openModal(); return; }
  const key = getReactionKey(type, id, emoji);
  if (!reactionState[key]) reactionState[key] = { count: 0, active: false };
  const s = reactionState[key];
  s.active = !s.active;
  s.count += s.active ? 1 : -1;
  closePicker(wrapId);
  renderActivePills(type, id, wrapId);
}

function renderActivePills(type, id, wrapId) {
  const container = document.getElementById(`active-${wrapId}`);
  if (!container) return;
  container.innerHTML = '';
  REACTIONS.forEach(emoji => {
    const key = getReactionKey(type, id, emoji);
    const s = reactionState[key];
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
  const picker = document.getElementById(`picker-${wrapId}`);
  if (picker) picker.classList.toggle('open');
}
function closePicker(wrapId) {
  const picker = document.getElementById(`picker-${wrapId}`);
  if (picker) picker.classList.remove('open');
}

document.addEventListener('click', e => {
  if (!e.target.closest('.reaction-wrap')) {
    document.querySelectorAll('.reaction-picker.open').forEach(p => p.classList.remove('open'));
  }
});

function reactionHTML(type, id) {
  const wrapId = `${type}-${id}`;
  return `
    <div class="reaction-wrap" id="wrap-${wrapId}">
      <div class="active-reactions" id="active-${wrapId}"></div>
      <div style="position:relative">
        <button class="reaction-trigger" onclick="openPicker('${wrapId}')">🙂</button>
        <div class="reaction-picker" id="picker-${wrapId}">
          ${REACTIONS.map(e => `<button class="picker-btn" onclick="toggleReaction('${type}',${id},'${e}','${wrapId}')">${e}</button>`).join('')}
        </div>
      </div>
    </div>
  `;
}

/* ── POST CARD ── */
async function createPostCard(post) {
  const commentsRes = await fetch(`/api/comments?postId=${post.postId}`);
  const comments    = await commentsRes.json();
  const isOwner     = currentUser && currentUser.userId === post.creator;
  const avatarClass = ['avatar-purple', 'avatar-pink', 'avatar-yellow'][post.creator % 3];
  const initials    = post.username.slice(0, 2).toUpperCase();
  const timeStr     = new Date(post.creationDate).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' });

  const card = document.createElement('div');
  card.className = 'post-card';
  card.id = `post-${post.postId}`;

  card.innerHTML = `
    <div class="post-header">
      <div class="avatar ${avatarClass}">${initials}</div>
      <div class="post-meta">
        <div class="username">${post.username}</div>
        <div class="post-time">${timeStr}</div>
      </div>
    </div>

    <div class="post-text" id="post-text-${post.postId}">${post.text}</div>
    <div class="post-edit-form" id="post-edit-form-${post.postId}" style="display:none;margin-bottom:12px">
      <textarea id="post-edit-input-${post.postId}" style="width:100%;border:1px solid #E9D5FF;border-radius:12px;padding:10px 14px;font-size:14px;font-family:'Poppins',sans-serif;color:#1E1E2E;background:#FFF8F5;outline:none;resize:none;min-height:80px"></textarea>
      <div style="display:flex;gap:8px;margin-top:8px">
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
      ▾ ${comments.length} Kommentar${comments.length !== 1 ? 'e' : ''} anzeigen
    </button>
    <div class="comments-section" id="comments-${post.postId}" style="display:none;flex-direction:column">
      ${renderCommentTree(comments)}
      <div class="comment-form" id="comment-form-${post.postId}" style="display:none">
        <input type="text" id="comment-input-${post.postId}" placeholder="Kommentar schreiben…" autocomplete="off">
        <button class="btn-primary" onclick="submitComment(${post.postId}, null)">Senden</button>
      </div>
    </div>
  `;
  return card;
}

/* ── THREADED COMMENT RENDERING ── */
function renderCommentTree(comments) {
  /* Build id→comment map and separate roots from replies */
  const map   = {};
  const roots = [];
  comments.forEach(c => { map[c.commentId] = { ...c, children: [] }; });
  comments.forEach(c => {
    if (c.parentId && map[c.parentId]) {
      map[c.parentId].children.push(map[c.commentId]);
    } else {
      roots.push(map[c.commentId]);
    }
  });
  return roots.map(c => renderCommentNode(c, 0)).join('');
}

function renderCommentNode(c, depth) {
  const isOwner  = currentUser && currentUser.userId === c.creator;
  const indent   = depth > 0 ? `margin-left:${Math.min(depth * 18, 54)}px;` : '';
  const replyBtn = currentUser
    ? `<button class="btn-comment" style="font-size:11px;padding:3px 10px" onclick="openReplyForm(${c.commentId},'${escAttr(c.username)}')">↩ Antworten</button>`
    : '';

  const childrenHtml = c.children.length
    ? c.children.map(child => renderCommentNode(child, depth + 1)).join('')
    : '';

  return `
    <div class="comment-item" id="comment-${c.commentId}" style="${indent}${depth > 0 ? 'border-left:2px solid #E9D5FF;padding-left:12px;background:#FDFAFF;' : ''}">
      <div class="comment-user">${c.username}${depth > 0 ? ' <span style="color:#C084FC;font-size:10px;font-weight:400">Antwort</span>' : ''}</div>
      <div class="comment-text" id="comment-text-${c.commentId}">${c.text}</div>

      <div class="comment-edit-form" id="comment-edit-form-${c.commentId}" style="display:none;margin-top:6px">
        <input type="text" id="comment-edit-input-${c.commentId}"
          style="width:100%;border:1px solid #E9D5FF;border-radius:12px;padding:6px 12px;font-size:13px;font-family:'Poppins',sans-serif;color:#1E1E2E;background:#FFF8F5;outline:none"
          autocomplete="off">
        <div style="display:flex;gap:6px;margin-top:6px">
          <button class="btn-primary" style="font-size:12px;padding:4px 12px" onclick="saveComment(${c.commentId})">Speichern</button>
          <button class="btn-outline"  style="font-size:12px;padding:4px 12px" onclick="cancelEditComment(${c.commentId})">Abbrechen</button>
        </div>
      </div>

      <!-- Reply form (hidden by default) -->
      <div class="comment-form" id="reply-form-${c.commentId}" style="display:none;margin-top:8px">
        <input type="text" id="reply-input-${c.commentId}" autocomplete="off" placeholder="@${escAttr(c.username)} ">
        <button class="btn-primary" onclick="submitReply(${c.commentId})">Senden</button>
      </div>

      <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;align-items:center">
        ${reactionHTML('comment', c.commentId)}
        ${replyBtn}
        ${isOwner ? `
          <button class="btn-edit"   style="font-size:11px;padding:3px 10px;margin-left:auto" onclick="editComment(${c.commentId})">✏️</button>
          <button class="btn-delete" style="font-size:11px;padding:3px 10px"                  onclick="deleteComment(${c.commentId})">🗑</button>
        ` : ''}
      </div>
    </div>
    ${childrenHtml}
  `;
}

/* ── REPLY FORM ── */
function openReplyForm(parentCommentId, username) {
  /* Close any other open reply forms */
  document.querySelectorAll('[id^="reply-form-"]').forEach(f => {
    if (f.id !== `reply-form-${parentCommentId}`) f.style.display = 'none';
  });

  const form  = document.getElementById(`reply-form-${parentCommentId}`);
  const input = document.getElementById(`reply-input-${parentCommentId}`);
  const isOpen = form.style.display === 'flex';
  form.style.display = isOpen ? 'none' : 'flex';

  if (!isOpen) {
    input.value = `@${username} `;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }
}

async function submitReply(parentCommentId) {
  if (!currentUser) { openModal(); return; }

  /* Find the postId by walking up the DOM to the comments-section */
  const commentEl = document.getElementById(`comment-${parentCommentId}`);
  const section   = commentEl?.closest('[id^="comments-"]');
  if (!section) return;
  const postId = parseInt(section.id.replace('comments-', ''));

  const input = document.getElementById(`reply-input-${parentCommentId}`);
  const text  = input.value.trim();
  if (!text) return;

  await fetch('/api/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, origin: postId, parentId: parentCommentId })
  });

  /* Reload just the feed so threading re-renders */
  loadFeed();
}

/* ── COMMENTS TOGGLE / FORM ── */
function toggleComments(postId) {
  const section = document.getElementById(`comments-${postId}`);
  section.style.display = section.style.display === 'none' ? 'flex' : 'none';
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
  await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
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
  await fetch(`/api/posts/${postId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  cancelEditPost(postId);
  loadFeed();
}
function deletePost(postId) {
  showConfirm('Post wirklich löschen?', async () => {
    await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
    loadFeed();
  });
}

/* ── COMMENT CRUD ── */
async function submitComment(postId, parentId) {
  if (!currentUser) { openModal(); return; }
  const input = document.getElementById(`comment-input-${postId}`);
  const text  = input.value.trim();
  if (!text) return;
  await fetch('/api/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, origin: postId, parentId: parentId || null })
  });
  input.value = '';
  loadFeed();
}

function editComment(commentId) {
  const text = document.getElementById(`comment-text-${commentId}`).textContent;
  document.getElementById(`comment-text-${commentId}`).style.display = 'none';
  document.getElementById(`comment-edit-form-${commentId}`).style.display = 'block';
  const input = document.getElementById(`comment-edit-input-${commentId}`);
  input.value = text;
  input.focus();
}
function cancelEditComment(commentId) {
  document.getElementById(`comment-text-${commentId}`).style.display = 'block';
  document.getElementById(`comment-edit-form-${commentId}`).style.display = 'none';
}
async function saveComment(commentId) {
  const text = document.getElementById(`comment-edit-input-${commentId}`).value.trim();
  if (!text) return;
  await fetch(`/api/comments/${commentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  cancelEditComment(commentId);
  loadFeed();
}
function deleteComment(commentId) {
  showConfirm('Kommentar wirklich löschen?', async () => {
    await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
    loadFeed();
  });
}

/* ── HELPERS ── */
function escAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}