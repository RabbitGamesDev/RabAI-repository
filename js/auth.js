/* ═══════════════════════════════════════════════════════════════════════════
   RabAI v5.0 "IndieDev Edition" — Auth
   RabbitGamesStudio™ / RGS Labs™
   ═══════════════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────
// 1. Supabase Client
// ─────────────────────────────────────────────────────────────────────────

let supabase = null;
let currentUser = null;
let currentProfile = null;

function initSupabase() {
  if (typeof supabase === 'undefined' || !supabase?.createClient) {
    console.error('Supabase library not loaded');
    return null;
  }
  supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabase;
}

function getSupabase() {
  if (!supabase) initSupabase();
  return supabase;
}

// ─────────────────────────────────────────────────────────────────────────
// 2. Auth State & Session
// ─────────────────────────────────────────────────────────────────────────

async function initAuth() {
  const client = getSupabase();
  if (!client) return false;

  // Check existing session
  const { data: { session }, error } = await client.auth.getSession();
  
  if (error) {
    console.error('Session error:', error);
    showLoginScreen();
    return false;
  }

  if (session?.user) {
    await setUser(session.user);
    return true;
  }

  showLoginScreen();
  return false;
}

async function setUser(user) {
  currentUser = user;
  currentProfile = await fetchProfile(user.id);
  
  // Update UI
  renderUserInfo(user, currentProfile, getSetting('language', 'es'));
  showProjectsScreen();
  loadProjects();
  
  // Update project settings if needed
  updateProjSettings?.();
  
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

// ─────────────────────────────────────────────────────────────────────────
// 3. Login
// ─────────────────────────────────────────────────────────────────────────

async function login(email, password) {
  const client = getSupabase();
  if (!client) throw new Error('Supabase not initialized');

  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password: password
  });

  if (error) throw error;

  if (data?.user) {
    await setUser(data.user);
    showToast('success', t('welcomeBack', getSetting('language', 'es')), '', 3000);
    return data.user;
  }

  throw new Error('Login failed');
}

// ─────────────────────────────────────────────────────────────────────────
// 4. Register
// ─────────────────────────────────────────────────────────────────────────

async function register(email, password) {
  const client = getSupabase();
  if (!client) throw new Error('Supabase not initialized');

  const { data, error } = await client.auth.signUp({
    email: email.trim(),
    password: password,
    options: {
      emailRedirectTo: window.location.origin
    }
  });

  if (error) throw error;

  if (data?.user) {
    // Create profile
    await createProfile(data.user.id, email.trim(), 'free', false, false);
    showToast('success', 'Cuenta creada', 'Revisa tu correo para confirmar', 5000);
    return data.user;
  }

  throw new Error('Registration failed');
}

// ─────────────────────────────────────────────────────────────────────────
// 5. Logout
// ─────────────────────────────────────────────────────────────────────────

async function logout() {
  const client = getSupabase();
  if (!client) return;

  const lang = getSetting('language', 'es');
  if (!confirm(t('logoutConfirm', lang))) return;

  await client.auth.signOut();
  
  currentUser = null;
  currentProfile = null;
  currentProjectId = null;
  currentChatId = null;
  
  // Clear sensitive UI
  document.getElementById('chat-area').innerHTML = '';
  document.getElementById('chat-list').innerHTML = '';
  
  showLoginScreen();
  showToast('info', t('logout', lang), '', 2000);
}

// ─────────────────────────────────────────────────────────────────────────
// 6. Profile Management
// ─────────────────────────────────────────────────────────────────────────

async function fetchProfile(userId) {
  const client = getSupabase();
  if (!client) return null;

  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Profile fetch error:', error);
    return null;
  }

  return data;
}

async function createProfile(userId, email, plan, isAdmin, waitlist) {
  const client = getSupabase();
  if (!client) return null;

  const { data, error } = await client
    .from('profiles')
    .insert([
      { id: userId, email, plan, is_admin: isAdmin, waitlist }
    ])
    .select()
    .single();

  if (error) {
    console.error('Profile creation error:', error);
    return null;
  }

  return data;
}

async function updateProfile(userId, updates) {
  const client = getSupabase();
  if (!client) return null;

  const { data, error } = await client
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Profile update error:', error);
    return null;
  }

  // Refresh local profile
  if (currentUser?.id === userId) {
    currentProfile = data;
    renderUserInfo(currentUser, currentProfile, getSetting('language', 'es'));
  }

  return data;
}

// ─────────────────────────────────────────────────────────────────────────
// 7. Waitlist
// ─────────────────────────────────────────────────────────────────────────

async function joinWaitlist() {
  const user = getCurrentUser();
  if (!user) {
    showToast('error', t('errorAuth', getSetting('language', 'es')), '');
    return false;
  }

  const profile = await updateProfile(user.id, { waitlist: true });
  
  if (profile?.waitlist) {
    showToast('success', t('waitlistJoined', getSetting('language', 'es')), '', 3000);
    return true;
  }

  return false;
}

function isOnWaitlist() {
  return currentProfile?.waitlist || false;
}

// ─────────────────────────────────────────────────────────────────────────
// 8. Plan & Admin
// ─────────────────────────────────────────────────────────────────────────

function getUserPlan() {
  if (currentProfile?.is_admin) return 'admin';
  return currentProfile?.plan || 'free';
}

function isPro() {
  return getUserPlan() === 'pro' || getUserPlan() === 'admin';
}

function isAdmin() {
  return currentProfile?.is_admin || false;
}

// ─────────────────────────────────────────────────────────────────────────
// 9. Auth UI Helpers
// ─────────────────────────────────────────────────────────────────────────

function initAuthUI() {
  const loginTab = document.getElementById('login-tab');
  const registerTab = document.getElementById('register-tab');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  loginTab?.addEventListener('click', () => switchAuthTab('login'));
  registerTab?.addEventListener('click', () => switchAuthTab('register'));

  loginForm?.addEventListener('submit', onLoginSubmit);
  registerForm?.addEventListener('submit', onRegisterSubmit);
}

function switchAuthTab(tab) {
  const loginTab = document.getElementById('login-tab');
  const registerTab = document.getElementById('register-tab');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (tab === 'login') {
    loginTab?.classList.add('active');
    registerTab?.classList.remove('active');
    loginForm?.classList.remove('hidden');
    registerForm?.classList.add('hidden');
  } else {
    loginTab?.classList.remove('active');
    registerTab?.classList.add('active');
    loginForm?.classList.add('hidden');
    registerForm?.classList.remove('hidden');
  }
}

async function onLoginSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const email = form.querySelector('[name="email"]')?.value;
  const password = form.querySelector('[name="password"]')?.value;
  const submitBtn = form.querySelector('button[type="submit"]');
  const errorEl = form.querySelector('.form-error');

  // Validation
  if (!email || !password) {
    showFormError(errorEl, t('errorRequired', 'es'));
    return;
  }

  submitBtn.disabled = true;
  errorEl?.classList.remove('visible');

  try {
    await login(email, password);
  } catch (err) {
    showFormError(errorEl, err.message || t('errorAuth', 'es'));
  } finally {
    submitBtn.disabled = false;
  }
}

async function onRegisterSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const email = form.querySelector('[name="email"]')?.value;
  const password = form.querySelector('[name="password"]')?.value;
  const confirmPassword = form.querySelector('[name="confirmPassword"]')?.value;
  const submitBtn = form.querySelector('button[type="submit"]');
  const errorEl = form.querySelector('.form-error');

  // Validation
  if (!email || !password || !confirmPassword) {
    showFormError(errorEl, t('errorRequired', 'es'));
    return;
  }

  if (password.length < 6) {
    showFormError(errorEl, t('errorPassword', 'es'));
    return;
  }

  if (password !== confirmPassword) {
    showFormError(errorEl, t('errorPasswordMatch', 'es'));
    return;
  }

  submitBtn.disabled = true;
  errorEl?.classList.remove('visible');

  try {
    await register(email, password);
    switchAuthTab('login');
  } catch (err) {
    showFormError(errorEl, err.message || t('errorAuth', 'es'));
  } finally {
    submitBtn.disabled = false;
  }
}

function showFormError(el, message) {
  if (!el) return;
  el.textContent = message;
  el.classList.add('visible');
}

// ─────────────────────────────────────────────────────────────────────────
// 10. Delete Account
// ─────────────────────────────────────────────────────────────────────────

async function deleteUserAccount() {
  const user = getCurrentUser();
  if (!user) return;

  const lang = getSetting('language', 'es');
  if (!confirm(t('deleteAccountConfirm', lang))) return;

  const client = getSupabase();
  if (!client) return;

  // Clear all local data first
  clearAllData(user.id);

  // Delete profile
  await client.from('profiles').delete().eq('id', user.id);

  // Sign out
  await logout();

  showToast('info', 'Cuenta eliminada', '', 3000);
}

// ─────────────────────────────────────────────────────────────────────────
// 11. Export
// ─────────────────────────────────────────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initSupabase, getSupabase,
    initAuth, setUser, getCurrentUser, getCurrentProfile, isLoggedIn,
    login, register, logout,
    fetchProfile, createProfile, updateProfile,
    joinWaitlist, isOnWaitlist,
    getUserPlan, isPro, isAdmin,
    initAuthUI, switchAuthTab, deleteUserAccount
  };
}