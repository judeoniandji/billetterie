// Script 03-agregations.js - Pipeline d'agrégation
// Usage: mongosh < scripts/03-agregations.js (ou load("scripts/03-agregations.js") dans mongosh)

print("=== DÉMONSTRATION DES PIPELINES D'AGRÉGATION ===\n");

// ==================== AGRÉGATION SIMPLE ($match, $group, $sort) ====================

print("--- Recettes par événement ($match, $group, $sort) ---");
const recettesParEvenement = db.reservations.aggregate([
  {
    $match: { statut: "CONFIRMEE" }
  },
  {
    $group: {
      _id: "$evenement_id",
      total_recettes: { $sum: "$montant_total" },
      nombre_reservations: { $sum: 1 },
      total_places: { $sum: "$nombre_places" }
    }
  },
  {
    $sort: { total_recettes: -1 }
  },
  {
    $limit: 5
  }
]);

print("Top 5 des événements par recettes:");
recettesParEvenement.forEach(r => {
  const event = db.evenements.findOne({ _id: r._id }, { titre: 1 });
  print(`  - ${event.titre}: ${r.total_recettes} FCFA (${r.nombre_reservations} réservations, ${r.total_places} places)`);
});
print("");

// ==================== AGRÉGATION AVEC $lookup (JOINTURE) ====================

print("--- Réservations avec détails utilisateur et événement ($lookup) ---");
const reservationsDetails = db.reservations.aggregate([
  {
    $match: { statut: "CONFIRMEE" }
  },
  {
    $lookup: {
      from: "utilisateurs",
      localField: "utilisateur_id",
      foreignField: "_id",
      as: "utilisateur"
    }
  },
  {
    $lookup: {
      from: "evenements",
      localField: "evenement_id",
      foreignField: "_id",
      as: "evenement"
    }
  },
  {
    $unwind: "$utilisateur"
  },
  {
    $unwind: "$evenement"
  },
  {
    $project: {
      _id: 0,
      utilisateur: { nom: 1, prenom: 1, email: 1 },
      evenement: { titre: 1, date: 1, lieu: 1 },
      nombre_places: 1,
      montant_total: 1,
      statut: 1
    }
  },
  {
    $limit: 5
  }
]);

print("Détails des 5 dernières réservations confirmées:");
reservationsDetails.forEach(r => {
  print(`  - ${r.utilisateur.prenom} ${r.utilisateur.nom} (${r.utilisateur.email})`);
  print(`    Événement: ${r.evenement.titre} le ${r.evenement.date.toISOString().split('T')[0]}`);
  print(`    ${r.nombre_places} places - ${r.montant_total} FCFA - ${r.statut}`);
});
print("");

// ==================== AGRÉGATION AVEC $bucket (GROUPES DE VALEURS) ====================

print("--- Répartition des événements par fourchette de prix ($bucket) ---");
const repartitionPrix = db.evenements.aggregate([
  {
    $bucket: {
      groupBy: "$prix",
      boundaries: [0, 10000, 20000, 30000, 50000, 100000],
      default: "Plus de 100000",
      output: {
        count: { $sum: 1 },
        titres: { $push: "$titre" }
      }
    }
  }
]);

print("Répartition des événements par prix:");
repartitionPrix.forEach(r => {
  print(`  ${r._id}: ${r.count} événements`);
  r.titres.slice(0, 2).forEach(t => print(`    - ${t}`));
});
print("");

// ==================== AGRÉGATION AVEC $facet (MULTIPLES PIPELINES) ====================

print("--- Statistiques globales ($facet) ---");
const statsGlobales = db.evenements.aggregate([
  {
    $facet: {
      "par_prix": [
        {
          $bucket: {
            groupBy: "$prix",
            boundaries: [0, 15000, 30000, 50000],
            default: "Plus de 50000",
            output: { count: { $sum: 1 } }
          }
        }
      ],
      "par_lieu": [
        {
          $group: {
            _id: "$lieu",
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ],
      "capacite_moyenne": [
        {
          $group: {
            _id: null,
            capacite_moyenne: { $avg: "$capacite_totale" },
            capacite_totale: { $sum: "$capacite_totale" }
          }
        }
      ]
    }
  }
]);

const stats = statsGlobales.next();
print("Statistiques globales des événements:");
print("\nPar prix:");
stats.par_prix.forEach(p => print(`  ${p._id}: ${p.count} événements`));
print("\nPar lieu:");
stats.par_lieu.forEach(l => print(`  ${l._id}: ${l.count} événements`));
print("\nCapacité:");
print(`  Capacité moyenne: ${Math.round(stats.capacite_moyenne[0].capacite_moyenne)} places`);
print(`  Capacité totale: ${stats.capacite_moyenne[0].capacite_totale} places`);
print("");

// ==================== AGRÉGATION AVEC $unwind (DÉPLIAGE DE TABLEAU) ====================

print("--- Artistes par événement ($unwind) ---");
const artistesParEvent = db.evenements.aggregate([
  {
    $match: { artistes: { $exists: true, $not: { $size: 0 } } }
  },
  {
    $unwind: "$artistes"
  },
  {
    $project: {
      titre: 1,
      "artistes.nom": 1,
      "artistes.heure_passage": 1,
      _id: 0
    }
  }
]);

print("Artistes programmés par événement:");
artistesParEvent.forEach(a => {
  print(`  - ${a.titre}: ${a.artistes.nom} (${a.artistes.heure_passage})`);
});
print("");

// ==================== AGRÉGATION COMPLEXE: TOP UTILISATEURS ====================

print("--- Top 5 utilisateurs par nombre de réservations ---");
const topUtilisateurs = db.reservations.aggregate([
  {
    $group: {
      _id: "$utilisateur_id",
      nombre_reservations: { $sum: 1 },
      total_depense: { $sum: "$montant_total" },
      total_places: { $sum: "$nombre_places" }
    }
  },
  {
    $sort: { nombre_reservations: -1 }
  },
  {
    $limit: 5
  },
  {
    $lookup: {
      from: "utilisateurs",
      localField: "_id",
      foreignField: "_id",
      as: "utilisateur"
    }
  },
  {
    $unwind: "$utilisateur"
  },
  {
    $project: {
      _id: 0,
      nom: "$utilisateur.nom",
      prenom: "$utilisateur.prenom",
      email: "$utilisateur.email",
      nombre_reservations: 1,
      total_depense: 1,
      total_places: 1
    }
  }
]);

print("Top 5 des utilisateurs les plus actifs:");
topUtilisateurs.forEach(u => {
  print(`  - ${u.prenom} ${u.nom} (${u.email})`);
  print(`    ${u.nombre_reservations} réservations, ${u.total_places} places, ${u.total_depense} FCFA`);
});
print("");

// ==================== AGRÉGATION: TAUX DE REMPLISSAGE ====================

print("--- Taux de remplissage par événement ---");
const tauxRemplissage = db.evenements.aggregate([
  {
    $project: {
      titre: 1,
      capacite_totale: 1,
      places_disponibles: 1,
      taux_remplissage: {
        $multiply: [
          {
            $divide: [
              { $subtract: ["$capacite_totale", "$places_disponibles"] },
              "$capacite_totale"
            ]
          },
          100
        ]
      }
    }
  },
  {
    $sort: { taux_remplissage: -1 }
  },
  {
    $limit: 5
  }
]);

print("Top 5 des événements les plus remplis:");
tauxRemplissage.forEach(e => {
  print(`  - ${e.titre}: ${e.taux_remplissage.toFixed(1)}% rempli (${e.capacite_totale - e.places_disponibles}/${e.capacite_totale} places)`);
});
print("");

print("=== FIN DES PIPELINES D'AGRÉGATION ===");
