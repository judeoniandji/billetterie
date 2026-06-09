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
        <p class="text-secondary mb-2">${event.lieu} • ${formatDate(event.date)}</p>
        <div class="event-card-meta">
          <div class="event-card-date">
            <span>${event.places_disponibles} places</span>
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
    <div>
      <!-- Hero Section with Event Image -->
      <div class="relative w-full h-[450px] overflow-hidden">
        <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('${imgUrl}')"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
        
        <!-- Back Button -->
        <div class="relative container pt-6">
          <button class="bg-white/20 backdrop-blur-md border border-white/30 text-white px-4 py-2 rounded-full hover:bg-white/30 transition-all flex items-center gap-2" onclick="navigateTo('events')">
            <span>←</span> Retour aux événements
          </button>
        </div>
        
        <!-- Hero Text -->
        <div class="relative container absolute bottom-0 left-0 right-0 pb-12">
          <div class="flex items-center gap-4 text-white/90 mb-4">
            <span class="bg-white/20 backdrop-blur-md px-4 py-1 rounded-full text-sm flex items-center gap-2">
              ${formatDate(event.date)}
            </span>
            <span class="bg-white/20 backdrop-blur-md px-4 py-1 rounded-full text-sm flex items-center gap-2">
              ${event.lieu}
            </span>
          </div>
          <h1 class="text-4xl md:text-5xl font-bold text-white mb-3">${event.titre}</h1>
        </div>
      </div>
      
      <!-- Main Content -->
      <div class="container py-10">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <!-- Left Column: Details -->
          <div class="lg:col-span-2">
            <div class="bg-white rounded-2xl shadow-lg p-8">
              <h2 class="text-2xl font-bold mb-4 text-gray-800">À propos de cet événement</h2>
              <p class="text-gray-600 leading-relaxed text-lg">${event.description || 'Rejoignez-nous pour un événement inoubliable rempli de moments exceptionnels !'}</p>
            </div>
          </div>
          
          <!-- Right Column: Booking Card -->
          <div class="lg:col-span-1">
            <div class="bg-white rounded-2xl shadow-xl overflow-hidden sticky top-24">
              <div class="p-6 bg-gradient-to-r from-primary-light to-white">
                <div class="text-3xl font-extrabold text-primary mb-2">${formatPrice(event.prix)}</div>
                <div class="flex items-center gap-2 text-gray-600">
                  <span class="font-medium">
                    ${event.places_disponibles} place${event.places_disponibles > 1 ? 's' : ''} restante${event.places_disponibles > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              
              <div class="p-6">
                <div class="mb-6">
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre de places</label>
                  <div class="flex items-center gap-3">
                    <button class="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xl transition-all" onclick="updateTicketCount(-1)">-</button>
                    <input type="number" id="ticketCount" value="1" min="1" max="${event.places_disponibles}" class="w-20 text-center text-xl font-semibold border-2 border-gray-100 rounded-xl py-2 focus:outline-none focus:border-primary" readonly>
                    <button class="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xl transition-all" onclick="updateTicketCount(1)">+</button>
                  </div>
                </div>
                
                <button class="btn btn-primary btn-full btn-lg" onclick="startReservation('${event._id}')">
                  Réserver maintenant
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function updateTicketCount(delta) {
  const input = document.getElementById('ticketCount');
  let count = parseInt(input.value) + delta;
  count = Math.max(1, Math.min(count, parseInt(input.max)));
  input.value = count;
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
    <div class="py-12">
      <div class="container max-w-4xl">
        <!-- Back button -->
        <button class="flex items-center gap-2 text-gray-600 hover:text-primary mb-8 transition-colors" onclick="navigateTo('events')">
          <span class="text-2xl">←</span>
          <span class="font-semibold">Retour à l'événement</span>
        </button>
        
        <!-- Timer banner -->
        <div class="bg-gradient-to-r from-yellow-100 via-yellow-50 to-yellow-100 border border-yellow-200 rounded-2xl p-6 mb-10 flex items-center gap-5">
          <div class="w-16 h-16 bg-yellow-300 rounded-full flex items-center justify-center"></div>
          <div class="flex-1">
            <h2 class="font-bold text-2xl text-yellow-800 mb-2">Votre réservation est en attente !</h2>
            <p class="text-yellow-700">
              Vous avez <span id="reservationTimer" class="font-extrabold text-3xl text-red-600 mx-1">10:00</span> pour confirmer votre paiement avant que vos places ne soient libérées.
            </p>
          </div>
        </div>
        
        <!-- Two-column layout -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Left: User info (2/3 on desktop) -->
          <div class="lg:col-span-2">
            <div class="bg-white rounded-2xl shadow-xl p-8">
              <div class="flex items-center gap-3 mb-7 pb-5 border-b border-gray-100">
                <div class="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center"></div>
                <h3 class="text-xl font-bold text-gray-800">Vos informations</h3>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div class="bg-gray-50 rounded-xl p-5">
                  <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Nom complet</label>
                  <div class="font-semibold text-gray-800 text-lg">${currentUser.prenom} ${currentUser.nom}</div>
                </div>
                <div class="bg-gray-50 rounded-xl p-5">
                  <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Téléphone</label>
                  <div class="font-semibold text-gray-800 text-lg">${currentUser.telephone}</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Right: Order summary (1/3 on desktop) -->
          <div class="lg:col-span-1">
            <div class="bg-white rounded-2xl shadow-xl overflow-hidden sticky top-24">
              <!-- Event banner -->
              <div class="h-40 bg-cover bg-center" style="background-image: url('${event.image}')"></div>
              
              <div class="p-7">
                <h4 class="font-bold text-xl text-gray-800 mb-2">${event.titre}</h4>
                <div class="flex items-center gap-2 text-gray-500 mb-1">
                  <span class="text-sm">${event.lieu}</span>
                </div>
                <div class="flex items-center gap-2 text-gray-500 mb-6">
                  <span class="text-sm">${formatDate(event.date)}</span>
                </div>
                
                <!-- Details list -->
                <div class="space-y-3 mb-6">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Nombre de places</span>
                    <span class="font-semibold text-gray-800">${ticketCount}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Prix par place</span>
                    <span class="font-semibold text-gray-800">${formatPrice(event.prix)}</span>
                  </div>
                </div>
                
                <!-- Divider -->
                <div class="border-t border-gray-200 mb-6"></div>
                
                <!-- Total -->
                <div class="flex justify-between items-center mb-7 p-4 bg-gradient-to-r from-primary-light to-white rounded-xl">
                  <span class="font-bold text-xl text-gray-800">Total</span>
                  <span class="text-3xl font-extrabold text-primary">${formatPrice(totalPrice)}</span>
                </div>
                
                <!-- Pay button -->
                <button class="btn btn-primary btn-full btn-lg text-lg py-5 flex items-center justify-center gap-2" onclick="confirmPayment('${event._id}', ${ticketCount}, ${totalPrice})">
                  Confirmer et payer
                </button>
              </div>
            </div>
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
