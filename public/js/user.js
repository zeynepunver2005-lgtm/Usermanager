document.addEventListener('DOMContentLoaded', async () => {
  await checkSession();

  const params = new URLSearchParams(window.location.search);
  const userId = params.get('id');
  if (!userId) { window.location.href = 'users.html'; return; }

  await loadPublicProfile(userId);
  await loadPublicPosts(userId);
});

async function checkSession() {
  try {
    const res = await fetch('/api/users/me');
    if (res.ok) {
      const user = await res.json();
      document.getElementById('navbar-right').innerHTML = `
        <span style="font-size:13px;color:#7C3AED;font-weight:500">✦ ${user.username}</span>
        <a href="index.html" class="btn-outline">← Feed</a>
        <a href="profile.html" class="btn-outline">Profil</a>
      `;
    }
  } catch (_) {}
}

async function loadPublicProfile(userId) {
  const res = await fetch(`/api/users/${userId}`);
  if (!res.ok) { window.location.href = 'users.html'; return; }
  const user = await res.json();

  document.title = `Usermanager · ${user.username}`;
  document.getElementById('pub-avatar').textContent = user.username.slice(0,2).toUpperCase();
  document.getElementById('pub-username').textContent = user.username;

  if (user.bio && user.bio.trim()) {
    document.getElementById('pub-bio').textContent = user.bio;
    document.getElementById('pub-bio').style.display = 'block';
  } else {
    document.getElementById('pub-bio-empty').style.display = 'block';
  }

  document.getElementById('pub-hero').style.display = 'flex';
}

async function loadPublicPosts(userId) {
  const res = await fetch('/api/posts');
  if (!res.ok) return;
  const allPosts = await res.json();
  const posts = allPosts.filter(p => p.creator === parseInt(userId));

  document.getElementById('pub-posts-section').style.display = 'block';
  const container = document.getElementById('pub-posts-list');

  if (posts.length === 0) {
    container.innerHTML = '<div class="empty-msg">Noch keine Posts.</div>';
    return;
  }

  container.innerHTML = '';
  posts.forEach(post => {
    const timeStr = new Date(post.creationDate).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' });
    const card = document.createElement('div');
    card.className = 'pub-post-card';
    card.innerHTML = `
      <div class="pub-post-time">${timeStr}</div>
      <div class="pub-post-text">${escHtml(post.text)}</div>
    `;
    container.appendChild(card);
  });
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}