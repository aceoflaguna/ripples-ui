import { api } from '../api.js';
import { escapeHtml, toast, requireAuth } from '../utils.js';

export function renderSubmitView(outlet, ctx) {
  if (!requireAuth('Log in to submit a post.')) {
    outlet.innerHTML = '';
    return;
  }

  const presetCommunity = ctx?.query?.community || '';

  outlet.innerHTML = `
    <div class="auth-panel">
      <h1 class="view-title">Submit a post</h1>
      <form id="submit-form" novalidate>
        <div class="mb-3">
          <label class="form-label" for="post-community">Community name</label>
          <input type="text" class="form-control" id="post-community" value="${escapeHtml(presetCommunity)}" placeholder="e.g. programming" required />
        </div>
        <div class="mb-3">
          <label class="form-label" for="post-title">Title</label>
          <input type="text" class="form-control" id="post-title" required maxlength="300" />
        </div>
        <div class="mb-3">
          <div class="btn-group" role="group" aria-label="Post type">
            <input type="radio" class="btn-check" name="post-type" id="type-text" value="text" checked />
            <label class="btn btn-outline-accent btn-sm" for="type-text">Text</label>
            <input type="radio" class="btn-check" name="post-type" id="type-link" value="link" />
            <label class="btn btn-outline-accent btn-sm" for="type-link">Link</label>
          </div>
        </div>
        <div class="mb-3" id="text-field">
          <label class="form-label" for="post-content">Content</label>
          <textarea class="form-control" id="post-content" rows="6"></textarea>
        </div>
        <div class="mb-3 d-none" id="link-field">
          <label class="form-label" for="post-url">URL</label>
          <input type="url" class="form-control" id="post-url" placeholder="https://" />
        </div>
        <div id="submit-error" class="alert alert-danger d-none" role="alert"></div>
        <button type="submit" class="btn btn-accent">Post</button>
      </form>
    </div>
  `;

  const form = outlet.querySelector('#submit-form');
  const textField = outlet.querySelector('#text-field');
  const linkField = outlet.querySelector('#link-field');
  const errorBox = outlet.querySelector('#submit-error');

  form.querySelectorAll('input[name="post-type"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      const isLink = outlet.querySelector('#type-link').checked;
      textField.classList.toggle('d-none', isLink);
      linkField.classList.toggle('d-none', !isLink);
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.classList.add('d-none');

    const communityName = outlet.querySelector('#post-community').value.trim();
    const title = outlet.querySelector('#post-title').value.trim();
    const isLink = outlet.querySelector('#type-link').checked;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting\u2026';

    try {
      const communityRes = await api.getCommunityByName(communityName);
      const community = communityRes?.data;
      if (!community) throw new Error(`No community named "${communityName}".`);

      const payload = { communityId: community.id, title, type: isLink ? 'link' : 'text' };
      if (isLink) {
        payload.url = outlet.querySelector('#post-url').value.trim();
      } else {
        payload.content = outlet.querySelector('#post-content').value.trim();
      }

      const res = await api.createPost(payload);
      toast('Post published.');
      window.location.hash = `/post/${res.data.id}`;
    } catch (err) {
      errorBox.textContent = err.message || 'Could not publish your post.';
      errorBox.classList.remove('d-none');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Post';
    }
  });
}
