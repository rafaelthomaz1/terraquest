import { createEl, clearChildren } from '../utils/dom.js';
import { register, loginWithGoogle, getGoogleClientId } from './auth.js';
import { navigateTo } from '../ui/navigation.js';
import { showLoginScreen } from './login.js';

export function showRegisterScreen() {
  const container = document.getElementById('register-screen');
  clearChildren(container);

  // Esconde login, mostra register
  document.getElementById('login-screen').style.display = 'none';
  container.style.display = 'flex';

  const card = createEl('div', 'auth-card');

  const logo = createEl('img', 'auth-logo');
  logo.src = '/globo.png';
  logo.alt = 'Terra Quest';
  logo.width = 80;
  logo.height = 80;
  card.appendChild(logo);

  card.appendChild(createEl('div', 'auth-title', 'Criar Conta'));
  card.appendChild(createEl('div', 'auth-subtitle', 'Cadastre-se para salvar seus records'));

  const form = createEl('form', 'auth-form');
  form.addEventListener('submit', (e) => e.preventDefault());

  const nameInput = createEl('input', 'auth-input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Nome';
  nameInput.autocomplete = 'name';
  nameInput.required = true;
  nameInput.maxLength = 100;
  form.appendChild(nameInput);

  const emailInput = createEl('input', 'auth-input');
  emailInput.type = 'email';
  emailInput.placeholder = 'Email';
  emailInput.autocomplete = 'email';
  emailInput.required = true;
  form.appendChild(emailInput);

  const passInput = createEl('input', 'auth-input');
  passInput.type = 'password';
  passInput.placeholder = 'Senha (mín. 6 caracteres)';
  passInput.autocomplete = 'new-password';
  passInput.required = true;
  passInput.minLength = 6;
  form.appendChild(passInput);

  const confirmInput = createEl('input', 'auth-input');
  confirmInput.type = 'password';
  confirmInput.placeholder = 'Confirmar senha';
  confirmInput.autocomplete = 'new-password';
  confirmInput.required = true;
  form.appendChild(confirmInput);

  const errorMsg = createEl('div', 'auth-error');
  form.appendChild(errorMsg);

  const registerBtn = createEl('button', 'auth-btn', 'Criar Conta');
  registerBtn.type = 'submit';
  form.appendChild(registerBtn);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.textContent = '';

    if (passInput.value !== confirmInput.value) {
      errorMsg.textContent = 'As senhas não coincidem';
      return;
    }

    registerBtn.disabled = true;
    registerBtn.textContent = 'Criando conta...';
    try {
      await register(nameInput.value, emailInput.value, passInput.value);
      navigateTo('home');
    } catch (err) {
      errorMsg.textContent = err.message;
    } finally {
      registerBtn.disabled = false;
      registerBtn.textContent = 'Criar Conta';
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
  googleBtn.appendChild(document.createTextNode('Cadastrar com Google'));
  googleBtn.addEventListener('click', async () => {
    if (typeof google === 'undefined' || !google.accounts) {
      alert('Google Sign-In não carregou. Verifique sua conexão.');
      return;
    }

    const clientId = await getGoogleClientId();
    if (!clientId) {
      errorMsg.textContent = 'Google Sign-In não está configurado no servidor.';
      return;
    }

    const client = google.accounts.oauth2.initCodeClient({
      client_id: clientId,
      scope: 'openid email profile',
      ux_mode: 'popup',
      callback: async (response) => {
        if (response.error) {
          errorMsg.textContent = 'Falha na autenticação Google';
          return;
        }
        const code = response.code;
        if (!code) {
          errorMsg.textContent = 'Código de autorização não recebido do Google';
          console.error('Google OAuth response sem code:', Object.keys(response));
          return;
        }
        try {
          await loginWithGoogle(code);
          navigateTo('home');
        } catch (err) {
          errorMsg.textContent = err.message;
        }
      },
    });

    client.requestCode();
  });

  getGoogleClientId().then((clientId) => {
    if (clientId) {
      card.insertBefore(divider, loginLink);
      card.insertBefore(googleBtn, loginLink);
    }
  });

  const loginLink = createEl('div', 'auth-link');
  loginLink.appendChild(document.createTextNode('Já tem conta? '));
  const loginBtn = createEl('button', 'auth-link-btn', 'Fazer login');
  loginBtn.addEventListener('click', () => {
    container.style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    showLoginScreen();
  });
  loginLink.appendChild(loginBtn);
  card.appendChild(loginLink);

  container.appendChild(card);
}
