/* ========================================
   HOME PAGE LOGIC
   ======================================== */
let allEvents = [];

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await window.api.getEvents();
    allEvents = data;
    renderEvents(allEvents);
    window.allEvents = allEvents;
  } catch (error) {
    showToast('Erreur de chargement des événements', 'error');
  }
});

function renderEvents(events) {
  const container = document.getElementById('eventsGrid');
  container.innerHTML = events
    .filter(e => !isEventPast(e.date))
    .slice(0, 6)
    .map(event => createEventCard(event)).join('');
}

function createEventCard(event) {
  const isPast = isEventPast(event.date);
  const badge = event.places_disponibles < 20 ? 'badge-limited' : 'badge-popular';
  const badgeText = event.places_disponibles < 20 ? 'Places limitées' : 'Populaire';
  const imgUrl = `https://images.unsplash.com/photo-1506157786151-b8491531f565?auto=format&fit=crop&w=800&q=80`;
  
  return `
    <div class="card event-card" onclick="navigateToEvent('${event._id}')">
      <div class="event-card-image" style="background-image: url('${imgUrl}')">
        <span class="event-card-badge ${badge}">${badgeText}</span>
      </div>
      <div class="event-card-content">
        <h3 class="event-card-title">${event.titre}</h3>
        <p class="text-secondary mb-2">📍 ${event.lieu} • ${formatDate(event.date)}</p>
        <div class="event-card-meta">
          <div class="event-card-date">
            <span>🎟️ ${event.places_disponibles} places</span>
          </div>
          <div class="event-card-price">${formatPrice(event.prix)}</div>
        </div>
      </div>
    </div>
  `;
}

function loadHomePage() {
  window.location.href = window.location.pathname;
}

async function searchEvents() {
  const search = document.getElementById('searchEvent').value.toLowerCase();
  const city = document.getElementById('searchCity').value;
  const date = document.getElementById('searchDate').value;
  
  navigateTo('events');
  setTimeout(() => {
    applyFilters(search, city, date);
  }, 100);
}

function navigateToEvent(eventId) {
  showToast('Chargement de l\'événement...', 'info');
}

async function handleLogin() {
  const phone = document.getElementById('loginPhone').value.trim();
  if (!phone) return showToast('Veuillez renseigner votre téléphone', 'error');
  try {
    const user = await window.api.registerOrLoginUser({ telephone: phone });
    currentUser = user;
    localStorage.setItem('eventpass_user', JSON.stringify(user));
    closeModal('authModal');
    renderAuthSection();
    showToast('Connexion réussie !', 'success');
  } catch (e) {
    showToast(e.message || 'Erreur de connexion', 'error');
  }
}

async function handleRegister() {
  const prenom = document.getElementById('registerFirstname').value.trim();
  const nom = document.getElementById('registerLastname').value.trim();
  const telephone = document.getElementById('registerPhone').value.trim();
  const ville = document.getElementById('registerCity').value.trim();
  
  if (!prenom || !nom || !telephone) {
    return showToast('Veuillez renseigner tous les champs obligatoires', 'error');
  }
  
  try {
    const user = await window.api.registerOrLoginUser({ prenom, nom, telephone, ville });
    currentUser = user;
    localStorage.setItem('eventpass_user', JSON.stringify(user));
    closeModal('authModal');
    renderAuthSection();
    showToast('Inscription réussie !', 'success');
  } catch (e) {
    showToast(e.message || 'Erreur d\'inscription', 'error');
  }
}
