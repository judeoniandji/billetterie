/* ========================================
   EVENTS PAGE & DETAILS
   ======================================== */
let filteredEvents = [];
let selectedEvent = null;

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

async function loadEventsPage() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="events-page">
      <div class="container">
        <h1 class="text-3xl font-semibold mb-8">Tous les événements</h1>
        <div class="grid grid-cols-4 gap-6">
          <div class="grid-cols-1">
            <div class="filters-sidebar">
              <div class="filter-section">
                <h4 class="filter-title">Catégorie</h4>
                <div class="filter-checkbox">
                  <input type="checkbox" id="cat-concert" class="category-filter" data-cat="Concert">
                  <label for="cat-concert">Concert</label>
                </div>
                <div class="filter-checkbox">
                  <input type="checkbox" id="cat-sport" class="category-filter" data-cat="Sport">
                  <label for="cat-sport">Sport</label>
                </div>
                <div class="filter-checkbox">
                  <input type="checkbox" id="cat-conf" class="category-filter" data-cat="Conférence">
                  <label for="cat-conf">Conférence</label>
                </div>
              </div>

              <div class="filter-section">
                <h4 class="filter-title">Prix maximum</h4>
                <input type="range" id="priceRange" min="0" max="500" value="500" class="range-input" oninput="updatePriceDisplay()">
                <p id="priceRangeDisplay" class="price-display">500 €</p>
              </div>

              <div class="filter-section">
                <h4 class="filter-title">Trier par</h4>
                <select id="sortSelect" class="select" onchange="applyFilters()">
                  <option value="date">Date</option>
                  <option value="price-asc">Prix croissant</option>
                  <option value="price-desc">Prix décroissant</option>
                </select>
              </div>

              <button class="btn btn-outline btn-full mt-4" onclick="resetFilters()">Réinitialiser</button>
            </div>
          </div>

          <div class="grid-cols-3">
            <div id="eventsList" class="grid grid-cols-2 gap-6"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  try {
    const data = await window.api.getEvents();
    filteredEvents = data.filter(e => !isEventPast(e.date));
    window.allEvents = data;
    renderEventsList(filteredEvents);
  } catch(e) {
    filteredEvents = window.allEvents.filter(e => !isEventPast(e.date));
    renderEventsList(filteredEvents);
  }
}

function renderEventsList(events) {
  const container = document.getElementById('eventsList');
  if (events.length === 0) {
    container.innerHTML = '<p class="text-center text-secondary col-span-2 py-12">Aucun événement ne correspond à vos filtres.</p>';
    return;
  }
  container.innerHTML = events.map(e => createEventCard(e)).join('');
}

function updatePriceDisplay() {
  const price = document.getElementById('priceRange').value;
  document.getElementById('priceRangeDisplay').textContent = `${price} €`;
  applyFilters();
}

function applyFilters(searchQuery = '', city = '', date = '') {
  let eventsList = filteredEvents.length > 0 ? [...filteredEvents] : window.allEvents.filter(e => !isEventPast(e.date));
  if (searchQuery) eventsList = eventsList.filter(e => e.titre.toLowerCase().includes(searchQuery));
  if (city) eventsList = eventsList.filter(e => e.lieu.toLowerCase().includes(city.toLowerCase()));
  if (date) eventsList = eventsList.filter(e => e.date.startsWith(date));

  const categories = Array.from(document.querySelectorAll('.category-filter:checked')).map(el => el.dataset.cat);
  if (categories.length) eventsList = eventsList.filter(e => categories.includes(e.categorie));

  const maxPrice = parseInt(document.getElementById('priceRange').value, 10);
  eventsList = eventsList.filter(e => e.prix <= maxPrice);

  const sort = document.getElementById('sortSelect')?.value || 'date';
  if (sort === 'price-asc') eventsList.sort((a,b) => a.prix - b.prix);
  if (sort === 'price-desc') eventsList.sort((a,b) => b.prix - a.prix);
  if (sort === 'date') eventsList.sort((a,b) => new Date(a.date) - new Date(b.date));

  renderEventsList(eventsList);
}

function resetFilters() {
  document.querySelectorAll('.category-filter').forEach(cb => cb.checked = false);
  document.getElementById('priceRange').value = 500;
  document.getElementById('priceRangeDisplay').textContent = '500 €';
  renderEventsList(window.allEvents.filter(e => !isEventPast(e.date)));
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

function loadEventDetailPage(event) {
  const main = document.getElementById('mainContent');
  const imgUrl = `https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1600&q=80`;
  
  main.innerHTML = `
    <div class="py-8">
      <div class="container">
        <button class="btn btn-outline mb-8" onclick="navigateTo('events')">← Retour aux événements</button>
        
        <div class="grid grid-cols-3 gap-8">
          <div class="grid-cols-2">
            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
              <div class="w-full h-80 bg-cover bg-center" style="background-image: url('${imgUrl}')"></div>
              
              <div class="p-8">
                <div class="flex items-center gap-2 text-sm text-secondary mb-3">
                  <span>📅 ${formatDate(event.date)}</span>
                  <span>•</span>
                  <span>📍 ${event.lieu}</span>
                </div>
                
                <h1 class="text-4xl font-semibold mb-4">${event.titre}</h1>
                <p class="text-secondary leading-relaxed mb-8">${event.description || 'Découvrez un événement exceptionnel !'}</p>
              </div>
              </div>
          </div>

          <div class="grid-cols-1">
            <div class="bg-white rounded-xl shadow-lg p-8">
              <div class="mb-6">
                <h3 class="text-2xl font-semibold mb-2">${formatPrice(event.prix)}</h3>
                <div class="flex items-center gap-2 text-sm text-secondary">
                  <span>🎟️ ${event.places_disponibles} places restantes</span>
                </div>
              </div>

              <div class="border-t border-b border-gray-100 py-6 mb-6">
                <div class="flex justify-between mb-4">
                  <span class="text-secondary">Date</span>
                  <span class="font-semibold">${formatDate(event.date)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-secondary">Lieu</span>
                  <span class="font-semibold">${event.lieu}</span>
                </div>
              </div>

              <div class="input-group mb-6">
                <label>Nombre de places</label>
                <input type="number" id="ticketCount" value="1" min="1" max="${event.places_disponibles}" class="input">
              </div>

              <button class="btn btn-primary btn-full btn-lg" onclick="startReservation('${event._id}')">
                Réserver maintenant
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function startReservation(eventId) {
  if (!currentUser) {
    switchAuthTab('login');
    openModal('authModal');
    showToast('Veuillez vous connecter pour réserver.', 'info');
    return;
  }

  selectedEvent = window.allEvents.find(e => e._id === eventId);
  const ticketCount = parseInt(document.getElementById('ticketCount').value,10);
  loadReservationPage(selectedEvent, ticketCount);
}

function loadReservationPage(event, ticketCount) {
  const main = document.getElementById('mainContent');
  const totalPrice = event.prix * ticketCount;
  
  let reservationTimer = 600;
  const updateTimer = () => {
    const mins = Math.floor(reservationTimer / 60).toString().padStart(2, '0');
    const secs = (reservationTimer % 60).toString().padStart(2, '0');
    const el = document.getElementById('reservationTimer');
    if (el) el.textContent = `${mins}:${secs}`;
  };
  const timerInterval = setInterval(() => {
    reservationTimer--;
    updateTimer();
    if (reservationTimer <= 0) {
      clearInterval(timerInterval);
      showToast('Votre réservation a expiré.', 'error');
      navigateTo('events');
    }
  },1000);

  main.innerHTML = `
    <div class="py-16">
      <div class="container max-w-4xl">
        <h1 class="text-3xl font-semibold mb-8 text-center">Finaliser votre réservation</h1>
        
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 flex items-center gap-3">
          <span class="text-2xl">⏱️</span>
          <div>
            <strong>Votre réservation est en attente !</strong><br>
            <span class="text-yellow-800">Vous avez <span id="reservationTimer" class="font-semibold text-red-600">10:00</span> pour confirmer votre paiement.</span>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-8">
          <div class="bg-white rounded-xl shadow-lg p-8">
            <h3 class="text-xl font-semibold mb-6">Informations</h3>
            <div class="input-group">
              <label>Nom complet</label>
              <input type="text" class="input" value="${currentUser.prenom} ${currentUser.nom}" disabled>
            </div>
            <div class="input-group">
              <label>Téléphone</label>
              <input type="text" class="input" value="${currentUser.telephone}" disabled>
            </div>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-8">
            <h3 class="text-xl font-semibold mb-6">Récapitulatif</h3>
            
            <div class="mb-6 pb-6 border-b border-gray-100">
              <div class="flex justify-between mb-2">
                <span>${event.titre}</span>
                <span>x${ticketCount}</span>
              </div>
              <p class="text-sm text-secondary">📍 ${event.lieu} • ${formatDate(event.date)}</p>
            </div>
            
            <div class="flex justify-between text-xl font-semibold mb-8">
              <span>Total</span>
              <span class="text-primary">${formatPrice(totalPrice)}</span>
            </div>
            
            <button class="btn btn-success btn-full btn-lg" onclick="confirmPayment('${event._id}', ${ticketCount}, ${totalPrice})">
              Confirmer le paiement
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function confirmPayment(eventId, ticketCount, total) {
  try {
    showToast('Traitement en cours...', 'info');
    const reservationData = {
      utilisateur_id: currentUser._id, evenement_id: eventId, nombre_places: ticketCount
    };
    const reservation = await window.api.createReservation(reservationData);
    await window.api.payReservation(reservation._id);
    loadTicketPage(reservation, selectedEvent, ticketCount);
  } catch(e) {
    showToast(e.message || 'Erreur de paiement', 'error');
  }
}
