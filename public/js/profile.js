let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  await checkSession();
  if (!currentUser) { window.location.href = 'index.html'; return; }
  renderNavbar();
  await loadProfile();
  loadMyPosts();
  loadMyComments();
});

async function checkSession() {
  try {
    const res = await fetch('/api/users/me');
    if (res.ok) currentUser = await res.json();
  } catch (_) {}
}

function renderNavbar() {
  document.getElementById('navbar-right').innerHTML = `
    <span style="font-size:13px;color:#7C3AED;font-weight:500">✦ ${currentUser.username}</span>
    <a href="index.html" class="btn-outline">← Feed</a>
    <button class="btn-primary" onclick="handleLogout()">Abmelden</button>
  `;
}

async function handleLogout() {
  await fetch('/api/users/logout', { method: 'POST' });
  window.location.href = 'index.html';
}

async function loadProfile() {
  const res = await fetch(`/api/users/${currentUser.userId}`);
  if (!res.ok) return;
  const user = await res.json();
  document.getElementById('hero-avatar').textContent = user.username.slice(0,2).toUpperCase();
  document.getElementById('hero-username').textContent = user.username;
  document.getElementById('hero-email').textContent = user.email;
  if (user.bio && user.bio.trim()) {
    document.getElementById('bio-text').textContent = user.bio;
    document.getElementById('bio-text').style.display = 'block';
    document.getElementById('bio-empty').style.display = 'none';
  } else {
    document.getElementById('bio-text').style.display = 'none';
    document.getElementById('bio-empty').style.display = 'block';
  }
  document.getElementById('edit-firstname').value = user.firstname;
  document.getElementById('edit-lastname').value  = user.lastname;
  document.getElementById('edit-username').value  = user.username;
  document.getElementById('edit-email').value     = user.email;
  document.getElementById('edit-bio').value       = user.bio || '';
  document.getElementById('profile-hero').style.display = 'flex';
}

/* ── PROFİL DÜZENLEME ── */
function openEditPanel() {
  closePasswordPanel();
  document.getElementById('edit-panel').style.display = 'block';
  document.getElementById('edit-panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function closeEditPanel() {
  document.getElementById('edit-panel').style.display = 'none';
  document.getElementById('edit-error').textContent = '';
}

async function saveProfile() {
  const firstname = document.getElementById('edit-firstname').value.trim();
  const lastname  = document.getElementById('edit-lastname').value.trim();
  const username  = document.getElementById('edit-username').value.trim();
  const email     = document.getElementById('edit-email').value.trim();
  const bio       = document.getElementById('edit-bio').value.trim();
  if (!firstname || !lastname || !username || !email) {
    document.getElementById('edit-error').textContent = 'Bitte alle Pflichtfelder ausfüllen.';
    return;
  }
  const res = await fetch(`/api/users/${currentUser.userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstname, lastname, username, email, bio })
  });
  const data = await res.json();
  if (!res.ok) { document.getElementById('edit-error').textContent = data.error; return; }
  currentUser.username = username;
  renderNavbar();
  closeEditPanel();
  await loadProfile();
}

/* ── ŞİFRE DEĞİŞTİR ── */
function openPasswordPanel() {
  closeEditPanel();
  document.getElementById('pw-old').value = '';
  document.getElementById('pw-new').value = '';
  document.getElementById('pw-confirm').value = '';
  document.getElementById('pw-error').textContent = '';
  document.getElementById('password-panel').style.display = 'block';
  document.getElementById('password-panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function closePasswordPanel() {
  document.getElementById('password-panel').style.display = 'none';
  document.getElementById('pw-error').textContent = '';
}

async function savePassword() {
  const oldPassword = document.getElementById('pw-old').value;
  const newPassword = document.getElementById('pw-new').value;
  const confirm     = document.getElementById('pw-confirm').value;

  if (!oldPassword || !newPassword || !confirm) {
    document.getElementById('pw-error').textContent = 'Bitte alle Felder ausfüllen.';
    return;
  }
  if (newPassword.length < 6) {
    document.getElementById('pw-error').textContent = 'Neues Passwort muss mindestens 6 Zeichen lang sein.';
    return;
  }
  if (newPassword !== confirm) {
    document.getElementById('pw-error').textContent = 'Passwörter stimmen nicht überein.';
    return;
  }

  const res = await fetch(`/api/users/${currentUser.userId}/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldPassword, newPassword })
  });
  const data = await res.json();
  if (!res.ok) { document.getElementById('pw-error').textContent = data.error; return; }

  closePasswordPanel();
  showModal('✅', 'Passwort erfolgreich geändert!', () => {}, 'OK');
}

/* ── TABS ── */
function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', ['posts','comments','reactions'][i] === name);
  });
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.getElementById(`tab-${name}`).classList.add('active');
}

/* ── MY POSTS ── */
async function loadMyPosts() {
  const res = await fetch('/api/posts');
  if (!res.ok) return;
  const allPosts = await res.json();
  const mine = allPosts.filter(p => p.creator === currentUser.userId);
  const container = document.getElementById('my-posts-list');
  if (mine.length === 0) { container.innerHTML = '<div class="empty-msg">Noch keine Posts.</div>'; return; }
  container.innerHTML = '';
  mine.forEach(post => {
    const timeStr = new Date(post.creationDate).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' });
    const card = document.createElement('div');
    card.className = 'item-card';
    card.id = `prof-post-${post.postId}`;
    card.innerHTML = `
      <div class="item-card-meta">${timeStr}</div>
      <div class="item-card-text" id="prof-post-text-${post.postId}">${escHtml(post.text)}</div>
      <div class="inline-edit-area" id="prof-post-edit-${post.postId}">
        <textarea id="prof-post-input-${post.postId}">${escHtml(post.text)}</textarea>
        <div class="inline-edit-btns">
          <button class="btn-primary" style="font-size:12px;padding:5px 12px" onclick="saveProfPost(${post.postId})">Speichern</button>
          <button class="btn-outline"  style="font-size:12px;padding:5px 12px" onclick="cancelProfPost(${post.postId})">Abbrechen</button>
        </div>
      </div>
      <div class="item-card-actions">
        <button class="btn-comment" style="font-size:11px;padding:4px 12px" onclick="togglePostComments(${post.postId}, this)">💬 Kommentare anzeigen</button>
        <button class="btn-edit"    style="font-size:11px;padding:4px 12px" onclick="editProfPost(${post.postId})">✏️</button>
        <button class="btn-delete"  style="font-size:11px;padding:4px 12px" onclick="deleteProfPost(${post.postId})">🗑</button>
      </div>
      <div class="post-comments-accordion" id="post-acc-${post.postId}" style="display:none;margin-top:10px;border-top:1px solid #F9E8FF;padding-top:10px"></div>
    `;
    container.appendChild(card);
  });
}

async function togglePostComments(postId, btn) {
  const acc = document.getElementById(`post-acc-${postId}`);
  if (acc.style.display === 'block') {
    acc.style.display = 'none';
    btn.textContent = '💬 Kommentare anzeigen';
    return;
  }
  btn.textContent = '💬 Ausblenden';
  acc.style.display = 'block';
  if (acc.dataset.loaded) return;
  acc.dataset.loaded = '1';
  const res = await fetch(`/api/comments?postId=${postId}`);
  const comments = await res.json();
  if (comments.length === 0) { acc.innerHTML = '<div style="font-size:12px;color:#9CA3AF">Noch keine Kommentare.</div>'; return; }
  acc.innerHTML = comments.map(c => `
    <div style="display:flex;gap:8px;align-items:baseline;padding:5px 0;border-bottom:1px solid #F9E8FF">
      <span style="font-size:11px;font-weight:600;color:#7C3AED;min-width:60px">${escHtml(c.username)}</span>
      <span style="font-size:12px;color:#374151;flex:1">${escHtml(c.text)}</span>
    </div>
  `).join('');
}

function editProfPost(id) {
  document.getElementById(`prof-post-text-${id}`).style.display = 'none';
  document.getElementById(`prof-post-edit-${id}`).style.display = 'flex';
  document.getElementById(`prof-post-input-${id}`).focus();
}
function cancelProfPost(id) {
  document.getElementById(`prof-post-text-${id}`).style.display = 'block';
  document.getElementById(`prof-post-edit-${id}`).style.display = 'none';
}
async function saveProfPost(id) {
  const text = document.getElementById(`prof-post-input-${id}`).value.trim();
  if (!text) return;
  await fetch(`/api/posts/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text }) });
  loadMyPosts();
}
function deleteProfPost(id) {
  showModal('🗑️', 'Post wirklich löschen?', async () => {
    await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    loadMyPosts();
  });
}

/* ── MY COMMENTS ── */
async function loadMyComments() {
  const res = await fetch(`/api/users/mycomments/${currentUser.userId}`);
  const container = document.getElementById('my-comments-list');
  if (!res.ok) { container.innerHTML = '<div class="empty-msg">Fehler beim Laden.</div>'; return; }
  const comments = await res.json();
  if (comments.length === 0) { container.innerHTML = '<div class="empty-msg">Noch keine Kommentare.</div>'; return; }

  container.innerHTML = '';
  comments.forEach(c => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.id = `prof-comment-${c.commentId}`;

    let contextHtml = '';
    if (c.parentId) {
      const parent = comments.find(x => x.commentId === c.parentId);
      const parentText = parent
        ? `↩ <b style="color:#7C3AED">${escHtml(parent.username)}</b>: "${escHtml(parent.text.slice(0,50))}${parent.text.length>50?'…':''}"`
        : `↩ Antwort auf einen Kommentar`;
      contextHtml = `<div class="item-card-ref" style="margin-bottom:6px">${parentText}</div>`;
    }

    const postSnippet = escHtml(c.postText.slice(0,60)) + (c.postText.length>60?'…':'');

    card.innerHTML = `
      ${contextHtml}
      <div class="item-card-text" id="prof-comment-text-${c.commentId}">${escHtml(c.text)}</div>
      <div class="inline-edit-area" id="prof-comment-edit-${c.commentId}">
        <input type="text" id="prof-comment-input-${c.commentId}" value="${escAttr(c.text)}" autocomplete="off"/>
        <div class="inline-edit-btns">
          <button class="btn-primary" style="font-size:12px;padding:5px 12px" onclick="saveProfComment(${c.commentId})">Speichern</button>
          <button class="btn-outline"  style="font-size:12px;padding:5px 12px" onclick="cancelProfComment(${c.commentId})">Abbrechen</button>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:10px;align-items:center;flex-wrap:wrap">
        <a href="index.html#post-${c.origin}" style="font-size:11px;color:#C084FC;text-decoration:none;flex:1" title="Zum Post gehen">
          📌 ${postSnippet}
        </a>
        <button class="btn-edit"   style="font-size:11px;padding:3px 10px" onclick="editProfComment(${c.commentId})">✏️</button>
        <button class="btn-delete" style="font-size:11px;padding:3px 10px" onclick="deleteProfComment(${c.commentId})">🗑</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function editProfComment(id) {
  document.getElementById(`prof-comment-text-${id}`).style.display = 'none';
  document.getElementById(`prof-comment-edit-${id}`).style.display = 'flex';
  document.getElementById(`prof-comment-input-${id}`).focus();
}
function cancelProfComment(id) {
  document.getElementById(`prof-comment-text-${id}`).style.display = 'block';
  document.getElementById(`prof-comment-edit-${id}`).style.display = 'none';
}
async function saveProfComment(id) {
  const text = document.getElementById(`prof-comment-input-${id}`).value.trim();
  if (!text) return;
  await fetch(`/api/comments/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text }) });
  loadMyComments();
}
function deleteProfComment(id) {
  showModal('🗑️', 'Kommentar wirklich löschen?', async () => {
    await fetch(`/api/comments/${id}`, { method: 'DELETE' });
    loadMyComments();
  });
}

/* ── ACCOUNT DELETE ── */
function confirmDeleteAccount() {
  showModal('⚠️',
    'Account wirklich löschen?<br><span style="font-size:12px;color:#9CA3AF">Alle Posts und Kommentare werden gelöscht.</span>',
    async () => {
      await fetch(`/api/users/${currentUser.userId}`, { method: 'DELETE' });
      window.location.href = 'index.html';
    }, 'Löschen'
  );
}

/* ── MODAL ── */
function showModal(icon, message, onConfirm, confirmLabel = 'Löschen') {
  const overlay = document.getElementById('shared-modal');
  const box     = document.getElementById('shared-modal-box');
  box.innerHTML = `
    <div style="font-size:32px">${icon}</div>
    <div style="font-size:15px;font-weight:500;color:#1E1E2E;line-height:1.5">${message}</div>
    <div style="display:flex;gap:10px;justify-content:center">
      <button class="btn-outline" onclick="closeSharedModal()">Abbrechen</button>
      <button class="${confirmLabel === 'OK' ? 'btn-primary' : 'btn-delete'}" style="border-radius:20px;padding:8px 20px;font-size:13px" id="modal-confirm-btn">${confirmLabel}</button>
    </div>
  `;
  overlay.classList.add('active');
  document.getElementById('modal-confirm-btn').onclick = () => { closeSharedModal(); onConfirm(); };
  overlay.onclick = e => { if (e.target === overlay) closeSharedModal(); };
}
function closeSharedModal() {
  document.getElementById('shared-modal').classList.remove('active');
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(str) {
  return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}