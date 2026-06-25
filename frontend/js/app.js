/* ========================================
   CORE APPLICATION
   ======================================== */
let currentUser = null;
let currentPage = 'home';
let isDarkMode = false;
let logoClickCount = 0;
let logoClickTimer = null;
let isAdminLogin = false;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadDarkMode();
  renderAuthSection();
  
  // Easter egg pour le bouton admin
  const logo = document.querySelector('.logo');
  if (logo) {
    logo.addEventListener('click', (e) => {
      e.preventDefault();
      logoClickCount++;
      
      // Réinitialiser le compteur après 2 secondes sans clic
      if (logoClickTimer) clearTimeout(logoClickTimer);
      logoClickTimer = setTimeout(() => { logoClickCount = 0; }, 2000);
      
      if (logoClickCount >= 5) {
        // Afficher le bouton admin
        const adminNav = document.getElementById('adminNavLink');
        adminNav.classList.remove('hidden');
        showToast('Mode admin activé !', 'success');
        logoClickCount = 0;
      }
    });
  }
});

// --- Dark Mode ---
function loadDarkMode() {
  const stored = localStorage.getItem('eventpass_darkmode');
  if (stored === 'true') {
    isDarkMode = true;
    document.body.classList.add('dark-mode');
    document.getElementById('darkModeBtn').textContent = 'Mode Clair';
  }
}

function toggleDarkMode() {
  isDarkMode = !isDarkMode;
  if (isDarkMode) {
    document.body.classList.add('dark-mode');
    document.getElementById('darkModeBtn').textContent = 'Mode Clair';
    localStorage.setItem('eventpass_darkmode', 'true');
  } else {
    document.body.classList.remove('dark-mode');
    document.getElementById('darkModeBtn').textContent = 'Mode Sombre';
    localStorage.setItem('eventpass_darkmode', 'false');
  }
}

// --- Toast Notifications ---
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// --- Modals ---
function openModal(modalId) {
  document.getElementById(modalId).classList.remove('hidden');
}
function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

// --- Auth ---
function checkAuth() {
  const stored = localStorage.getItem('eventpass_user');
  if (stored) {
    currentUser = JSON.parse(stored);
  }
}

function renderAuthSection() {
  // Show/hide admin link and publish button
  const adminNav = document.getElementById('adminNavLink');
  const publishEventBtn = document.getElementById('publishEventBtn');
  if (currentUser && currentUser.role === 'admin') {
    adminNav.classList.remove('hidden');
    publishEventBtn.classList.remove('hidden');
  } else {
    adminNav.classList.add('hidden');
    publishEventBtn.classList.add('hidden');
  }

  const section = document.getElementById('authSection');
  if (currentUser) {
    section.innerHTML = `
      <span class="text-secondary text-sm">Bonjour, <strong class="text-primary">${currentUser.prenom}</strong></span>
      <button class="btn btn-sm btn-outline" onclick="navigateTo('myTickets')">Mes billets</button>
      <button class="btn btn-sm" onclick="handleLogout()">Se déconnecter</button>
    `;
  } else {
    section.innerHTML = `
      <button class="btn btn-outline btn-sm" onclick="switchAuthTab('login'); openModal('authModal')">Se connecter</button>
      <button class="btn btn-primary btn-sm" onclick="switchAuthTab('register'); openModal('authModal')">S'inscrire</button>
    `;
  }
}

function switchAuthTab(tab) {
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const title = document.getElementById('authModalTitle');
  
  // Hide register tab when in admin mode
  if (isAdminLogin) {
    registerTab.classList.add('hidden');
    title.textContent = 'Connexion Admin';
  } else {
    registerTab.classList.remove('hidden');
  }
  
  if (tab === 'login') {
    loginTab.className = 'btn flex-1';
    registerTab.className = 'btn btn-outline flex-1';
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    if (!isAdminLogin) title.textContent = 'Connexion';
  } else if (!isAdminLogin) {
    registerTab.className = 'btn flex-1';
    loginTab.className = 'btn btn-outline flex-1';
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    title.textContent = "S'inscrire";
  }
}

function handleLogout() {
  const userName = currentUser ? `${currentUser.prenom} ${currentUser.nom}` : '';
  localStorage.removeItem('eventpass_user');
  currentUser = null;
  renderAuthSection();
  if (currentPage !== 'home') navigateTo('home');
  if (userName) {
    showToast(`Au revoir ${userName} ! À bientôt sur EventPass !`, 'info');
  } else {
    showToast('Vous êtes déconnecté.', 'info');
  }
}

// --- Navigation ---
function navigateTo(page) {
  currentPage = page;
  // Reset admin login flag when not going to admin
  if (page !== 'admin') {
    isAdminLogin = false;
  }
  const mainContent = document.getElementById('mainContent');
  document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
  
  if (page === 'home') {
    document.querySelector('.nav-link[onclick*="home"]').classList.add('active');
    loadHomePage();
  } else if (page === 'events') {
    document.querySelector('.nav-link[onclick*="events"]').classList.add('active');
    loadEventsPage();
  } else if (page === 'admin') {
    loadAdminPage();
  } else if (page === 'myTickets') {
    loadMyTicketsPage();
  }
}

// --- Helpers ---
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('fr-FR', options);
}
function formatPrice(price) {
  return `${price.toLocaleString('fr-FR')} FCFA`;
}
function isEventPast(eventDate) {
  return new Date(eventDate) < new Date();
}
