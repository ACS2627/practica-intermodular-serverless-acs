import { jwtDecode } from 'jwt-decode';

const COGNITO_DOMAIN = `https://${import.meta.env.VITE_COGNITO_DOMAIN}`;
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_COGNITO_REDIRECT_URI;

export function login() {
  const params = new URLSearchParams({
    response_type: 'token', 
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: '',
    state: 'state-' + Math.random().toString(36).substr(2, 9),
  });
  window.location.href = `${COGNITO_DOMAIN}/oauth2/authorize?${params}`;
}

export function handleCallback() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const idToken = params.get('id_token');
  const accessToken = params.get('access_token');

  if (!idToken) throw new Error('No id_token recibido de Cognito');

  window.history.replaceState({}, document.title, window.location.pathname);

  localStorage.setItem('cognito_id_token', idToken);
  localStorage.setItem('cognito_access_token', accessToken || '');

  return { idToken, accessToken };
}

export function getIdToken() {
  return localStorage.getItem('cognito_id_token');
}

export function isLoggedIn() {
  const token = getIdToken();
  if (!token) return false;
  try {
    const payload = jwtDecode(token);
    const isValid = payload.exp * 1000 > Date.now();
    console.log('Token expira:', new Date(payload.exp * 1000), '¿Válido?', isValid);
    if (!isValid) localStorage.removeItem('cognito_id_token');
    return isValid;
  } catch (error) {
    console.error('Token inválido:', error);
    localStorage.removeItem('cognito_id_token');
    return false;
  }
}

export function logout() {
  localStorage.removeItem('cognito_id_token');
  localStorage.removeItem('cognito_access_token');
  window.location.href = `${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=${REDIRECT_URI}`;
}
