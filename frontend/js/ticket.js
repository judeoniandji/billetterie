/* ========================================
   TICKET PAGE & MY TICKETS
   ======================================== */
function loadTicketPage(reservation, event, ticketCount) {
  const main = document.getElementById('mainContent');
  const code = `EP-${reservation._id.substring(0, 8).toUpperCase()}`;
  
  main.innerHTML = `
    <div class="ticket-wrapper">
      <div class="container">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-semibold mb-2">🎉 Paiement confirmé !</h1>
          <p class="text-secondary">Votre billet est prêt</p>
        </div>
        
        <div class="ticket">
          <div class="ticket-header">
            <h2 class="ticket-title">${event.titre}</h2>
            <p class="ticket-subtitle">Billet EventPass</p>
          </div>
          
          <div class="ticket-body">
            <div class="ticket-info">
              <h4>Détails de l'événement</h4>
              <div class="ticket-detail">
                <span class="ticket-label">Nom</span>
                <span class="font-semibold">${currentUser.prenom} ${currentUser.nom}</span>
              </div>
              <div class="ticket-detail">
                <span class="ticket-label">Date</span>
                <span class="font-semibold">${formatDate(event.date)}</span>
              </div>
              <div class="ticket-detail">
                <span class="ticket-label">Lieu</span>
                <span class="font-semibold">${event.lieu}</span>
              </div>
              <div class="ticket-detail">
                <span class="ticket-label">Places</span>
                <span class="font-semibold">${ticketCount}</span>
              </div>
              <div class="ticket-detail">
                <span class="ticket-label">Code unique</span>
                <span class="font-semibold text-primary">${code}</span>
              </div>
            </div>
            
            <div class="ticket-qr">
              <div class="ticket-status">✅ Confirmé</div>
              <div id="qrcode"></div>
              <p class="text-sm text-secondary mt-4">Présentez ce QR code à l'entrée</p>
            </div>
          </div>
        </div>
        
        <div class="flex gap-4 justify-center mt-8">
          <button class="btn btn-primary" onclick="downloadTicket('${code}')">Télécharger PDF</button>
          <button class="btn btn-outline" onclick="navigateTo('home')">Retour à l'accueil</button>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    const qrContainer = document.getElementById('qrcode');
    qrContainer.innerHTML = '';
    new QRCode(qrContainer, {
      text: code, width:180, height:180, colorDark:'#1e3a8a', colorLight:'#ffffff', correctLevel:QRCode.CorrectLevel.H
    });
  },100);
}

async function loadMyTicketsPage() {
  if (!currentUser) {
    navigateTo('home');
    return;
  }

  try {
    const reservations = await window.api.getReservationsByUser(currentUser._id);
    renderMyTickets(reservations);
  } catch (e) {
    showToast('Erreur de chargement', 'error');
    renderMyTickets([]);
  }
}

function renderMyTickets(reservations) {
  const main = document.getElementById('mainContent');
  
  const filteredReservations = reservations.filter(r => r.statut === 'PAYEE');
  
  if (filteredReservations.length === 0) {
    main.innerHTML = `
      <div class="py-16 text-center">
        <div class="text-6xl mb-4">🎟️</div>
        <h2 class="text-2xl font-semibold mb-2">Vous n'avez pas de billet</h2>
        <p class="text-secondary mb-6">Découvrez nos événements et réservez votre première place !</p>
        <button class="btn btn-primary btn-lg" onclick="navigateTo('events')">Voir les événements</button>
      </div>
    `;
    return;
  }
  
  main.innerHTML = `
    <div class="container py-12">
      <h1 class="text-3xl font-semibold mb-8">Mes billets</h1>
      <div class="grid grid-cols-3 gap-6">
        ${filteredReservations.map(renderMyTicket).join('')}
      </div>
    </div>
  `;
}

function renderMyTicket(reservation) {
  const event = window.allEvents.find(e => e._id === reservation.evenement_id);
  if (!event) return '';
  
  return `
    <div class="card">
      <div class="event-card-image" style="background: linear-gradient(135deg, var(--primary-light), white)"></div>
      <div class="p-6">
        <h3 class="text-xl font-semibold mb-2">${event.titre}</h3>
        <p class="text-secondary mb-4">📍 ${event.lieu} • ${formatDate(event.date)}</p>
        <div class="flex justify-between items-center">
          <span class="text-sm text-success font-semibold">✅ Confirmé</span>
          <span class="text-sm font-semibold">${reservation.nombre_places} place(s)</span>
        </div>
      </div>
    </div>
  `;
}

function downloadTicket(code) {
  showToast('Téléchargement du PDF en cours...', 'info');
  setTimeout(() => { showToast('PDF téléchargé !', 'success'); },1500);
}
