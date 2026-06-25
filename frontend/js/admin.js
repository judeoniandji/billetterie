/* ========================================
   ADMIN DASHBOARD - FULL CRUD
   ======================================== */
let editingEventId = null;
let adminStats = {
  totalRevenue: 0,
  totalEvents: 0,
  totalReservations: 0,
  totalTickets: 0
};

async function loadAdminPage() {
  const main = document.getElementById('mainContent');
  
  // Protection : vérifier connexion et rôle admin
  if (!currentUser) {
    isAdminLogin = true;
    main.innerHTML = `
      <div class="py-20 text-center">
        <h1 class="text-4xl font-semibold mb-6">Administration EventPass</h1>
        <p class="text-secondary mb-10">Veuillez vous connecter pour accéder au tableau de bord</p>
        <button class="btn btn-primary btn-lg" onclick="switchAuthTab('login'); openModal('authModal');">
          Se connecter
        </button>
      </div>
    `;
    return;
  } else {
    isAdminLogin = false;
  }
  
  if (currentUser.role !== 'admin') {
    showToast('Accès refusé : vous n\'êtes pas administrateur', 'error');
    navigateTo('home');
    return;
  }
  
  // Charger les stats depuis l'API
  try {
    const recettes = await apiRequest('/api/evenements/stats/recettes');
    adminStats.totalRevenue = recettes.reduce((sum, r) => sum + r.recettes_FCFA, 0);
    adminStats.totalEvents = allEvents.length;
    adminStats.totalTickets = recettes.reduce((sum, r) => sum + r.billets_vendus, 0);
  } catch(e) {
    console.log('Erreur stats', e);
  }

  main.innerHTML = `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="container">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 class="text-3xl font-bold text-gray-800">Tableau de bord</h1>
            <p class="text-gray-500 mt-1">Gestion complète de EventPass</p>
          </div>
          <div class="flex gap-3">
            <button class="btn btn-primary" onclick="openAddEventModal()">Nouvel événement</button>
            <button class="btn btn-outline" onclick="navigateTo('home')">Retour au site</button>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-4 gap-6 mb-12">
          <div class="stats-card">
            <div class="stats-icon"></div>
            <div class="stats-value">${adminStats.totalTickets}</div>
            <div class="stats-label">Billets vendus</div>
          </div>
          <div class="stats-card">
            <div class="stats-icon"></div>
            <div class="stats-value">${adminStats.totalEvents}</div>
            <div class="stats-label">Événements</div>
          </div>
          <div class="stats-card">
            <div class="stats-icon"></div>
            <div class="stats-value">${adminStats.totalReservations}</div>
            <div class="stats-label">Réservations</div>
          </div>
          <div class="stats-card">
            <div class="stats-icon"></div>
            <div class="stats-value">${formatPrice(adminStats.totalRevenue)}</div>
            <div class="stats-label">Chiffre d'affaires</div>
          </div>
        </div>

        <!-- Events Table -->
        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
          <div class="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 class="text-xl font-semibold">Gestion des événements</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Événement</th>
                  <th>Lieu</th>
                  <th>Date</th>
                  <th>Places</th>
                  <th>Prix</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="admin-events-tbody">
                ${allEvents.map(ev => `
                  <tr>
                    <td>
                      <img src="${ev.image}" alt="${ev.titre}" class="admin-event-thumbnail">
                    </td>
                    <td class="font-semibold">${ev.titre}</td>
                    <td>${ev.lieu}</td>
                    <td>${formatDate(ev.date)}</td>
                    <td>
                      <span class="${ev.places_disponibles < 10 ? 'text-error font-semibold' : ''}">
                        ${ev.places_disponibles} / ${ev.capacite_totale}
                      </span>
                    </td>
                    <td class="font-semibold">${formatPrice(ev.prix)}</td>
                    <td>
                      <span class="badge-${isEventPast(ev.date) ? 'limited' : 'popular'}" style="padding:0.375rem 0.75rem;border-radius:999px;font-size:0.75rem;color:white;">
                        ${isEventPast(ev.date) ? 'Terminé' : 'À venir'}
                      </span>
                    </td>
                    <td>
                      <div class="flex gap-2">
                        <button class="btn btn-outline btn-sm" onclick="openEditEventModal('${ev._id}')">Modifier</button>
                        <button class="btn" onclick="deleteEvent('${ev._id}')">Supprimer</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Add/Edit Event -->
    <div id="event-modal-overlay" class="modal-overlay hidden">
      <div class="modal" style="max-width: 700px;">
        <div class="modal-header flex justify-between items-center">
          <h3 id="event-modal-title">Ajouter un événement</h3>
          <button class="modal-close" onclick="closeEventModal()">×</button>
        </div>
        <div class="modal-body">
          <form id="event-form" class="grid grid-cols-2 gap-6">
            <div class="input-group">
              <label>Titre *</label>
              <input type="text" id="event-titre" class="input" required>
            </div>
            <div class="input-group">
              <label>Lieu *</label>
              <input type="text" id="event-lieu" class="input" required>
            </div>
            <div class="input-group">
              <label>Date *</label>
              <input type="datetime-local" id="event-date" class="input" required>
            </div>
            <div class="input-group">
              <label>Prix (FCFA) *</label>
              <input type="number" id="event-prix" class="input" required min="0">
            </div>
            <div class="input-group">
              <label>Capacité totale *</label>
              <input type="number" id="event-capacite" class="input" required min="1">
            </div>
            <div class="input-group">
              <label>Image URL</label>
              <input type="url" id="event-image" class="input" placeholder="https://...">
            </div>
            <div class="input-group col-span-2">
              <label>Description</label>
              <textarea id="event-description" class="input" rows="4"></textarea>
            </div>
            <div class="col-span-2">
              <button type="submit" class="btn btn-primary btn-full">Enregistrer</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  // Ajouter le listener du formulaire
  document.getElementById('event-form').addEventListener('submit', handleSaveEvent);
}

function openAddEventModal() {
  editingEventId = null;
  document.getElementById('event-modal-title').textContent = 'Ajouter un événement';
  document.getElementById('event-form').reset();
  document.getElementById('event-modal-overlay').classList.remove('hidden');
}

function openEditEventModal(eventId) {
  const ev = allEvents.find(e => e._id === eventId);
  if (!ev) return;

  editingEventId = eventId;
  document.getElementById('event-modal-title').textContent = 'Modifier l\'événement';
  
  // Pré-remplir le formulaire
  document.getElementById('event-titre').value = ev.titre;
  document.getElementById('event-lieu').value = ev.lieu;
  
  const date = new Date(ev.date);
  const dateStr = date.toISOString().slice(0, 16);
  document.getElementById('event-date').value = dateStr;
  
  document.getElementById('event-prix').value = ev.prix;
  document.getElementById('event-capacite').value = ev.capacite_totale;
  document.getElementById('event-image').value = ev.image || '';
  document.getElementById('event-description').value = ev.description || '';
  
  document.getElementById('event-modal-overlay').classList.remove('hidden');
}

function closeEventModal() {
  document.getElementById('event-modal-overlay').classList.add('hidden');
  editingEventId = null;
}

async function handleSaveEvent(e) {
  e.preventDefault();
  
  const eventData = {
    titre: document.getElementById('event-titre').value,
    lieu: document.getElementById('event-lieu').value,
    date: new Date(document.getElementById('event-date').value),
    prix: Number(document.getElementById('event-prix').value),
    capacite_totale: Number(document.getElementById('event-capacite').value),
    places_disponibles: Number(document.getElementById('event-capacite').value),
    image: document.getElementById('event-image').value || "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80",
    description: document.getElementById('event-description').value
  };

  try {
    if (editingEventId) {
      // Mise à jour
      await apiRequest(`/api/evenements/${editingEventId}`, {
        method: 'PUT',
        body: JSON.stringify(eventData)
      });
      showToast('Événement mis à jour avec succès !', 'success');
    } else {
      // Création
      await apiRequest('/api/evenements', {
        method: 'POST',
        body: JSON.stringify(eventData)
      });
      showToast('Événement créé avec succès !', 'success');
    }
    
    closeEventModal();
    // Recharger la liste des événements
    const data = await window.api.getEvents();
    if (data.evenements) { allEvents = data.evenements; } 
    else if (Array.isArray(data)) { allEvents = data; }
    window.allEvents = allEvents;
    loadAdminPage();
  } catch (error) {
    console.error(error);
    showToast('Erreur lors de la sauvegarde', 'error');
  }
}

async function deleteEvent(eventId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;
  
  try {
    await apiRequest(`/api/evenements/${eventId}`, { method: 'DELETE' });
    showToast('Événement supprimé avec succès !', 'success');
    
    // Recharger la liste
    const data = await window.api.getEvents();
    if (data.evenements) { allEvents = data.evenements; } 
    else if (Array.isArray(data)) { allEvents = data; }
    window.allEvents = allEvents;
    loadAdminPage();
  } catch (e) {
    console.error(e);
    showToast('Erreur lors de la suppression', 'error');
  }
}
