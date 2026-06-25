/* ========================================
   HOME PAGE LOGIC
   ======================================== */
let allEvents = [];
let selectedCountry = 'gabon';
let selectedCategory = 'all';

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
    updateEventsCount(allEvents);
    setupCountrySelector();
    setupCategoryPills();
  } catch (error) {
    console.error('Error loading events:', error);
    showToast('Erreur lors du chargement des événements', 'error');
  }
});

function renderEvents(events) {
  const container = document.getElementById('eventsGrid');
  const currentEvents = events.filter(e => !isEventPast(e.date));
  
  if (currentEvents.length === 0) {
    container.innerHTML = '<p class="text-center text-secondary py-8 col-span-full">Aucun événement à venir</p>';
    return;
  }
  
  container.innerHTML = currentEvents.map(event => createEventCard(event)).join('');
}

function updateEventsCount(events) {
  const count = events.filter(e => !isEventPast(e.date)).length;
  const countElement = document.getElementById('eventsCount');
  if (countElement) {
    countElement.textContent = `${count} événements trouvés`;
  }
}

function setupCountrySelector() {
  const countryPills = document.querySelectorAll('.country-pill');
  countryPills.forEach(pill => {
    pill.addEventListener('click', () => {
      countryPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      selectedCountry = pill.dataset.country;
      filterEvents();
    });
  });
}

function setupCategoryPills() {
  const categoryPills = document.querySelectorAll('.category-pill');
  categoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
      categoryPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      selectedCategory = pill.dataset.category;
      filterEvents();
    });
  });
}

function filterEvents() {
  let filtered = allEvents;
  
  // Filter by country (simulated - in real app, this would be server-side)
  // For now, we'll just show all events since our data doesn't have country field
  
  // Filter by category
  if (selectedCategory !== 'all') {
    filtered = filtered.filter(e => 
      (e.categorie || '').toLowerCase() === selectedCategory.toLowerCase()
    );
  }
  
  renderEvents(filtered);
  updateEventsCount(filtered);
}

function createEventCard(event) {
  const imgUrl = event.image || 'https://images.unsplash.com/photo-1506157786151-b8491531f565?auto=format&fit=crop&w=800&q=80';
  const placesDisponibles = event.places_disponibles || 0;
  const capaciteTotale = event.capacite_totale || 0;
  const placesText = capaciteTotale > 0 ? `${placesDisponibles} restantes sur ${capaciteTotale}` : 'Indisponible';
  
  return `
    <div class="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer" onclick="navigateToEvent('${event._id}')">
      <div class="w-full h-48 bg-cover bg-center relative" style="background-image: url('${imgUrl}')">
        <div class="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-gray-700">
          ${event.categorie || 'Événement'}
        </div>
        <div class="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
          ${placesText}
        </div>
      </div>
      
      <div class="p-5">
        <h3 class="font-bold text-lg text-gray-800 mb-2 line-clamp-1">${event.titre}</h3>
        
        <div class="flex items-center gap-2 text-gray-600 text-sm mb-2">
          <span class="text-primary font-semibold">${formatDate(event.date)}</span>
          <span>•</span>
          <span>${event.lieu}</span>
        </div>
        
        <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div>
            <span class="text-xs text-gray-500">À partir de</span>
            <div class="font-extrabold text-xl text-primary">${formatPrice(event.prix)}</div>
          </div>
          
          <button class="bg-primary text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-primary-dark transition-all" onclick="event.stopPropagation(); navigateToEvent('${event._id}')">
            Réserver
          </button>
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
    const result = await window.api.registerOrLoginUser({ telephone: phone });
    const user = result.utilisateur || result; // handle both cases
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
    const result = await window.api.registerOrLoginUser({ prenom, nom, telephone, ville });
    const user = result.utilisateur || result;
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
