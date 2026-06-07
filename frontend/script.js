const API_URL = 'http://localhost:5000/api';
let currentUser = null;
let allEvents = [];
let myReservations = [];

// ==================== TOAST NOTIFICATIONS ====================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    toast.innerHTML = `${icons[type]} ${message}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => container.removeChild(toast), 300);
    }, 4000);
}

// ==================== USER MANAGEMENT ====================
function loadCurrentUser() {
    const storedUser = localStorage.getItem('billetterieUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        updateUserUI();
    }
}

function updateUserUI() {
    const profileDiv = document.getElementById('userProfile');
    const loginBtn = document.getElementById('loginBtn');

    if (currentUser) {
        profileDiv.style.display = 'flex';
        loginBtn.style.display = 'none';
        document.getElementById('userName').textContent = `${currentUser.prenom} ${currentUser.nom}`;
    } else {
        profileDiv.style.display = 'none';
        loginBtn.style.display = 'block';
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('billetterieUser');
    updateUserUI();
    myReservations = [];
    renderReservations();
    showToast('Vous êtes déconnecté !', 'info');
}

function openUserModal() {
    switchAuthTab('register');
    document.getElementById('userModal').classList.add('active');
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('active');
}

function switchAuthTab(tab) {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const authTabs = document.querySelectorAll('.auth-tab');

    authTabs.forEach(t => t.classList.remove('active'));

    if (tab === 'register') {
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';
        authTabs[0].classList.add('active');
    } else {
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        authTabs[1].classList.add('active');
    }
}

async function registerUser() {
    const prenom = document.getElementById('regPrenom').value.trim();
    const nom = document.getElementById('regNom').value.trim();
    const telephone = document.getElementById('regTelephone').value.trim();
    const ville = document.getElementById('regVille').value;

    if (!prenom || !nom || !telephone) {
        showToast('Veuillez remplir tous les champs obligatoires !', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/utilisateurs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prenom, nom, telephone, ville })
        });
        const data = await response.json();

        if (response.ok) {
            currentUser = data.utilisateur;
            localStorage.setItem('billetterieUser', JSON.stringify(currentUser));
            updateUserUI();
            closeUserModal();
            showToast(data.message, 'success');
            fetchMyReservations();
        } else {
            showToast(data.message || 'Erreur d\'enregistrement', 'error');
        }
    } catch (error) {
        console.error(error);
        showToast('Erreur réseau !', 'error');
    }
}

async function loginUser() {
    const telephone = document.getElementById('loginTelephone').value.trim();

    if (!telephone) {
        showToast('Veuillez entrer votre numéro de téléphone !', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/utilisateurs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telephone })
        });
        const data = await response.json();

        if (response.ok) {
            currentUser = data.utilisateur;
            localStorage.setItem('billetterieUser', JSON.stringify(currentUser));
            updateUserUI();
            closeUserModal();
            showToast(data.message, 'success');
            fetchMyReservations();
        } else {
            showToast(data.message || 'Erreur de connexion', 'error');
        }
    } catch (error) {
        console.error(error);
        showToast('Erreur réseau !', 'error');
    }
}

async function fetchMyReservations() {
    if (!currentUser) return;
    try {
        const response = await fetch(`${API_URL}/reservations/utilisateur/${currentUser._id}`);
        if (response.ok) {
            myReservations = await response.json();
            renderReservations();
        }
    } catch (e) {
        console.error(e);
    }
}

// ==================== TABS & NAVIGATION ====================
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
    if (tabId === 'dashboard') fetchStats();
    if (tabId === 'reservations') fetchMyReservations();
}

// ==================== EVENTS ====================
async function fetchEvents() {
    try {
        const response = await fetch(`${API_URL}/evenements`);
        const data = await response.json();
        allEvents = data.evenements || [];
        const lieux = [...new Set(allEvents.map(e => e.lieu))];
        const lieuFilter = document.getElementById('lieuFilter');
        lieuFilter.innerHTML = '<option value="">Tous les lieux</option>';
        lieux.forEach(lieu => {
            lieuFilter.innerHTML += `<option value="${lieu}">${lieu}</option>`;
        });
        renderEvents(allEvents);
    } catch (error) {
        console.error("Erreur chargement événements:", error);
        showToast("Erreur lors du chargement des événements", "error");
    }
}

function renderEvents(events) {
    const grid = document.getElementById('eventsGrid');
    if (events.length === 0) {
        grid.innerHTML = '<p class="loading">Aucun événement trouvé</p>';
        return;
    }
    grid.innerHTML = '';
    events.forEach(event => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        const isPassed = eventDate < today;
        const isLow = event.places_disponibles < 10;
        const isFull = event.places_disponibles === 0;

        const card = document.createElement('div');
        card.className = `event-card${isPassed ? ' passed' : ''}`;
        card.innerHTML = `
            <img src="${event.image || 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80'}" alt="${event.titre}" class="card-image">
            <div class="card-body">
                <h3 class="card-title">${event.titre}</h3>
                <div class="card-price">${event.prix.toLocaleString('fr-FR')} FCFA</div>
                <div class="card-details">
                    📅 ${new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}<br>
                    📍 ${event.lieu}
                </div>
                <div class="card-capacity${isLow ? ' low' : ''}">
                    🎟️ ${event.places_disponibles} / ${event.capacite_totale} places restantes
                </div>
                <button class="btn btn-primary btn-full" onclick="openBookingModal('${event._id}', '${event.titre.replace(/'/g, "\\'")}')" ${isFull || isPassed ? 'disabled' : ''}>
                    ${isPassed ? 'Événement passé' : isFull ? 'Complet' : 'Réserver'}
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function filterEvents() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const lieu = document.getElementById('lieuFilter').value;
    const prixMax = document.getElementById('prixMaxFilter').value;

    let filtered = [...allEvents];
    if (searchTerm) {
        filtered = filtered.filter(e => 
            e.titre.toLowerCase().includes(searchTerm) || 
            (e.description && e.description.toLowerCase().includes(searchTerm))
        );
    }
    if (lieu) filtered = filtered.filter(e => e.lieu === lieu);
    if (prixMax) filtered = filtered.filter(e => e.prix <= parseInt(prixMax));

    renderEvents(filtered);
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('lieuFilter').value = '';
    document.getElementById('prixMaxFilter').value = '';
    renderEvents(allEvents);
    showToast("Filtres réinitialisés", "info");
}

// ==================== BOOKING ====================
function openBookingModal(eventId, eventTitle) {
    if (!currentUser) {
        showToast('Veuillez vous connecter d\'abord !', 'warning');
        openUserModal();
        return;
    } else {
        document.getElementById('modalEventId').value = eventId;
        document.getElementById('modalEventTitle').textContent = eventTitle;
        document.getElementById('ticketsCount').value = 1;
        document.getElementById('bookingModal').classList.add('active');
    }
}

function closeModal() {
    document.getElementById('bookingModal').classList.remove('active');
}

async function submitBooking() {
    if (!currentUser) {
        showToast('Veuillez vous connecter d\'abord !', 'warning');
        return;
    }
    const eventId = document.getElementById('modalEventId').value;
    const ticketsCount = parseInt(document.getElementById('ticketsCount').value);

    try {
        const response = await fetch(`${API_URL}/reservations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                utilisateur_id: currentUser._id,
                evenement_id: eventId,
                nombre_places: ticketsCount
            })
        });

        const data = await response.json();
        if (response.ok) {
            showToast(data.message, 'success');
            closeModal();
            fetchEvents();
            addReservationToList(data.reservation);
        } else {
            showToast("Erreur: " + data.message, 'error');
        }
    } catch (error) {
        showToast("Erreur réseau !", 'error');
    }
}

function addReservationToList(reservation) {
    myReservations.unshift(reservation);
    renderReservations();
}

function renderReservations() {
    const list = document.getElementById('reservationsList');
    if (!currentUser) {
        list.innerHTML = '<p class="loading">Connectez-vous pour voir vos réservations</p>';
        return;
    }
    if (myReservations.length === 0) {
        list.innerHTML = '<p class="loading">Aucune réservation trouvée</p>';
        return;
    }
    list.innerHTML = '';
    myReservations.forEach(res => {
        const div = document.createElement('div');
        div.className = 'reservation-item';
        div.innerHTML = `
            <div class="reservation-info">
                <h4>Réservation #${res._id.substring(0, 8)}</h4>
                <p>Montant: ${res.montant_total.toLocaleString('fr-FR')} FCFA • Places: ${res.nombre_places}</p>
            </div>
            <div class="reservation-status">
                <span class="res-status ${res.statut}">${res.statut}</span>
                ${res.statut === 'EN_ATTENTE' ? `<button class="btn btn-success" onclick="payReservation('${res._id}')">Payer maintenant</button>` : ''}
            </div>
        `;
        list.appendChild(div);
    });
}

async function payReservation(reservationId) {
    try {
        const response = await fetch(`${API_URL}/reservations/${reservationId}/payer`, {
            method: 'POST'
        });
        const data = await response.json();

        if (response.ok) {
            showToast("Paiement validé ! Vos billets ont été générés !", 'success');
            const index = myReservations.findIndex(r => r._id === reservationId);
            if (index !== -1) myReservations[index].statut = 'CONFIRMEE';
            renderReservations();
            fetchStats();
        } else {
            showToast("Erreur: " + data.message, 'error');
        }
    } catch (error) {
        showToast("Erreur lors du paiement !", 'error');
    }
}

// ==================== STATS ====================
async function fetchStats() {
    try {
        const response = await fetch(`${API_URL}/evenements/stats/recettes`);
        const stats = await response.json();
        const grid = document.getElementById('statsGrid');
        grid.innerHTML = '';
        stats.forEach(stat => {
            const card = document.createElement('div');
            card.className = 'stat-card';
            card.innerHTML = `
                <h3>${stat.titre}</h3>
                <div class="stat-amount">${stat.recettes_FCFA.toLocaleString('fr-FR')} FCFA</div>
                <p>Billets vendus: ${stat.billets_vendus}</p>
            `;
            grid.appendChild(card);
        });
    } catch (error) {
        console.error("Erreur chargement stats:", error);
        showToast("Erreur lors du chargement des statistiques", "error");
    }
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    loadCurrentUser();
    fetchEvents();
    fetchStats();
    if (currentUser) {
        fetchMyReservations();
    }
});
