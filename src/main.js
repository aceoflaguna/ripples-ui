import 'bootstrap/dist/css/bootstrap.min.css';
import * as bootstrap from 'bootstrap';
import './style.css';
import { registerSW } from 'virtual:pwa-register';

import { registerRoute, setNotFound, startRouter } from './router.js';
import { renderNavbar, wireNavbar } from './components/navbar.js';
import { renderSidebarShell, loadSidebarCommunities } from './components/sidebar.js';

import { renderFeedView } from './views/feed.js';
import { renderLoginView } from './views/login.js';
import { renderRegisterView } from './views/register.js';
import { renderCommunityView } from './views/community.js';
import { renderCommunitiesView } from './views/communities.js';
import { renderPostView } from './views/post.js';
import { renderSubmitView } from './views/submit.js';
import { renderProfileView } from './views/profile.js';
import { renderSearchView } from './views/search.js';

window.bootstrap = bootstrap;

const app = document.getElementById('app');
app.innerHTML = `
  ${renderNavbar()}
  <div class="layout-shell">
    ${renderSidebarShell()}
    <main id="outlet" class="content" tabindex="-1"></main>
  </div>
`;

wireNavbar(app);
loadSidebarCommunities(app);

const outlet = document.getElementById('outlet');

registerRoute('/', (ctx) => renderFeedView(outlet, ctx));
registerRoute('/login', () => renderLoginView(outlet));
registerRoute('/register', () => renderRegisterView(outlet));
registerRoute('/communities', () => renderCommunitiesView(outlet));
registerRoute('/c/:name', (ctx) => renderCommunityView(outlet, ctx));
registerRoute('/post/:id', (ctx) => renderPostView(outlet, ctx));
registerRoute('/submit', (ctx) => renderSubmitView(outlet, ctx));
registerRoute('/u/:username', (ctx) => renderProfileView(outlet, ctx));
registerRoute('/search', (ctx) => renderSearchView(outlet, ctx));

setNotFound(() => `
  <div class="empty-state">
    <h1>404</h1>
    <p>There's nothing at this address. Head back to the front page.</p>
    <a href="#/" class="btn btn-accent">Go home</a>
  </div>
`);

startRouter(outlet);

if ('serviceWorker' in navigator) {
  registerSW({ immediate: true });
}
