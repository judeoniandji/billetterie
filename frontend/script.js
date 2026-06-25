/* ============================================
   EVENTIA — SPA Billetterie
   Architecture: Router → Pages → Components
   ============================================ */

const API_URL = `${window.location.protocol}//${window.location.host}/api`;
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80';
const TTL_SECONDS = 600;

// ---- State ----
const state = {
    user: null,
    events: [],
    reservations: [],
    filters: { search: '', lieu: '', prixMax: '', category: '' },
    booking: { event: null, reservation: null },
    countdownInterval: null,
    refreshInterval: null
};

// ============================================
// UTILS
// ============================================
const Utils = {
    formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    },

    formatPrice(price) {
        return `${price.toLocaleString('fr-FR')} FCFA`;
    },

    getCategory(event) {
        const text = `${event.titre} ${event.description || ''} ${event.lieu}`.toLowerCase();
        if (/concert|live|showcase|festival|soirée|musique|dj|ndjoka/.test(text)) return 'concert';
        if (/sport|stade|match|football|basket/.test(text)) return 'sport';
        if (/conférence|conference|forum|séminaire|institut/.test(text)) return 'conference';
        return 'autre';
    },

    categoryLabel(cat) {
        return { concert: 'Concert', sport: 'Sport', conference: 'Conférence', autre: 'Événement' }[cat] || 'Événement';
    },

    isEventPassed(event) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const d = new Date(event.date);
        d.setHours(0, 0, 0, 0);
        return d < today;
    },

    getAvailabilityPercent(event) {
        return Math.round((event.places_disponibles / event.capacite_totale) * 100);
    },

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    showLoading(show) {
        document.getElementById('loadingOverlay').hidden = !show;
    }
};

// ============================================
// TOAST
// ============================================
const Toast = {
    show(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
        toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
};

// ============================================
// AUTH
// ============================================
const Auth = {
    load() {
        const stored = localStorage.getItem('billetterieUser');
        if (stored) state.user = JSON.parse(stored);
        this.updateUI();
    },

    updateUI() {
        const profile = document.getElementById('userProfile');
        const loginBtn = document.getElementById('loginBtn');
        const logoLink = document.getElementById('logoLink');
        const footerAdminLink = document.getElementById('footerAdminLink');
        const isAdmin = !!(state.user && state.user.role === 'admin');

        if (logoLink) {
            logoLink.setAttribute('href', isAdmin ? 'admin.html' : '#/');
        }
        if (footerAdminLink) {
            footerAdminLink.hidden = !isAdmin;
        }

        if (state.user) {
            profile.hidden = false;
            loginBtn.hidden = true;
            document.getElementById('userName').textContent = `${state.user.prenom} ${state.user.nom}`;
            document.getElementById('userAvatar').textContent = state.user.prenom[0].toUpperCase();
        } else {
            profile.hidden = true;
            loginBtn.hidden = false;
        }
    },

    openModal() {
        document.getElementById('authModal').classList.add('active');
        this.switchTab('login');
    },

    closeModal() {
        document.getElementById('authModal').classList.remove('active');
    },

    switchTab(tab) {
        document.querySelectorAll('.auth-tabs__btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.authTab === tab);
        });
        document.getElementById('loginForm').hidden = tab !== 'login';
        document.getElementById('registerForm').hidden = tab !== 'register';
    },

    require() {
        if (!state.user) {
            Toast.show('Connectez-vous pour continuer', 'warning');
            this.openModal();
            return false;
        }
        return true;
    },

    async register(e) {
        e.preventDefault();
        const body = {
            prenom: document.getElementById('regPrenom').value.trim(),
            nom: document.getElementById('regNom').value.trim(),
            telephone: document.getElementById('regTelephone').value.trim(),
            ville: document.getElementById('regVille').value
        };
        try {
            const res = await fetch(`${API_URL}/utilisateurs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (res.ok) {
                state.user = data.utilisateur;
                localStorage.setItem('billetterieUser', JSON.stringify(state.user));
                this.updateUI();
                this.closeModal();
                Toast.show(data.message, 'success');
                await Reservations.fetch();
            } else {
                Toast.show(data.message || 'Erreur', 'error');
            }
        } catch {
            Toast.show('Erreur réseau', 'error');
        }
    },

    async login(e) {
        e.preventDefault();
        const telephone = document.getElementById('loginTelephone').value.trim();
        try {
            const res = await fetch(`${API_URL}/utilisateurs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telephone })
            });
            const data = await res.json();
            if (res.ok) {
                state.user = data.utilisateur;
                localStorage.setItem('billetterieUser', JSON.stringify(state.user));
                this.updateUI();
                this.closeModal();
                Toast.show(data.message, 'success');
                await Reservations.fetch();
            } else {
                Toast.show(data.message || 'Erreur', 'error');
            }
        } catch {
            Toast.show('Erreur réseau', 'error');
        }
    },

    logout() {
        state.user = null;
        state.reservations = [];
        localStorage.removeItem('billetterieUser');
        this.updateUI();
        Toast.show('Déconnexion réussie', 'info');
        Router.navigate('#/');
    }
};

// ============================================
// COMPONENTS
// ============================================
const Components = {
    skeletonCards(count = 6) {
        return `<div class="skeleton-grid">${Array(count).fill('').map(() => `
            <div class="skeleton-card">
                <div class="skeleton skeleton--image"></div>
                <div class="skeleton skeleton--title"></div>
                <div class="skeleton skeleton--text"></div>
                <div class="skeleton skeleton--btn"></div>
            </div>
        `).join('')}</div>`;
    },

    eventCard(event, showBookBtn = true) {
        const cat = Utils.getCategory(event);
        const passed = Utils.isEventPassed(event);
        const isLow = event.places_disponibles < 10 && event.places_disponibles > 0;
        const isFull = event.places_disponibles === 0;
        const pct = Utils.getAvailabilityPercent(event);
        const img = event.image || FALLBACK_IMAGE;

        return `
            <article class="event-card${passed ? ' passed' : ''}" onclick="Router.navigate('#/event/${event._id}')">
                <div class="event-card__image-wrap">
                    <img class="event-card__image" src="${img}" alt="${Utils.escapeHtml(event.titre)}"
                         onerror="this.src='${FALLBACK_IMAGE}'" loading="lazy">
                    <span class="event-card__badge event-card__badge--${cat}">${Utils.categoryLabel(cat)}</span>
                    <span class="event-card__availability${isLow ? ' event-card__availability--low' : ''}">
                        ${isFull ? 'Complet' : `${event.places_disponibles} places`}
                    </span>
                </div>
                <div class="event-card__body">
                    <div class="event-card__date">${Utils.formatDate(event.date)}</div>
                    <h3 class="event-card__title">${Utils.escapeHtml(event.titre)}</h3>
                    <div class="event-card__location">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        ${Utils.escapeHtml(event.lieu)}
                    </div>
                    <div class="event-card__footer">
                        <div class="event-card__price">${Utils.formatPrice(event.prix)} <small>/ place</small></div>
                        ${showBookBtn ? `<button class="btn btn--primary btn--sm"
                            onclick="event.stopPropagation(); Router.navigate('#/booking/${event._id}')"
                            ${isFull || passed ? 'disabled' : ''}>
                            ${passed ? 'Passé' : isFull ? 'Complet' : 'Réserver'}
                        </button>` : ''}
                    </div>
                </div>
            </article>
        `;
    },

    eventsGrid(events) {
        if (!events.length) {
            return `<div class="empty-state">
                <div class="empty-state__icon"></div>
                <h3>Aucun événement trouvé</h3>
                <p>Essayez de modifier vos filtres de recherche.</p>
            </div>`;
        }
        return `<div class="events-grid">${events.map(e => this.eventCard(e)).join('')}</div>`;
    },

    categoryPills(active = '', context = 'events') {
        const cats = [
            { id: '', label: 'Tous' },
            { id: 'concert', label: 'Concerts' },
            { id: 'sport', label: 'Sport' },
            { id: 'conference', label: 'Conférences' }
        ];
        const handler = context === 'home' ? 'Pages.Home.setCategory' : 'Pages.Events.setCategory';
        return `<div class="categories">${cats.map(c => `
            <button class="category-pill${active === c.id ? ' active' : ''}"
                    onclick="${handler}('${c.id}')">
                ${c.label}
            </button>
        `).join('')}</div>`;
    },

    statusBadge(statut) {
        const map = {
            EN_ATTENTE: ['status-badge--pending', 'En attente'],
            CONFIRMEE: ['status-badge--confirmed', 'Confirmée'],
            EXPIREE: ['status-badge--expired', 'Expirée']
        };
        const [cls, label] = map[statut] || ['', statut];
        return `<span class="status-badge ${cls}">${label}</span>`;
    },

    countdownHTML(remaining) {
        if (remaining <= 0) {
            return `<div class="countdown countdown--expired">
                <span class="countdown__icon"></span>
                <div><div class="countdown__time">00:00</div><div class="countdown__label">Réservation expirée</div></div>
            </div>`;
        }
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        const urgent = remaining < 120;
        return `<div class="countdown${urgent ? ' countdown--urgent' : ''}" id="countdown">
            <span class="countdown__icon"></span>
            <div>
                <div class="countdown__time" id="countdownTime">${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}</div>
                <div class="countdown__label">Temps restant pour payer</div>
            </div>
        </div>`;
    }
};

// ============================================
// API — Events
// ============================================
const Events = {
    async fetch() {
        try {
            const res = await fetch(`${API_URL}/evenements?limit=100`);
            const data = await res.json();
            state.events = data.evenements || [];
            return state.events;
        } catch {
            Toast.show('Erreur de chargement des événements', 'error');
            return [];
        }
    },

    getById(id) {
        return state.events.find(e => e._id === id);
    },

    filter() {
        let list = [...state.events];
        const { search, lieu, prixMax, category } = state.filters;

        if (search) {
            const q = search.toLowerCase();
            list = list.filter(e =>
                e.titre.toLowerCase().includes(q) ||
                e.lieu.toLowerCase().includes(q) ||
                (e.description && e.description.toLowerCase().includes(q))
            );
        }
        if (lieu) list = list.filter(e => e.lieu === lieu);
        if (prixMax) list = list.filter(e => e.prix <= parseInt(prixMax));
        if (category) list = list.filter(e => Utils.getCategory(e) === category);

        return list;
    },

    getPopular() {
        return [...state.events]
            .filter(e => !Utils.isEventPassed(e) && e.places_disponibles > 0)
            .sort((a, b) => (b.capacite_totale - b.places_disponibles) - (a.capacite_totale - a.places_disponibles))
            .slice(0, 6);
    },

    getLieux() {
        return [...new Set(state.events.map(e => e.lieu))].sort();
    },

    startAutoRefresh() {
        this.stopAutoRefresh();
        state.refreshInterval = setInterval(async () => {
            await this.fetch();
            const route = Router.getRoute();
            if (route.page === 'events' || route.page === 'home') {
                Router.render();
            }
        }, 30000);
    },

    stopAutoRefresh() {
        if (state.refreshInterval) {
            clearInterval(state.refreshInterval);
            state.refreshInterval = null;
        }
    }
};

// ============================================
// API — Reservations
// ============================================
const Reservations = {
    async fetch() {
        if (!state.user) return;
        try {
            const res = await fetch(`${API_URL}/reservations/utilisateur/${state.user._id}`);
            if (res.ok) state.reservations = await res.json();
        } catch (e) {
            console.error(e);
        }
    },

    async create(eventId, nombrePlaces) {
        const res = await fetch(`${API_URL}/reservations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                utilisateur_id: state.user._id,
                evenement_id: eventId,
                nombre_places: nombrePlaces
            })
        });
        return { ok: res.ok, data: await res.json() };
    },

    async pay(reservationId) {
        const res = await fetch(`${API_URL}/reservations/${reservationId}/payer`, { method: 'POST' });
        return { ok: res.ok, data: await res.json() };
    },

    async getBillets(reservationId) {
        const res = await fetch(`${API_URL}/reservations/${reservationId}/billets`);
        if (res.ok) return await res.json();
        return null;
    },

    getRemainingSeconds(reservation) {
        const created = new Date(reservation.date_creation).getTime();
        const elapsed = Math.floor((Date.now() - created) / 1000);
        return Math.max(0, TTL_SECONDS - elapsed);
    }
};

// ============================================
// PAGES
// ============================================
const Pages = {
    Home: {
        search() {
            state.filters.search = document.getElementById('heroSearch')?.value || '';
            Router.navigate('#/events');
        },
        setCategory(cat) {
            state.filters.category = cat;
            Router.navigate('#/events');
        }
    },

    async _homeRender() {
        const popular = Events.getPopular();
        return `
            <section class="hero">
                <div class="container hero__content">
                    <div class="hero__badge">Billetterie officielle</div>
                    <h1 class="hero__title">Réservez vos événements <span>en un clic</span></h1>
                    <p class="hero__subtitle">Concerts, spectacles et conférences — trouvez votre prochaine expérience et recevez votre billet digital instantanément.</p>
                    <div class="hero__search">
                        <input type="text" id="heroSearch" placeholder="Rechercher un événement, lieu, date..."
                               value="${Utils.escapeHtml(state.filters.search)}"
                               onkeydown="if(event.key==='Enter') Pages.Home.search()">
                        <button class="btn btn--primary" onclick="Pages.Home.search()">Rechercher</button>
                    </div>
                    <div class="hero__stats">
                        <div class="hero__stat">
                            <div class="hero__stat-value">${state.events.length}</div>
                            <div class="hero__stat-label">Événements</div>
                        </div>
                        <div class="hero__stat">
                            <div class="hero__stat-value">${Events.getLieux().length}</div>
                            <div class="hero__stat-label">Lieux</div>
                        </div>
                        <div class="hero__stat">
                            <div class="hero__stat-value">10 min</div>
                            <div class="hero__stat-label">Réservation sécurisée</div>
                        </div>
                    </div>
                </div>
            </section>
            <section class="section">
                <div class="container">
                    ${Components.categoryPills('', 'home')}
                    <div class="section__header">
                        <div>
                            <h2 class="section__title">Événements populaires</h2>
                            <p class="section__subtitle">Les événements les plus demandés en ce moment</p>
                        </div>
                        <a href="#/events" class="btn btn--secondary btn--sm" data-nav>Voir tout →</a>
                    </div>
                    ${Components.eventsGrid(popular)}
                </div>
            </section>
        `;
    },

    Events: {
        async render() {
            const filtered = Events.filter();
            const lieux = Events.getLieux();
            return `
                <section class="section page-enter">
                    <div class="container">
                        <div class="section__header">
                            <div>
                                <h2 class="section__title">Tous les événements</h2>
                                <p class="section__subtitle">${filtered.length} événement${filtered.length > 1 ? 's' : ''} disponible${filtered.length > 1 ? 's' : ''}</p>
                            </div>
                        </div>
                        ${Components.categoryPills(state.filters.category)}
                        <div class="filters-bar">
                            <div class="form-field">
                                <input type="text" id="searchInput" placeholder="Rechercher..."
                                       value="${Utils.escapeHtml(state.filters.search)}"
                                       oninput="Pages.Events.applyFilters()">
                            </div>
                            <div class="form-field">
                                <select id="lieuFilter" onchange="Pages.Events.applyFilters()">
                                    <option value="">Tous les lieux</option>
                                    ${lieux.map(l => `<option value="${Utils.escapeHtml(l)}"${state.filters.lieu === l ? ' selected' : ''}>${Utils.escapeHtml(l)}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-field">
                                <select id="prixMaxFilter" onchange="Pages.Events.applyFilters()">
                                    <option value="">Tous les prix</option>
                                    <option value="5000"${state.filters.prixMax === '5000' ? ' selected' : ''}>Moins de 5 000 FCFA</option>
                                    <option value="10000"${state.filters.prixMax === '10000' ? ' selected' : ''}>Moins de 10 000 FCFA</option>
                                    <option value="20000"${state.filters.prixMax === '20000' ? ' selected' : ''}>Moins de 20 000 FCFA</option>
                                </select>
                            </div>
                            <button class="btn btn--ghost btn--sm" onclick="Pages.Events.resetFilters()">Réinitialiser</button>
                        </div>
                        <div id="eventsContainer">${Components.eventsGrid(filtered)}</div>
                    </div>
                </section>
            `;
        },

        setCategory(cat) {
            state.filters.category = cat;
            Router.render();
        },

        applyFilters() {
            state.filters.search = document.getElementById('searchInput')?.value || '';
            state.filters.lieu = document.getElementById('lieuFilter')?.value || '';
            state.filters.prixMax = document.getElementById('prixMaxFilter')?.value || '';
            const container = document.getElementById('eventsContainer');
            if (container) container.innerHTML = Components.eventsGrid(Events.filter());
        },

        resetFilters() {
            state.filters = { search: '', lieu: '', prixMax: '', category: '' };
            Router.render();
            Toast.show('Filtres réinitialisés', 'info');
        }
    },

    EventDetail: {
        async render(id) {
            let event = Events.getById(id);
            if (!event) {
                await Events.fetch();
                event = Events.getById(id);
            }
            if (!event) {
                return `<div class="container empty-state"><h3>Événement introuvable</h3><a href="#/events" class="btn btn--primary" data-nav>Retour</a></div>`;
            }

            const cat = Utils.getCategory(event);
            const passed = Utils.isEventPassed(event);
            const isFull = event.places_disponibles === 0;
            const pct = Utils.getAvailabilityPercent(event);
            const isLow = pct < 20;
            const img = event.image || FALLBACK_IMAGE;

            return `
                <div class="event-detail page-enter">
                    <div class="container">
                        <nav class="breadcrumb">
                            <a href="#/" data-nav>Accueil</a> ›
                            <a href="#/events" data-nav>Événements</a> ›
                            <span>${Utils.escapeHtml(event.titre)}</span>
                        </nav>
                        <div class="event-detail__hero">
                            <img src="${img}" alt="${Utils.escapeHtml(event.titre)}" onerror="this.src='${FALLBACK_IMAGE}'">
                            <div class="event-detail__hero-overlay">
                                <span class="event-card__badge event-card__badge--${cat}">${Utils.categoryLabel(cat)}</span>
                                <h1 class="event-detail__hero-title">${Utils.escapeHtml(event.titre)}</h1>
                                <div class="event-detail__hero-meta">
                                    <span>${Utils.formatDate(event.date)}</span>
                                    <span>${Utils.escapeHtml(event.lieu)}</span>
                                </div>
                            </div>
                        </div>
                        <div class="event-detail__grid">
                            <div class="event-detail__description">
                                <h2>À propos de cet événement</h2>
                                <p>${Utils.escapeHtml(event.description || 'Un événement exceptionnel vous attend. Réservez vos places dès maintenant pour ne rien manquer de cette expérience unique.')}</p>
                            </div>
                            <div class="booking-card">
                                <div class="booking-card__price">${Utils.formatPrice(event.prix)}</div>
                                <div class="booking-card__price-label">par place</div>
                                <div class="availability-bar">
                                    <div class="availability-bar__header">
                                        <span>Places disponibles</span>
                                        <span><strong>${event.places_disponibles}</strong> / ${event.capacite_totale}</span>
                                    </div>
                                    <div class="availability-bar__track">
                                        <div class="availability-bar__fill${isLow ? ' availability-bar__fill--low' : ''}" style="width:${pct}%"></div>
                                    </div>
                                </div>
                                <button class="btn btn--primary btn--full btn--lg"
                                    onclick="Router.navigate('#/booking/${event._id}')"
                                    ${isFull || passed ? 'disabled' : ''}>
                                    ${passed ? 'Événement passé' : isFull ? 'Complet' : 'Réserver maintenant'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    },

    Booking: {
        async render(eventId, reservationId) {
            if (!Auth.require()) return '';

            let event = Events.getById(eventId);
            if (!event) { await Events.fetch(); event = Events.getById(eventId); }
            if (!event) return `<div class="container empty-state"><h3>Événement introuvable</h3></div>`;

            state.booking.event = event;

            if (reservationId) {
                await Reservations.fetch();
                const existing = state.reservations.find(r => r._id === reservationId);
                state.booking.reservation = existing || null;
            } else {
                state.booking.reservation = null;
            }

            const res = state.booking.reservation;
            const hasReservation = res && res.statut === 'EN_ATTENTE';
            const remaining = hasReservation ? Reservations.getRemainingSeconds(res) : TTL_SECONDS;
            const places = hasReservation ? res.nombre_places : 1;
            const total = hasReservation ? res.montant_total : event.prix * places;

            return `
                <div class="booking-page page-enter">
                    <div class="container">
                        <nav class="breadcrumb">
                            <a href="#/event/${event._id}" data-nav>← Retour à l'événement</a>
                        </nav>
                        <div class="booking-page__grid">
                            <div class="booking-form-card">
                                <h2>${hasReservation ? 'Finaliser votre réservation' : 'Réserver vos places'}</h2>
                                ${hasReservation ? Components.countdownHTML(remaining) : ''}
                                <form id="bookingForm" onsubmit="Pages.Booking.submit(event)">
                                    <div class="form-row">
                                        <div class="form-field">
                                            <label>Prénom</label>
                                            <input type="text" id="bookPrenom" value="${state.user.prenom}" required ${hasReservation ? 'readonly' : ''}>
                                        </div>
                                        <div class="form-field">
                                            <label>Nom</label>
                                            <input type="text" id="bookNom" value="${state.user.nom}" required ${hasReservation ? 'readonly' : ''}>
                                        </div>
                                    </div>
                                    <div class="form-field">
                                        <label>Email</label>
                                        <input type="email" id="bookEmail" value="${state.user.email || ''}" placeholder="votre@email.com" ${hasReservation ? 'readonly' : ''}>
                                    </div>
                                    <div class="form-field">
                                        <label>Nombre de places</label>
                                        <input type="number" id="bookPlaces" min="1" max="${event.places_disponibles + (hasReservation ? res.nombre_places : 0)}"
                                               value="${places}" ${hasReservation ? 'readonly' : ''}
                                               oninput="Pages.Booking.updateTotal()">
                                    </div>
                                    ${hasReservation ? '' : `<button type="submit" class="btn btn--primary btn--full btn--lg" id="bookSubmitBtn">
                                        Confirmer la réservation
                                    </button>`}
                                </form>
                            </div>
                            <div class="order-summary-card">
                                <h2>Résumé de commande</h2>
                                <div class="order-line"><span>Événement</span><span>${Utils.escapeHtml(event.titre)}</span></div>
                                <div class="order-line"><span>Date</span><span>${Utils.formatDate(event.date)}</span></div>
                                <div class="order-line"><span>Lieu</span><span>${Utils.escapeHtml(event.lieu)}</span></div>
                                <div class="order-line"><span>Prix unitaire</span><span>${Utils.formatPrice(event.prix)}</span></div>
                                <div class="order-line"><span>Places</span><span id="summaryPlaces">${places}</span></div>
                                <div class="order-line order-line--total"><span>Total</span><span id="summaryTotal">${Utils.formatPrice(total)}</span></div>
                                ${hasReservation ? `
                                    <div style="margin-top:20px">
                                        ${Components.statusBadge('EN_ATTENTE')}
                                    </div>
                                    <button class="btn btn--success btn--full btn--lg" style="margin-top:20px"
                                        id="payBtn" onclick="Pages.Booking.pay()"
                                        ${remaining <= 0 ? 'disabled' : ''}>
                                        Confirmer le paiement
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        updateTotal() {
            const places = parseInt(document.getElementById('bookPlaces')?.value) || 1;
            const total = state.booking.event.prix * places;
            const el = document.getElementById('summaryTotal');
            const pl = document.getElementById('summaryPlaces');
            if (el) el.textContent = Utils.formatPrice(total);
            if (pl) pl.textContent = places;
        },

        async submit(e) {
            e.preventDefault();
            if (!Auth.require()) return;

            const btn = document.getElementById('bookSubmitBtn');
            btn.disabled = true;
            btn.textContent = 'Réservation en cours...';

            const places = parseInt(document.getElementById('bookPlaces').value);
            const { ok, data } = await Reservations.create(state.booking.event._id, places);

            if (ok) {
                state.booking.reservation = data.reservation;
                state.reservations.unshift(data.reservation);
                Toast.show('Réservation réussie ! Vous avez 10 minutes pour payer.', 'success');
                Router.navigate(`#/booking/${state.booking.event._id}/${data.reservation._id}`);
                await Events.fetch();
            } else {
                Toast.show(data.message || 'Erreur de réservation', 'error');
                btn.disabled = false;
                btn.textContent = 'Confirmer la réservation';
            }
        },

        async pay() {
            const res = state.booking.reservation;
            if (!res) return;

            const btn = document.getElementById('payBtn');
            btn.disabled = true;
            btn.textContent = 'Paiement en cours...';

            const { ok, data } = await Reservations.pay(res._id);
            if (ok) {
                Toast.show('Réservation réussie ! Vos billets sont prêts.', 'success');
                res.statut = 'CONFIRMEE';
                Router.navigate(`#/ticket/${res._id}`);
                await Events.fetch();
            } else {
                Toast.show(data.message || 'Erreur de paiement', 'error');
                btn.disabled = false;
                btn.textContent = 'Confirmer le paiement';
            }
        },

        startCountdown() {
            this.stopCountdown();
            const res = state.booking.reservation;
            if (!res || res.statut !== 'EN_ATTENTE') return;

            state.countdownInterval = setInterval(() => {
                const remaining = Reservations.getRemainingSeconds(res);
                const timeEl = document.getElementById('countdownTime');
                const countdownEl = document.getElementById('countdown');
                const payBtn = document.getElementById('payBtn');

                if (timeEl) {
                    const mins = Math.floor(remaining / 60);
                    const secs = remaining % 60;
                    timeEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                }
                if (countdownEl) {
                    countdownEl.classList.toggle('countdown--urgent', remaining > 0 && remaining < 120);
                    if (remaining <= 0) {
                        countdownEl.classList.add('countdown--expired');
                        countdownEl.classList.remove('countdown--urgent');
                    }
                }
                if (payBtn && remaining <= 0) {
                    payBtn.disabled = true;
                    clearInterval(state.countdownInterval);
                }
            }, 1000);
        },

        stopCountdown() {
            if (state.countdownInterval) {
                clearInterval(state.countdownInterval);
                state.countdownInterval = null;
            }
        }
    },

    Ticket: {
        async render(reservationId) {
            const data = await Reservations.getBillets(reservationId);
            if (!data) {
                return `<div class="container empty-state"><h3>Billet introuvable</h3><a href="#/reservations" class="btn btn--primary" data-nav>Mes billets</a></div>`;
            }

            const { reservation, billets } = data;
            const event = reservation.evenement_id;

            return `
                <div class="ticket-page page-enter">
                    <div class="container">
                        <div class="ticket-success">
                            <div class="ticket-success__icon">✓</div>
                            <h1>Réservation confirmée !</h1>
                            <p>Vos billets digitaux sont prêts. Présentez le QR code à l'entrée.</p>
                        </div>
                        <div class="tickets-grid" id="ticketsGrid">
                            ${billets.map((b, i) => this.ticketHTML(b, event, i + 1, billets.length)).join('')}
                        </div>
                        <div style="text-align:center;margin-top:32px">
                            <a href="#/reservations" class="btn btn--secondary" data-nav>Mes billets</a>
                            <a href="#/events" class="btn btn--primary" data-nav style="margin-left:12px">Découvrir plus d'événements</a>
                        </div>
                    </div>
                </div>
            `;
        },

        ticketHTML(billet, event, index, total) {
            return `
                <div class="digital-ticket" data-code="${billet.code_barre}">
                    <div class="digital-ticket__header">
                        <h3>Eventia — Billet ${index}/${total}</h3>
                    </div>
                    <div class="digital-ticket__body">
                        <div class="digital-ticket__qr" id="qr-${billet._id}"></div>
                        <div class="digital-ticket__code">${billet.code_barre}</div>
                        <div class="digital-ticket__info">
                            <div class="digital-ticket__row"><span>Événement</span><span>${Utils.escapeHtml(event.titre)}</span></div>
                            <div class="digital-ticket__row"><span>Date</span><span>${Utils.formatDate(event.date)}</span></div>
                            <div class="digital-ticket__row"><span>Lieu</span><span>${Utils.escapeHtml(event.lieu)}</span></div>
                            <div class="digital-ticket__row"><span>Détenteur</span><span>${state.user ? `${state.user.prenom} ${state.user.nom}` : '—'}</span></div>
                            <div class="digital-ticket__row"><span>Statut</span><span>${billet.statut}</span></div>
                        </div>
                    </div>
                    <div class="digital-ticket__perforation"><div class="circle-right"></div></div>
                </div>
            `;
        },

        generateQRCodes() {
            document.querySelectorAll('.digital-ticket').forEach(ticket => {
                const code = ticket.dataset.code;
                const qrContainer = ticket.querySelector('.digital-ticket__qr');
                if (qrContainer && code && typeof QRCode !== 'undefined') {
                    QRCode.toCanvas(code, { width: 156, margin: 1, color: { dark: '#1e3a5f' } }, (err, canvas) => {
                        if (!err) qrContainer.appendChild(canvas);
                    });
                }
            });
        }
    },

    ReservationsList: {
        async render() {
            if (!state.user) {
                return `<div class="container empty-state page-enter">
                    <div class="empty-state__icon"></div>
                    <h3>Connectez-vous pour voir vos billets</h3>
                    <button class="btn btn--primary" onclick="App.auth.openModal()">Se connecter</button>
                </div>`;
            }

            await Reservations.fetch();
            if (!state.reservations.length) {
                return `<div class="container empty-state page-enter">
                    <div class="empty-state__icon"></div>
                    <h3>Aucune réservation</h3>
                    <p>Explorez nos événements et réservez vos places.</p>
                    <a href="#/events" class="btn btn--primary" data-nav style="margin-top:16px">Voir les événements</a>
                </div>`;
            }

            return `
                <section class="section page-enter">
                    <div class="container">
                        <h2 class="section__title">Mes billets</h2>
                        <p class="section__subtitle" style="margin-bottom:32px">Gérez vos réservations et accédez à vos billets</p>
                        <div class="reservations-list">
                            ${state.reservations.map(r => this.card(r)).join('')}
                        </div>
                    </div>
                </section>
            `;
        },

        card(res) {
            const event = res.evenement_id;
            const title = event?.titre || `Réservation #${res._id.substring(0, 8)}`;
            const remaining = res.statut === 'EN_ATTENTE' ? Reservations.getRemainingSeconds(res) : 0;

            let actions = '';
            if (res.statut === 'EN_ATTENTE' && remaining > 0) {
                const eventId = typeof event === 'object' ? event._id : res.evenement_id;
                actions = `<button class="btn btn--success btn--sm" onclick="Router.navigate('#/booking/${eventId}/${res._id}')">Payer</button>`;
            } else if (res.statut === 'CONFIRMEE') {
                actions = `<button class="btn btn--primary btn--sm" onclick="Router.navigate('#/ticket/${res._id}')">Voir le billet</button>`;
            }

            return `
                <div class="reservation-card">
                    <div class="reservation-card__info">
                        <h3>${Utils.escapeHtml(title)}</h3>
                        <p>${res.nombre_places} place${res.nombre_places > 1 ? 's' : ''} • ${Utils.formatPrice(res.montant_total)}
                           ${res.statut === 'EN_ATTENTE' && remaining > 0 ? `• Expire dans ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}` : ''}
                        </p>
                    </div>
                    <div class="reservation-card__actions">
                        ${Components.statusBadge(res.statut)}
                        ${actions}
                    </div>
                </div>
            `;
        }
    }
};

// ============================================
// ROUTER
// ============================================
const Router = {
    getRoute() {
        const hash = location.hash.slice(2) || 'home';
        const parts = hash.split('/');
        const page = parts[0] || 'home';
        return { page, params: parts.slice(1) };
    },

    async navigate(hash) {
        location.hash = hash;
    },

    updateNav(route) {
        document.querySelectorAll('.nav__link').forEach(link => {
            const href = link.getAttribute('href')?.slice(2) || 'home';
            const isActive = href === route.page || (route.page === 'home' && href === '');
            link.classList.toggle('active', isActive || (href === 'events' && ['event', 'booking'].includes(route.page)));
        });
    },

    async render() {
        Pages.Booking.stopCountdown();
        const app = document.getElementById('app');
        const route = this.getRoute();
        this.updateNav(route);

        let html = '';
        switch (route.page) {
            case 'home':
            case '':
                html = await Pages._homeRender();
                break;
            case 'events':
                html = await Pages.Events.render();
                break;
            case 'event':
                html = await Pages.EventDetail.render(route.params[0]);
                break;
            case 'booking':
                html = await Pages.Booking.render(route.params[0], route.params[1]);
                break;
            case 'ticket':
                html = await Pages.Ticket.render(route.params[0]);
                break;
            case 'reservations':
                html = await Pages.ReservationsList.render();
                break;
            default:
                html = await Pages._homeRender();
        }

        app.innerHTML = html;
        app.className = 'app page-enter';

        if (route.page === 'booking' && route.params[1]) {
            Pages.Booking.startCountdown();
        }
        if (route.page === 'ticket') {
            Pages.Ticket.generateQRCodes();
        }

        document.getElementById('mainNav')?.classList.remove('open');
    },

    init() {
        window.addEventListener('hashchange', () => this.render());
        document.querySelectorAll('[data-nav]').forEach(el => {
            el.addEventListener('click', () => {
                document.getElementById('mainNav')?.classList.remove('open');
            });
        });
        document.getElementById('navToggle')?.addEventListener('click', () => {
            document.getElementById('mainNav')?.classList.toggle('open');
        });
        document.querySelectorAll('.auth-tabs__btn').forEach(btn => {
            btn.addEventListener('click', () => Auth.switchTab(btn.dataset.authTab));
        });
    }
};

// ============================================
// APP INIT
// ============================================
const App = {
    auth: Auth,
    router: Router,
    toast: Toast
};

document.addEventListener('DOMContentLoaded', async () => {
    Auth.load();
    if (state.user && state.user.role !== 'admin') {
        const adminLink = document.querySelector('a[href="admin.html"]');
        if (adminLink) adminLink.hidden = true;
    }
    Router.init();

    const app = document.getElementById('app');
    app.innerHTML = Components.skeletonCards(6);

    await Events.fetch();
    Events.startAutoRefresh();

    if (state.user) await Reservations.fetch();

    if (!location.hash || location.hash === '#') {
        location.hash = '#/';
    }
    await Router.render();
});
