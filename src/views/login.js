import { api, setSession } from '../api.js';
import { toast } from '../utils.js';

export function renderLoginView(outlet) {
  outlet.innerHTML = `
    <div class="auth-panel">
      <h1 class="view-title">Log in</h1>
      <form id="login-form" novalidate>
        <div class="mb-3">
          <label class="form-label" for="email">Email</label>
          <input type="email" class="form-control" id="email" required autocomplete="email" />
        </div>
        <div class="mb-3">
          <label class="form-label" for="password">Password</label>
          <input type="password" class="form-control" id="password" required autocomplete="current-password" />
        </div>
        <div id="login-error" class="alert alert-danger d-none" role="alert"></div>
        <button type="submit" class="btn btn-accent w-100">Log in</button>
      </form>
      <p class="auth-switch">New here? <a href="#/register">Create an account</a></p>
    </div>
  `;

  const form = outlet.querySelector('#login-form');
  const errorBox = outlet.querySelector('#login-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.classList.add('d-none');
    const email = outlet.querySelector('#email').value.trim();
    const password = outlet.querySelector('#password').value;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in\u2026';

    try {
      const res = await api.login({ email, password });
      setSession(res.data);
      if (!res.data.user) {
        try {
          const me = await api.me();
          setSession({ user: me.data });
        } catch {
          /* profile fetch is best-effort */
        }
      }
      toast('Welcome back.');
      window.location.hash = '/';
      window.location.reload();
    } catch (err) {
      errorBox.textContent = err.message || 'Log in failed. Check your details and try again.';
      errorBox.classList.remove('d-none');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Log in';
    }
  });
}
