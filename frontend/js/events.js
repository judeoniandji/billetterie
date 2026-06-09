/* ========================================
   EVENTS PAGE & DETAILS
   ======================================== */
let filteredEvents = [];
let selectedEvent = null;

function createEventCard(event) {
  const isPast = isEventPast(event.date);
  const badge = event.places_disponibles < 20 ? 'badge-limited' : 'badge-popular';
  const badgeText = event.places_disponibles < 20 ? 'Places limitées' : 'Populaire';
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

async function loadEventsPage() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="events-page">
      <div class="container">
        <h1 class="text-3xl font-semibold mb-8">Tous les événements</h1>
        <div class="flex flex-col lg:flex-row gap-8">
          <div class="lg:w-1/4">
            <div class="filters-sidebar bg-white rounded-xl shadow-lg p-6 sticky top-6">
              <div class="filter-section mb-6">
                <h4 class="filter-title font-semibold mb-3 text-lg">Catégorie</h4>
                <div class="filter-checkbox mb-2">
                  <input type="checkbox" id="cat-concert" class="category-filter" data-cat="Concert">
                  <label for="cat-concert">Concert</label>
                </div>
                <div class="filter-checkbox mb-2">
                  <input type="checkbox" id="cat-sport" class="category-filter" data-cat="Sport">
                  <label for="cat-sport">Sport</label>
                </div>
                <div class="filter-checkbox">
                  <input type="checkbox" id="cat-conf" class="category-filter" data-cat="Conférence">
                  <label for="cat-conf">Conférence</label>
                </div>
              </div>

              <div class="filter-section mb-6">
                <h4 class="filter-title font-semibold mb-3 text-lg">Prix maximum</h4>
                <input type="range" id="priceRange" min="0" max="100000" value="100000" class="range-input w-full" oninput="updatePriceDisplay()">
                <p id="priceRangeDisplay" class="price-display font-semibold text-primary">100 000 FCFA</p>
              </div>

              <div class="filter-section mb-6">
                <h4 class="filter-title font-semibold mb-3 text-lg">Trier par</h4>
                <select id="sortSelect" class="select w-full" onchange="applyFilters()">
                  <option value="date">Date</option>
                  <option value="price-asc">Prix croissant</option>
                  <option value="price-desc">Prix décroissant</option>
                </select>
              </div>

              <button class="btn btn-outline btn-full" onclick="resetFilters()">Réinitialiser</button>
            </div>
          </div>

          <div class="lg:w-3/4">
            <div id="eventsList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  try {
    const data = await window.api.getEvents();
    let events = data;
    if (data.evenements) events = data.evenements;
    filteredEvents = events.filter(e => !isEventPast(e.date));
    window.allEvents = events;
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
  const price = parseInt(document.getElementById('priceRange').value, 10);
  document.getElementById('priceRangeDisplay').textContent = `${price.toLocaleString('fr-FR')} FCFA`;
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
  document.getElementById('priceRange').value = 100000;
  document.getElementById('priceRangeDisplay').textContent = '100 000 FCFA';
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
  const imgUrl = event.image || 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1600&q=80';
  
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
      <div class="container max-w-5xl">
        <h1 class="text-3xl font-semibold mb-8 text-center">Finaliser votre réservation</h1>
        
        <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8 flex items-center gap-4">
          <span class="text-4xl">⏱️</span>
          <div>
            <h3 class="font-semibold text-xl mb-1">Votre réservation est en attente !</h3>
            <p class="text-yellow-800">Vous avez <span id="reservationTimer" class="font-bold text-red-600 text-2xl">10:00</span> pour confirmer votre paiement.</p>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="bg-white rounded-xl shadow-lg p-8">
            <div class="flex items-center gap-3 mb-6">
              <span class="text-3xl">👤</span>
              <h3 class="text-xl font-semibold">Informations personnelles</h3>
            </div>
            <div class="space-y-6">
              <div class="input-group">
                <label class="text-sm font-semibold text-gray-700">Nom complet</label>
                <input type="text" class="input bg-gray-50" value="${currentUser.prenom} ${currentUser.nom}" disabled>
              </div>
              <div class="input-group">
                <label class="text-sm font-semibold text-gray-700">Téléphone</label>
                <input type="text" class="input bg-gray-50" value="${currentUser.telephone}" disabled>
              </div>
              <div class="input-group">
                <label class="text-sm font-semibold text-gray-700">Email</label>
                <input type="email" class="input" placeholder="votre@email.com" value="${currentUser.email || ''}">
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-8">
            <div class="flex items-center gap-3 mb-6">
              <span class="text-3xl">🎫</span>
              <h3 class="text-xl font-semibold">Récapitulatif de la commande</h3>
            </div>
            
            <div class="mb-8 pb-8 border-b border-gray-200">
              <div class="flex items-start gap-4 mb-4">
                <div class="w-20 h-20 bg-cover bg-center rounded-lg" style="background-image: url('${event.image}')"></div>
                <div class="flex-1">
                  <h4 class="font-semibold text-lg">${event.titre}</h4>
                  <p class="text-sm text-secondary">📍 ${event.lieu}</p>
                  <p class="text-sm text-secondary">📅 ${formatDate(event.date)}</p>
                </div>
              </div>
              
              <div class="flex justify-between items-center py-3 border-t border-gray-100">
                <span class="text-secondary">Nombre de places</span>
                <span class="font-semibold text-lg">${ticketCount}</span>
              </div>
              <div class="flex justify-between items-center py-3 border-t border-gray-100">
                <span class="text-secondary">Prix par place</span>
                <span class="font-semibold">${formatPrice(event.prix)}</span>
              </div>
            </div>
            
            <div class="flex justify-between items-center mb-8 p-4 bg-primary-light rounded-xl">
              <span class="font-semibold text-xl">Total à payer</span>
              <span class="font-bold text-2xl text-primary">${formatPrice(totalPrice)}</span>
            </div>
            
            <button class="btn btn-success btn-full btn-lg text-lg py-4" onclick="confirmPayment('${event._id}', ${ticketCount}, ${totalPrice})">
              ✅ Confirmer et payer
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
    const result = await window.api.createReservation(reservationData);
    const reservation = result.reservation; // extract from { message, reservation }
    const payResult = await window.api.payReservation(reservation._id);
    showToast('Paiement confirmé! Votre billet est prêt!', 'success');
    navigateTo('myTickets');
  } catch(e) {
    showToast(e.message || 'Erreur de paiement', 'error');
  }
}
