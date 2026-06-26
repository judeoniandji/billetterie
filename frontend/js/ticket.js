/* ========================================
   TICKET PAGE & MY TICKETS
   ======================================== */
async function loadMyTicketsPage() {
  if (!currentUser) {
    navigateTo('home');
    return;
  }

  try {
    const reservations = await window.api.getReservationsByUser(currentUser._id);
    renderMyTickets(reservations);
  } catch (e) {
    console.error("Erreur de chargement des billets :", e);
    showToast('Erreur de chargement de vos billets', 'error');
    renderMyTickets([]);
  }
}

function renderMyTickets(reservations) {
  const main = document.getElementById('mainContent');
  
  const filteredReservations = reservations.filter(r => r.statut === 'PAYEE' || r.statut === 'CONFIRMEE');
  
  if (filteredReservations.length === 0) {
    main.innerHTML = `
      <div class="py-20 text-center">
        <h2 class="text-3xl font-bold mb-3">Vous n'avez pas de billet</h2>
        <p class="text-gray-500 mb-8 text-lg">Découvrez nos événements et réservez votre première place !</p>
        <button class="btn btn-primary btn-lg" onclick="navigateTo('events')">Voir les événements</button>
      </div>
    `;
    return;
  }
  
  main.innerHTML = `
    <div class="container py-16">
      <div class="flex items-center gap-3 mb-10">
        <h1 class="text-4xl font-extrabold">Mes billets</h1>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        ${filteredReservations.map(renderMyTicket).join('')}
      </div>
    </div>
  `;
  
  // Générer les QR codes après le rendu
  generateMyTicketsQRCodes(filteredReservations);
}

function renderMyTicket(reservation) {
  // Handle both embedded event and ref
  let event;
  if (reservation.evenement_id && typeof reservation.evenement_id === 'object') {
    event = reservation.evenement_id;
  } else if (window.allEvents && Array.isArray(window.allEvents)) {
    event = window.allEvents.find(e => e._id === reservation.evenement_id);
  }
  
  // Fallback si l'événement n'est pas encore chargé ou introuvable
  if (!event) {
    event = {
      titre: "Événement " + (reservation.evenement_id || "en cours..."),
      lieu: "Lieu non disponible",
      date: reservation.date_creation || new Date(),
      prix: reservation.montant_total / (reservation.nombre_places || 1)
    };
  }
  
  const code = `EP-${reservation._id.substring(0, 8).toUpperCase()}`;
  
  return `
    <div class="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:-translate-y-2 transition-all duration-300">
      <!-- Ticket top gradient -->
      <div class="h-3 bg-gradient-to-r from-[#1e3a8a] via-[#10b981] to-[#1e3a8a]"></div>
      
      <div class="p-7">
        <div class="flex justify-between items-start mb-6">
          <div>
            <h3 class="text-2xl font-bold text-gray-800 mb-2">${event.titre}</h3>
            <div class="flex items-center gap-2 text-gray-500">
              <span class="text-lg">${event.lieu}</span>
            </div>
          </div>
          <span class="bg-green-100 text-green-700 px-4 py-1 rounded-full font-semibold text-sm">Confirmé</span>
        </div>
        
        <div class="flex items-center gap-6 mb-6 pb-6 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div>
              <div class="text-sm text-gray-500">Date</div>
              <div class="font-semibold text-gray-800">${formatDate(event.date)}</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div>
              <div class="text-sm text-gray-500">Places</div>
              <div class="font-semibold text-gray-800">${reservation.nombre_places}</div>
            </div>
          </div>
        </div>
        
        <div class="flex items-center justify-between gap-6">
          <div class="bg-gray-50 rounded-xl p-3">
            <div id="qrcode-${reservation._id}"></div>
          </div>
          <div class="text-right flex-1">
            <div class="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Code billet</div>
            <div class="text-2xl font-extrabold text-[#1e3a8a]">${code}</div>
          </div>
        </div>
        
        <div class="mt-6">
          <button class="btn btn-primary btn-full" onclick="downloadTicket('${code}')">Télécharger</button>
        </div>
      </div>
    </div>
  `;
}

// Après avoir rendu les billets, générer les QR codes
function generateMyTicketsQRCodes(reservations) {
  if (typeof QRCode === 'undefined') {
    console.warn("La bibliothèque QRCode.js n'est pas disponible.");
    return;
  }
  setTimeout(() => {
    reservations.forEach(r => {
      if (r.statut === 'PAYEE' || r.statut === 'CONFIRMEE') {
        const container = document.getElementById(`qrcode-${r._id}`);
        if (container) {
          container.innerHTML = '';
          const code = `EP-${r._id.substring(0, 8).toUpperCase()}`;
          try {
            new QRCode(container, {
              text: code, width: 100, height: 100, colorDark:'#1e3a8a', colorLight:'#ffffff', correctLevel:QRCode.CorrectLevel.H
            });
          } catch (err) {
            console.error("Erreur lors de la génération du QR code :", err);
          }
        }
      }
    });
  }, 200);
}

function downloadTicket(code) {
  showToast('Téléchargement du PDF en cours...', 'info');
  setTimeout(() => { showToast('PDF téléchargé !', 'success'); }, 1500);
}
