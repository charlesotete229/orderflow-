
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import {
  Users,
  Package,
  ShoppingCart,
  Wallet,
  TrendingUp,
  Clock,
  RefreshCw,
  ArrowUpRight,
  ArrowRight,
  CreditCard,
  Activity,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import api from "../api/axios";

function Dashboard() {
  const navigate = useNavigate();

  const [utilisateur, setUtilisateur] = useState(null);
  const [statistiques, setStatistiques] = useState(null);
  const [commandesRecentes, setCommandesRecentes] = useState([]);
  const [paiementsRecents, setPaiementsRecents] = useState([]);

  const [chargement, setChargement] = useState(true);
  const [actualisation, setActualisation] = useState(false);
  const [erreur, setErreur] = useState("");

  const chargerDonnees = async (premierChargement = false) => {
    if (premierChargement) {
      setChargement(true);
    } else {
      setActualisation(true);
    }

    setErreur("");

    try {
      const [
        profilResponse,
        statistiquesResponse,
        commandesResponse,
        paiementsResponse,
      ] = await Promise.all([
        api.get("/auth/me"),
        api.get("/statistiques/dashboard"),
        api.get("/commandes/recentes"),
        api.get("/paiements/recents"),
      ]);

      setUtilisateur(profilResponse.data);

      sessionStorage.setItem(
        "utilisateur",
        JSON.stringify(profilResponse.data)
      );

      setStatistiques(statistiquesResponse.data);
      setCommandesRecentes(commandesResponse.data);
      setPaiementsRecents(paiementsResponse.data);
    } catch (error) {
      console.error("Erreur chargement dashboard :", error);

      if (error.response?.status === 401) {
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("utilisateur");
        navigate("/connexion", { replace: true });
        return;
      }

      setErreur(
        "Impossible de récupérer les données du tableau de bord."
      );
    } finally {
      setChargement(false);
      setActualisation(false);
    }
  };

  useEffect(() => {
    chargerDonnees(true);
  }, []);

  const formaterMontant = (montant) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      maximumFractionDigits: 0,
    }).format(montant || 0);
  };

  const formaterDate = (date) => {
    if (!date) return "Date inconnue";

    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const obtenirClasseStatut = (statut) => {
    const classes = {
      PAYEE: "bg-emerald-50 text-emerald-700",
      VALIDE: "bg-emerald-50 text-emerald-700",
      LIVREE: "bg-emerald-50 text-emerald-700",
      TERMINEE: "bg-emerald-50 text-emerald-700",
      EN_ATTENTE: "bg-amber-50 text-amber-700",
      NON_PAYEE: "bg-amber-50 text-amber-700",
      PARTIELLEMENT_PAYEE: "bg-blue-50 text-blue-700",
      ANNULEE: "bg-red-50 text-red-700",
    };

    return (
      classes[statut] || "bg-slate-100 text-slate-600"
    );
  };

  const formaterStatut = (statut) => {
    return statut
      ? statut.replace(/_/g, " ")
      : "INCONNU";
  };

  const cartesStatistiques = [
    {
      titre: "Total clients",
      valeur: statistiques?.total_clients ?? 0,
      description: "Clients enregistrés",
      icone: Users,
      couleur: "blue",
      progression: "+ Gestion clients",
    },
    {
      titre: "Total produits",
      valeur: statistiques?.total_produits ?? 0,
      description: "Produits enregistrés",
      icone: Package,
      couleur: "violet",
      progression: "Catalogue",
    },
    {
      titre: "Total commandes",
      valeur: statistiques?.total_commandes ?? 0,
      description: "Commandes enregistrées",
      icone: ShoppingCart,
      couleur: "orange",
      progression: "Activité commerciale",
    },
    {
      titre: "Paiements reçus",
      valeur: formaterMontant(statistiques?.paiements_recus),
      description: "Montant total encaissé",
      icone: Wallet,
      couleur: "emerald",
      progression: "Encaissements",
    },
    {
      titre: "Reste à encaisser",
      valeur: formaterMontant(statistiques?.reste_a_encaisser),
      description: "Montant restant à recevoir",
      icone: TrendingUp,
      couleur: "cyan",
      progression: "À recouvrer",
    },
    {
      titre: "Commandes en attente",
      valeur: statistiques?.commandes_en_attente ?? 0,
      description: "Commandes à traiter",
      icone: Clock,
      couleur: "rose",
      progression: "Suivi nécessaire",
    },
  ];

  const couleurs = {
    blue: {
      fond: "bg-blue-50",
      texte: "text-blue-600",
      bordure: "border-blue-100",
    },
    violet: {
      fond: "bg-violet-50",
      texte: "text-violet-600",
      bordure: "border-violet-100",
    },
    orange: {
      fond: "bg-orange-50",
      texte: "text-orange-600",
      bordure: "border-orange-100",
    },
    emerald: {
      fond: "bg-emerald-50",
      texte: "text-emerald-600",
      bordure: "border-emerald-100",
    },
    cyan: {
      fond: "bg-cyan-50",
      texte: "text-cyan-600",
      bordure: "border-cyan-100",
    },
    rose: {
      fond: "bg-rose-50",
      texte: "text-rose-600",
      bordure: "border-rose-100",
    },
  };

  // Données de tendance : elles seront remplacées par
  // des données historiques lorsque le backend les fournira.
  const donneesGraphique = [
    { mois: "Jan", montant: 0 },
    { mois: "Fév", montant: 0 },
    { mois: "Mar", montant: 0 },
    { mois: "Avr", montant: 0 },
    { mois: "Mai", montant: 0 },
    { mois: "Juin", montant: 0 },
    { mois: "Juil", montant: 0 },
  ];

  if (chargement) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        <p className="text-sm font-medium text-slate-500">
          Préparation de votre tableau de bord...
        </p>
      </div>
    );
  }

  if (erreur && !statistiques) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-2xl border border-red-100 bg-white p-8 text-center">
        <Activity size={35} className="text-red-500" />
        <p className="font-semibold text-slate-800">
          Une erreur est survenue
        </p>
        <p className="text-sm text-slate-500">{erreur}</p>

        <button
          onClick={() => chargerDonnees(true)}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Bienvenue */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 p-6 text-white shadow-xl shadow-blue-100 sm:p-8"
      >
        <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-sm font-medium text-blue-100">
              ESPACE DE GESTION
            </p>

            <h1 className="text-2xl font-bold sm:text-3xl">
              Bonjour {utilisateur?.prenom || ""} !
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
              Retrouvez en un coup d'œil les informations
              essentielles de votre activité commerciale.
            </p>
          </div>

          <button
            onClick={() => chargerDonnees(false)}
            disabled={actualisation}
            className="flex w-fit items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/15 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25 disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={actualisation ? "animate-spin" : ""}
            />
            {actualisation ? "Actualisation..." : "Actualiser"}
          </button>
        </div>

        <div className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full border-[35px] border-white/10" />
        <div className="pointer-events-none absolute -bottom-32 right-40 h-64 w-64 rounded-full bg-white/5" />
      </motion.section>

      {erreur && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {erreur}
        </div>
      )}

      {/* Statistiques */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Vue d'ensemble
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Les indicateurs clés de votre activité
            </p>
          </div>

          <span className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Données actualisées
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cartesStatistiques.map((carte, index) => {
            const Icone = carte.icone;
            const couleur = couleurs[carte.couleur];

            return (
              <motion.div
                key={carte.titre}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: index * 0.07,
                }}
                whileHover={{ y: -5 }}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg hover:shadow-slate-200/50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {carte.titre}
                    </p>

                    <h3 className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-900">
                      {carte.valeur}
                    </h3>
                  </div>

                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${couleur.fond} ${couleur.texte}`}
                  >
                    <Icone size={23} />
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-500">
                    {carte.description}
                  </p>

                  <span
                    className={`text-xs font-semibold ${couleur.texte}`}
                  >
                    {carte.progression}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Graphique et résumé */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2 sm:p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">
                Activité commerciale
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Aperçu de l'évolution des encaissements
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <TrendingUp size={20} />
            </div>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={donneesGraphique}>
                <defs>
                  <linearGradient
                    id="couleurGraphique"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#2563eb"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="95%"
                      stopColor="#2563eb"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />

                <XAxis
                  dataKey="mois"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />

                <Tooltip
                  formatter={(value) => [
                    formaterMontant(value),
                    "Encaissements",
                  ]}
                />

                <Area
                  type="monotone"
                  dataKey="montant"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fill="url(#couleurGraphique)"
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="mt-3 text-xs text-slate-400">
            Historique mensuel à connecter aux données du backend.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6">
            <h2 className="font-bold text-slate-900">
              Résumé financier
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Situation des encaissements
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Paiements reçus
                </span>
                <CreditCard size={17} className="text-emerald-600" />
              </div>

              <p className="text-xl font-bold text-slate-900">
                {formaterMontant(statistiques?.paiements_recus)}
              </p>
            </div>

            <div className="h-px bg-slate-100" />

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Reste à encaisser
                </span>
                <Wallet size={17} className="text-orange-500" />
              </div>

              <p className="text-xl font-bold text-slate-900">
                {formaterMontant(statistiques?.reste_a_encaisser)}
              </p>
            </div>

            <div className="h-px bg-slate-100" />

            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-xs font-medium text-blue-600">
                Nombre total de commandes
              </p>

              <p className="mt-1 text-2xl font-bold text-blue-800">
                {statistiques?.total_commandes ?? 0}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Activités récentes */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        {/* Commandes récentes */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
              <h2 className="font-bold text-slate-900">
                Commandes récentes
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Les dernières commandes enregistrées
              </p>
            </div>

            <button
              onClick={() => navigate("/commandes")}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 transition hover:text-blue-800"
            >
              Voir tout <ArrowUpRight size={15} />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {commandesRecentes.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">
                Aucune commande enregistrée pour le moment.
              </p>
            ) : (
              commandesRecentes.map((commande) => (
                <div
                  key={commande.id}
                  className="flex items-center justify-between gap-3 p-5 transition hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {commande.numero_commande}
                    </p>

                    <p className="mt-1 truncate text-xs text-slate-500">
                      Client : {commande.client || "Client de passage"}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {formaterDate(commande.date_commande)}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {formaterMontant(commande.montant_total)}
                    </p>

                    <span
                      className={`mt-2 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold ${obtenirClasseStatut(commande.statut)}`}
                    >
                      {formaterStatut(commande.statut)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => navigate("/commandes")}
            className="flex w-full items-center justify-center gap-2 border-t border-slate-100 p-4 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-blue-600"
          >
            Accéder aux commandes <ArrowRight size={16} />
          </button>
        </div>

        {/* Paiements récents */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
              <h2 className="font-bold text-slate-900">
                Paiements récents
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Les dernières opérations enregistrées
              </p>
            </div>

            <button
              onClick={() => navigate("/paiements")}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 transition hover:text-blue-800"
            >
              Voir tout <ArrowUpRight size={15} />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {paiementsRecents.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">
                Aucun paiement enregistré pour le moment.
              </p>
            ) : (
              paiementsRecents.map((paiement) => (
                <div
                  key={paiement.id}
                  className="flex items-center justify-between gap-3 p-5 transition hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {paiement.numero_commande}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Mode : {paiement.mode_paiement}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {formaterDate(paiement.date_paiement)}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {formaterMontant(paiement.montant)}
                    </p>

                    <span
                      className={`mt-2 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold ${obtenirClasseStatut(paiement.statut)}`}
                    >
                      {formaterStatut(paiement.statut)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => navigate("/paiements")}
            className="flex w-full items-center justify-center gap-2 border-t border-slate-100 p-4 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-blue-600"
          >
            Accéder aux paiements <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
