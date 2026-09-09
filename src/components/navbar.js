import { getCurrentUser, clearSession, api } from '../api.js';
import { toast } from '../utils.js';

export function renderNavbar() {
  const user = getCurrentUser();
  return `
  <header class="topbar">
    <div class="topbar-inner">
      <a class="brand" href="#/">Ripples</a>
      <form id="search-form" class="search-form" role="search">
        <input type="search" name="q" class="search-input" placeholder="Search posts and communities" aria-label="Search" />
      </form>
      <nav class="topbar-actions">
        <a href="#/submit" class="btn btn-sm btn-accent">Submit a post</a>
        ${
          user
            ? `<div class="dropdown">
                <button class="btn btn-sm btn-ghost dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">${user.username}</button>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li><a class="dropdown-item" href="#/u/${user.username}">Your profile</a></li>
                  <li><a class="dropdown-item" href="#/communities">Communities</a></li>
                  <li><hr class="dropdown-divider" /></li>
                  <li><button class="dropdown-item" id="logout-btn">Log out</button></li>
                </ul>
              </div>`
            : `<a href="#/login" class="btn btn-sm btn-ghost">Log in</a>
               <a href="#/register" class="btn btn-sm btn-outline-accent">Sign up</a>`
        }
      </nav>
    </div>
  </header>`;
}

export function wireNavbar(root) {
  const form = root.querySelector('#search-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = new FormData(form).get('q')?.toString().trim();
    if (q) window.location.hash = `/search?q=${encodeURIComponent(q)}`;
  });

  root.querySelector('#logout-btn')?.addEventListener('click', async () => {
    try {
      await api.logout();
    } catch {
      /* ignore — clear session regardless */
    }
    clearSession();
    toast('You\u2019re logged out.');
    window.location.hash = '/';
    window.location.reload();
  });
}
