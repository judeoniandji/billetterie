/* ========================================
   HOME PAGE LOGIC
   ======================================== */
let allEvents = [];

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await window.api.getEvents();
    // Handle both cases: if data is { evenements: ... } or directly array
    if (data.evenements) {
      allEvents = data.evenements;
    } else if (Array.isArray(data)) {
      allEvents = data;
    } else {
      allEvents = [];
    }
    window.allEvents = allEvents;
    renderEvents(allEvents);
  } catch (error) {
    console.error('Error loading events:', error);
    showToast('Erreur lors du chargement des événements', 'error');
  }
});

function renderEvents(events) {
  const container = document.getElementById('eventsGrid');
  const currentEvents = events.filter(e => !isEventPast(e.date)).slice(0, 6);
  
  if (currentEvents.length === 0) {
    container.innerHTML = '<p class="text-center text-secondary py-8 col-span-full">Aucun événement à venir</p>';
    return;
  }
  
  container.innerHTML = currentEvents.map(event => createEventCard(event)).join('');
}

function createEventCard(event) {
  const badge = event.places_disponibles < 100 ? 'badge-limited' : 'badge-popular';
  const badgeText = event.places_disponibles < 100 ? 'Places limitées' : 'Populaire';
  const imgUrl = event.image || 'https://images.unsplash.com/photo-1506157786151-b8491531f565?auto=format&fit=crop&w=800&q=80';
  
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
  const event = window.allEvents.find(e => e._id === eventId);
  if (!event) {
    showToast('Événement introuvable', 'error');
    return;
  }
  selectedEvent = event;
  loadEventDetailPage(event);
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
    // Message personnalisé
    const roleText = user.role === 'admin' ? 'Administrateur' : 'Acheteur';
    showToast(`Bonjour ${user.prenom} ${user.nom} ! (${roleText})`, 'success');
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
    // Message personnalisé
    showToast(`Bonjour ${user.prenom} ${user.nom} ! Bienvenue sur EventPass !`, 'success');
  } catch (e) {
    showToast(e.message || 'Erreur d\'inscription', 'error');
  }
}
