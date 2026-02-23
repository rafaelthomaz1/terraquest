import { createEl, clearChildren } from '../utils/dom.js';
import { login, loginWithGoogle, enterAsGuest, getGoogleClientId } from './auth.js';
import { navigateTo } from '../ui/navigation.js';
import { showRegisterScreen } from './register.js';

export function showLoginScreen() {
  const container = document.getElementById('login-screen');
  clearChildren(container);

  const card = createEl('div', 'auth-card');

  const logo = createEl('img', 'auth-logo');
  logo.src = '/globo.png';
  logo.alt = 'Terra Quest';
  logo.width = 80;
  logo.height = 80;
  card.appendChild(logo);

  card.appendChild(createEl('div', 'auth-title', 'Terra Quest'));
  card.appendChild(createEl('div', 'auth-subtitle', 'Faça login para salvar seus records'));

  const form = createEl('form', 'auth-form');
  form.addEventListener('submit', (e) => e.preventDefault());

  const emailInput = createEl('input', 'auth-input');
  emailInput.type = 'email';
  emailInput.placeholder = 'Email';
  emailInput.autocomplete = 'email';
  emailInput.required = true;
  form.appendChild(emailInput);

  const passInput = createEl('input', 'auth-input');
  passInput.type = 'password';
  passInput.placeholder = 'Senha';
  passInput.autocomplete = 'current-password';
  passInput.required = true;
  form.appendChild(passInput);

  const errorMsg = createEl('div', 'auth-error');
  form.appendChild(errorMsg);

  const loginBtn = createEl('button', 'auth-btn', 'Entrar');
  loginBtn.type = 'submit';
  form.appendChild(loginBtn);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.textContent = '';
    loginBtn.disabled = true;
    loginBtn.textContent = 'Entrando...';
    try {
      await login(emailInput.value, passInput.value);
      navigateTo('home');
    } catch (err) {
      errorMsg.textContent = err.message;
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Entrar';
    }
  });

  card.appendChild(form);

  const divider = createEl('div', 'auth-divider');
  divider.appendChild(createEl('span', 'auth-divider-line'));
  divider.appendChild(createEl('span', 'auth-divider-text', 'ou'));
  divider.appendChild(createEl('span', 'auth-divider-line'));

  const googleBtn = createEl('button', 'auth-btn-google');
  const googleIcon = createEl('img', 'auth-google-icon');
  googleIcon.src = 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg';
  googleIcon.alt = 'Google';
  googleIcon.width = 20;
  googleIcon.height = 20;
  googleBtn.appendChild(googleIcon);
  googleBtn.appendChild(document.createTextNode('Entrar com Google'));
  googleBtn.addEventListener('click', () => initGoogleLogin());

  getGoogleClientId().then((clientId) => {
    if (clientId) {
      card.insertBefore(divider, registerLink);
      card.insertBefore(googleBtn, registerLink);
    }
  });

  const registerLink = createEl('div', 'auth-link');
  registerLink.appendChild(document.createTextNode('Não tem conta? '));
  const regBtn = createEl('button', 'auth-link-btn', 'Criar conta');
  regBtn.addEventListener('click', () => showRegisterScreen());
  registerLink.appendChild(regBtn);
  card.appendChild(registerLink);

  const guestBtn = createEl('button', 'auth-btn-guest', 'Jogar como Convidado');
  guestBtn.addEventListener('click', () => {
    enterAsGuest();
    navigateTo('home');
  });
  card.appendChild(guestBtn);

  container.appendChild(card);
}

async function initGoogleLogin() {
  if (typeof google === 'undefined' || !google.accounts) {
    alert('Google Sign-In não carregou. Verifique sua conexão.');
    return;
  }

  const clientId = await getGoogleClientId();
  if (!clientId) {
    const errorEl = document.querySelector('.auth-error');
    if (errorEl) errorEl.textContent = 'Google Sign-In não está configurado no servidor.';
    return;
  }

  const client = google.accounts.oauth2.initCodeClient({
    client_id: clientId,
    scope: 'openid email profile',
    ux_mode: 'popup',
    callback: async (response) => {
      if (response.error) {
        const errorEl = document.querySelector('.auth-error');
        if (errorEl) errorEl.textContent = 'Falha na autenticação Google';
        return;
      }
      const code = response.code;
      if (!code) {
        const errorEl = document.querySelector('.auth-error');
        if (errorEl) errorEl.textContent = 'Código de autorização não recebido do Google';
        console.error('Google OAuth response sem code:', Object.keys(response));
        return;
      }
      try {
        await loginWithGoogle(code);
        navigateTo('home');
      } catch (err) {
        const errorEl = document.querySelector('.auth-error');
        if (errorEl) errorEl.textContent = err.message;
      }
    },
  });

  client.requestCode();
}
