/* ========================================
   ADMIN DASHBOARD
   ======================================== */
async function loadAdminPage() {
  const main = document.getElementById('mainContent');
  const totalRevenue = 3500;
  const totalEvents = allEvents.length;
  const totalReservations = 52;
  const totalTickets = 112;

  main.innerHTML = `
    <div class="admin-wrapper">
      <div class="container">
        <div class="flex justify-between items-center mb-8">
          <h1 class="text-3xl font-semibold">Tableau de bord</h1>
          <button class="btn btn-primary" onclick="navigateTo('home')">Retour au site</button>
        </div>

        <div class="grid grid-cols-4 gap-6 mb-12">
          <div class="stats-card">
            <div class="stats-icon">🎟️</div>
            <div class="stats-value">${totalTickets}</div>
            <div class="stats-label">Billets vendus</div>
          </div>
          <div class="stats-card">
            <div class="stats-icon">📅</div>
            <div class="stats-value">${totalEvents}</div>
            <div class="stats-label">Événements</div>
          </div>
          <div class="stats-card">
            <div class="stats-icon">👥</div>
            <div class="stats-value">${totalReservations}</div>
            <div class="stats-label">Réservations</div>
          </div>
          <div class="stats-card">
            <div class="stats-icon">💰</div>
            <div class="stats-value">${formatPrice(totalRevenue)}</div>
            <div class="stats-label">Chiffre d'affaires</div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-lg p-8">
          <h2 class="text-xl font-semibold mb-6">Derniers événements</h2>
          <table class="admin-table">
            <thead>
              <tr>
                <th>Événement</th>
                <th>Lieu</th>
                <th>Date</th>
                <th>Places restantes</th>
                <th>Prix</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              ${allEvents.map(ev => `
                <tr>
                  <td class="font-semibold">${ev.titre}</td>
                  <td>${ev.lieu}</td>
                  <td>${formatDate(ev.date)}</td>
                  <td>${ev.capacite}</td>
                  <td>${formatPrice(ev.prix)}</td>
                  <td>
                    <span class="badge-popular" style="padding:0.375rem 0.75rem;border-radius:999px;font-size:0.75rem;color:white;">
                      ${isEventPast(ev.date) ? 'Terminé' : 'À venir'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}
