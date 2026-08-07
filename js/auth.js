/* ═══════════════════════════════════════════════════════════════════════════
   RabAI v5.0 "IndieDev Edition" — Auth
   RabbitGamesStudio™ / RGS Labs™
   ═══════════════════════════════════════════════════════════════════════════ */

var supabaseClient = null;
var currentUser = null;
var currentProfile = null;

function initSupabase() {
  if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
    console.error('Supabase library not loaded');
    return null;
  }
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabaseClient;
}

function getSupabase() {
  if (!supabaseClient) initSupabase();
  return supabaseClient;
}

async function initAuth() {
  var client = getSupabase();
  if (!client) return false;

  var result = await client.auth.getSession();
  var session = result.data ? result.data.session : null;
  var error = result.error;

  if (error) {
    console.error('Session error:', error);
    showLoginScreen();
    return false;
  }

  if (session && session.user) {
    await setUser(session.user);
    return true;
  }

  showLoginScreen();
  return false;
}

async function setUser(user) {
  currentUser = user;
  currentProfile = await fetchProfile(user.id);
  renderUserInfo(user, currentProfile, getSetting('language', 'es'));
  showProjectsScreen();
  loadProjects();
  // Removed: updateProjSettings() — function doesn't exist
  return currentProfile;
}

function getCurrentUser() {
  return currentUser;
}

function getCurrentProfile() {
  return currentProfile;
}

function isLoggedIn() {
  return !!currentUser;
}

async function login(email, password) {
  var client = getSupabase();
  if (!client) throw new Error('Supabase not initialized');

  var result = await client.auth.signInWithPassword({
    email: email.trim(),
    password: password
  });

  if (result.error) throw result.error;
  if (result.data && result.data.user) {
    await setUser(result.data.user);
    showToast('success', t('welcomeBack', getSetting('language', 'es')), '', 3000);
    return result.data.user;
  }
  throw new Error('Login failed');
}

async function register(email, password) {
  var client = getSupabase();
  if (!client) throw new Error('Supabase not initialized');

  var result = await client.auth.signUp({
    email: email.trim(),
    password: password,
    options: { emailRedirectTo: window.location.origin }
  });

  if (result.error) throw result.error;
  if (result.data && result.data.user) {
    await createProfile(result.data.user.id, email.trim(), 'free', false, false);
    showToast('success', 'Cuenta creada', 'Revisa tu correo para confirmar', 5000);
    return result.data.user;
  }
  throw new Error('Registration failed');
}

async function logout() {
  var client = getSupabase();
  if (!client) return;

  var lang = getSetting('language', 'es');
  if (!confirm(t('logoutConfirm', lang))) return;

  await client.auth.signOut();
  currentUser = null;
  currentProfile = null;
  window.currentProjectId = null;
  window.currentChatId = null;

  document.getElementById('chat-area').innerHTML = '';
  document.getElementById('chat-list').innerHTML = '';

  showLoginScreen();
  showToast('info', t('logout', lang), '', 2000);
}

async function fetchProfile(userId) {
  var client = getSupabase();
  if (!client) return null;

  var result = await client.from('profiles').select('*').eq('id', userId).single();
  if (result.error) {
    console.error('Profile fetch error:', result.error);
    return null;
  }
  return result.data;
}

async function createProfile(userId, email, plan, isAdmin, waitlist) {
  var client = getSupabase();
  if (!client) return null;

  var result = await client.from('profiles').insert([
    { id: userId, email: email, plan: plan, is_admin: isAdmin, waitlist: waitlist }
  ]).select().single();

  if (result.error) {
    console.error('Profile creation error:', result.error);
    return null;
  }
  return result.data;
}

async function updateProfile(userId, updates) {
  var client = getSupabase();
  if (!client) return null;

  var result = await client.from('profiles').update(updates).eq('id', userId).select().single();
  if (result.error) {
    console.error('Profile update error:', result.error);
    return null;
  }
  if (currentUser && currentUser.id === userId) {
    currentProfile = result.data;
    renderUserInfo(currentUser, currentProfile, getSetting('language', 'es'));
  }
  return result.data;
}

async function joinWaitlist() {
  var user = getCurrentUser();
  if (!user) {
    showToast('error', t('errorAuth', getSetting('language', 'es')), '');
    return false;
  }
  var profile = await updateProfile(user.id, { waitlist: true });
  if (profile && profile.waitlist) {
    showToast('success', t('waitlistJoined', getSetting('language', 'es')), '', 3000);
    return true;
  }
  return false;
}

function isOnWaitlist() {
  return currentProfile && currentProfile.waitlist;
}

function getUserPlan() {
  if (currentProfile && currentProfile.is_admin) return 'admin';
  return currentProfile && currentProfile.plan ? currentProfile.plan : 'free';
}

function isPro() {
  return getUserPlan() === 'pro' || getUserPlan() === 'admin';
}

function isAdmin() {
  return currentProfile && currentProfile.is_admin;
}

function initAuthUI() {
  var loginTab = document.getElementById('login-tab');
  var registerTab = document.getElementById('register-tab');
  var loginForm = document.getElementById('login-form');
  var registerForm = document.getElementById('register-form');

  if (loginTab) loginTab.addEventListener('click', function() { switchAuthTab('login'); });
  if (registerTab) registerTab.addEventListener('click', function() { switchAuthTab('register'); });
  if (loginForm) loginForm.addEventListener('submit', onLoginSubmit);
  if (registerForm) registerForm.addEventListener('submit', onRegisterSubmit);
}

function switchAuthTab(tab) {
  var loginTab = document.getElementById('login-tab');
  var registerTab = document.getElementById('register-tab');
  var loginForm = document.getElementById('login-form');
  var registerForm = document.getElementById('register-form');

  if (tab === 'login') {
    if (loginTab) loginTab.classList.add('active');
    if (registerTab) registerTab.classList.remove('active');
    if (loginForm) loginForm.classList.remove('hidden');
    if (registerForm) registerForm.classList.add('hidden');
  } else {
    if (loginTab) loginTab.classList.remove('active');
    if (registerTab) registerTab.classList.add('active');
    if (loginForm) loginForm.classList.add('hidden');
    if (registerForm) registerForm.classList.remove('hidden');
  }
}

async function onLoginSubmit(e) {
  e.preventDefault();
  var form = e.target;
  var email = form.querySelector('[name="email"]');
  var password = form.querySelector('[name="password"]');
  var submitBtn = form.querySelector('button[type="submit"]');
  var errorEl = form.querySelector('.form-error');

  if (!email.value || !password.value) {
    showFormError(errorEl, t('errorRequired', 'es'));
    return;
  }

  submitBtn.disabled = true;
  if (errorEl) errorEl.classList.remove('visible');

  try {
    await login(email.value, password.value);
  } catch (err) {
    showFormError(errorEl, err.message || t('errorAuth', 'es'));
  } finally {
    submitBtn.disabled = false;
  }
}

async function onRegisterSubmit(e) {
  e.preventDefault();
  var form = e.target;
  var email = form.querySelector('[name="email"]');
  var password = form.querySelector('[name="password"]');
  var confirmPassword = form.querySelector('[name="confirmPassword"]');
  var submitBtn = form.querySelector('button[type="submit"]');
  var errorEl = form.querySelector('.form-error');

  if (!email.value || !password.value || !confirmPassword.value) {
    showFormError(errorEl, t('errorRequired', 'es'));
    return;
  }
  if (password.value.length < 6) {
    showFormError(errorEl, t('errorPassword', 'es'));
    return;
  }
  if (password.value !== confirmPassword.value) {
    showFormError(errorEl, t('errorPasswordMatch', 'es'));
    return;
  }

  submitBtn.disabled = true;
  if (errorEl) errorEl.classList.remove('visible');

  try {
    await register(email.value, password.value);
    switchAuthTab('login');
  } catch (err) {
    showFormError(errorEl, err.message || t('errorAuth', 'es'));
  } finally {
    submitBtn.disabled = false;
  }
}

function showFormError(el, message) {
  if (!el) return;
  el.textContent = message || 'Error';
  el.classList.add('visible');
}

async function deleteUserAccount() {
  var user = getCurrentUser();
  if (!user) return;

  var lang = getSetting('language', 'es');
  if (!confirm(t('deleteAccountConfirm', lang))) return;

  var client = getSupabase();
  if (!client) return;

  clearAllData(user.id);
  await client.from('profiles').delete().eq('id', user.id);
  await logout();
  showToast('info', 'Cuenta eliminada', '', 3000);
}