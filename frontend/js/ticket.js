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
  
  const filteredReservations = reservations.filter(r => r.statut === 'PAYEE' || r.statut === 'CONFIRMEE');
  
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
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${filteredReservations.map(renderMyTicket).join('')}
      </div>
    </div>
  `;
  
  // Générer les QR codes après le rendu
  generateMyTicketsQRCodes(filteredReservations);
}

function renderMyTicket(reservation) {
  const event = window.allEvents.find(e => e._id === reservation.evenement_id);
  if (!event) return '';
  const code = `EP-${reservation._id.substring(0, 8).toUpperCase()}`;
  
  return `
    <div class="card" id="ticket-${reservation._id}">
      <div class="event-card-image" style="background-image: url('${event.image}')"></div>
      <div class="p-6">
        <h3 class="text-xl font-semibold mb-2">${event.titre}</h3>
        <p class="text-secondary mb-2">📍 ${event.lieu}</p>
        <p class="text-secondary mb-4">📅 ${formatDate(event.date)}</p>
        <div class="flex justify-between items-center mb-4">
          <span class="text-sm text-success font-semibold">✅ Confirmé</span>
          <span class="text-sm font-semibold">${reservation.nombre_places} place(s)</span>
        </div>
        <div class="text-center mb-4">
          <div id="qrcode-${reservation._id}" class="inline-block"></div>
        </div>
        <p class="text-center text-sm text-secondary font-semibold mb-4">Code : ${code}</p>
        <button class="btn btn-primary btn-full btn-sm" onclick="downloadTicket('${code}')">📥 Télécharger</button>
      </div>
    </div>
  `;
}

// Après avoir rendu les billets, générer les QR codes
function generateMyTicketsQRCodes(reservations) {
  setTimeout(() => {
    reservations.forEach(r => {
      if (r.statut === 'PAYEE') {
        const container = document.getElementById(`qrcode-${r._id}`);
        if (container) {
          container.innerHTML = '';
          const code = `EP-${r._id.substring(0, 8).toUpperCase()}`;
          new QRCode(container, {
            text: code, width: 120, height: 120, colorDark:'#1e3a8a', colorLight:'#ffffff', correctLevel:QRCode.CorrectLevel.H
          });
        }
      }
    });
  }, 200);
}

function downloadTicket(code) {
  showToast('Téléchargement du PDF en cours...', 'info');
  setTimeout(() => { showToast('PDF téléchargé !', 'success'); },1500);
}
