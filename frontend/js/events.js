/* ========================================
   EVENTS PAGE & DETAILS
   ======================================== */
let filteredEvents = [];
let selectedEvent = null;
let activeCategory = 'Toutes';

const CATEGORIES = [
  'Toutes', 'Concert', 'Culture', 'Formation', 'Soirée', 
  'Tourisme', 'Sport', 'Festival', 'Business', 'Autre'
];

function createEventCard(event) {
  const imgUrl = event.image || 'https://images.unsplash.com/photo-1506157786151-b8491531f565?auto=format&fit=crop&w=800&q=80';
  
  return `
    <div class="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer" onclick="navigateToEvent('${event._id}')">
      <div class="w-full h-48 bg-cover bg-center relative" style="background-image: url('${imgUrl}')">
        <div class="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-gray-700">
          ${event.categorie || 'Événement'}
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
          
          <button class="bg-primary text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-primary-dark transition-all">
            Réserver
          </button>
        </div>
      </div>
    </div>
  `;
}

async function loadEventsPage() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="min-h-screen bg-gray-50">
      <div class="container py-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-8">Tous les événements</h1>
        
        <!-- Category Tabs -->
        <div class="flex flex-wrap gap-3 mb-8">
          ${CATEGORIES.map(cat => `
            <button 
              class="category-tab px-5 py-2 rounded-full font-semibold transition-all ${cat === 'Toutes' ? 'bg-primary text-white' : 'bg-white text-gray-700 border border-gray-200 hover:border-primary hover:text-primary'}"
              data-category="${cat}"
              onclick="selectCategory('${cat}')"
            >
              ${cat}
            </button>
          `).join('')}
        </div>
        
        <!-- Events Grid -->
        <div id="eventsList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
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

function selectCategory(category) {
  activeCategory = category;
  
  // Update tab styles
  document.querySelectorAll('.category-tab').forEach(tab => {
    if (tab.dataset.category === category) {
      tab.classList.remove('bg-white', 'text-gray-700', 'border', 'border-gray-200');
      tab.classList.add('bg-primary', 'text-white');
    } else {
      tab.classList.remove('bg-primary', 'text-white');
      tab.classList.add('bg-white', 'text-gray-700', 'border', 'border-gray-200');
    }
  });
  
  // Filter events
  let filtered = filteredEvents;
  if (category !== 'Toutes') {
    filtered = filteredEvents.filter(e => e.categorie === category);
  }
  
  renderEventsList(filtered);
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
    <div class="py-12">
      <div class="container">
        <!-- Back button -->
        <button class="flex items-center gap-2 text-gray-600 hover:text-primary mb-8 transition-colors" onclick="navigateTo('events')">
          <span class="text-2xl">←</span>
          <span class="font-semibold">Retour aux événements</span>
        </button>
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <!-- Left Column: Image & Description -->
          <div class="lg:col-span-2">
            <div class="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              <div class="h-[400px] bg-cover bg-center" style="background-image: url('${imgUrl}')"></div>
              <div class="p-8 md:p-12">
                <div class="flex flex-wrap gap-4 mb-6">
                  <span class="bg-primary-light text-primary px-4 py-1 rounded-full text-sm font-bold">${formatDate(event.date)}</span>
                  <span class="bg-gray-100 text-gray-600 px-4 py-1 rounded-full text-sm font-bold">${event.lieu}</span>
                </div>
                <h1 class="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">${event.titre}</h1>
                <div class="prose max-w-none">
                  <h3 class="text-xl font-bold text-gray-800 mb-4">À propos de cet événement</h3>
                  <p class="text-gray-600 leading-relaxed text-lg">${event.description || 'Rejoignez-nous pour un événement inoubliable rempli de moments exceptionnels !'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Right Column: Booking Card -->
          <div class="lg:col-span-1">
            <div class="bg-white rounded-3xl shadow-2xl p-8 sticky top-24 border-2 border-primary-light">
              <div class="mb-8 text-center">
                <div class="text-gray-500 font-bold uppercase tracking-wider text-sm mb-2">Prix du billet</div>
                <div class="text-5xl font-black text-primary mb-4">${formatPrice(event.prix)}</div>
                <div class="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full text-sm font-bold">
                  <span>🔥</span> ${event.places_disponibles} places restantes
                </div>
              </div>
              
              <div class="space-y-6">
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Nombre de places</label>
                  <div class="flex items-center justify-between bg-gray-50 rounded-2xl p-2 border-2 border-gray-100">
                    <button class="w-12 h-12 rounded-xl bg-white shadow-sm hover:bg-gray-100 text-gray-800 font-bold text-xl transition-all" onclick="updateTicketCount(-1)">-</button>
                    <input type="number" id="ticketCount" value="1" min="1" max="${event.places_disponibles}" class="bg-transparent w-16 text-center text-2xl font-black text-gray-800 focus:outline-none" readonly>
                    <button class="w-12 h-12 rounded-xl bg-white shadow-sm hover:bg-gray-100 text-gray-800 font-bold text-xl transition-all" onclick="updateTicketCount(1)">+</button>
                  </div>
                </div>
                
                <div class="pt-4">
                  <button class="btn btn-primary btn-full btn-lg btn-reserve-now py-5 text-xl shadow-2xl" onclick="startReservation('${event._id}')">
                    Réserver maintenant
                  </button>
                  <p class="text-center text-gray-400 text-xs mt-4 font-medium">Paiement sécurisé • Confirmation instantanée</p>
                </div>
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

  const btn = document.querySelector('.btn-reserve-now');
  if (btn) btn.classList.add('btn-loading');

  // Petit délai pour l'effet visuel magnifique
  setTimeout(() => {
    selectedEvent = window.allEvents.find(e => e._id === eventId);
    const ticketCount = parseInt(document.getElementById('ticketCount').value,10);
    loadReservationPage(selectedEvent, ticketCount);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 600);
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
                <button class="btn btn-primary btn-full btn-lg text-lg py-5 flex items-center justify-center gap-2 btn-reserve-now" onclick="confirmPayment('${event._id}', ${ticketCount}, ${totalPrice})">
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
  const btn = document.querySelector('.btn-reserve-now');
  if (btn) btn.classList.add('btn-loading');

  try {
    const reservationData = {
      utilisateur_id: currentUser._id, evenement_id: eventId, nombre_places: ticketCount
    };
    const result = await window.api.createReservation(reservationData);
    const reservation = result.reservation;
    await window.api.payReservation(reservation._id);
    
    // Animation de succès magnifique
    showToast('🎉 Paiement réussi ! Préparation de vos billets...', 'success');
    
    setTimeout(() => {
      navigateTo('myTickets');
    }, 1000);
  } catch(e) {
    if (btn) btn.classList.remove('btn-loading');
    showToast(e.message || 'Erreur de paiement', 'error');
  }
}
