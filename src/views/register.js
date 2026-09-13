import { api } from '../api.js';
import { toast } from '../utils.js';

export function renderRegisterView(outlet) {
  outlet.innerHTML = `
    <div class="auth-panel">
      <h1 class="view-title">Create an account</h1>
      <form id="register-form" novalidate>
        <div class="mb-3">
          <label class="form-label" for="username">Username</label>
          <input type="text" class="form-control" id="username" required minlength="3" autocomplete="username" />
        </div>
        <div class="mb-3">
          <label class="form-label" for="email">Email</label>
          <input type="email" class="form-control" id="email" required autocomplete="email" />
        </div>
        <div class="mb-3">
          <label class="form-label" for="password">Password</label>
          <input type="password" class="form-control" id="password" required minlength="8" autocomplete="new-password" />
        </div>
        <div class="mb-3">
          <label class="form-label" for="confirmPassword">Confirm password</label>
          <input type="password" class="form-control" id="confirmPassword" required minlength="8" autocomplete="new-password" />
        </div>
        <div id="register-error" class="alert alert-danger d-none" role="alert"></div>
        <button type="submit" class="btn btn-accent w-100">Sign up</button>
      </form>
      <p class="auth-switch">Already have an account? <a href="#/login">Log in</a></p>
    </div>
  `;

  const form = outlet.querySelector('#register-form');
  const errorBox = outlet.querySelector('#register-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.classList.add('d-none');
    const username = outlet.querySelector('#username').value.trim();
    const email = outlet.querySelector('#email').value.trim();
    const password = outlet.querySelector('#password').value;
    const confirmPassword = outlet.querySelector('#confirmPassword').value;

    if (password !== confirmPassword) {
      errorBox.textContent = 'Passwords don\u2019t match.';
      errorBox.classList.remove('d-none');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account\u2026';

    try {
      await api.register({ username, email, password, confirmPassword });
      toast('Account created. Log in to continue.');
      alert("Account created. Log in to continue.");
      setTimeout(() => {
        window.location.hash = '/login';
      }, 1000);
    } catch (err) {
      errorBox.textContent = err.message || 'Could not create your account.';
      errorBox.classList.remove('d-none');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign up';
    }
  });
}
