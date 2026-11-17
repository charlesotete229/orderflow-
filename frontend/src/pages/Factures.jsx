
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  FileText,
  CheckCircle2,
  Clock3,
  AlertCircle,
  RefreshCw,
  Search,
  X,
  Download,
  Mail,
  Eye,
  Receipt,
  User,
  ShoppingCart,
  CalendarDays,
  CreditCard,
  Banknote,
  Wallet,
  ArrowRight,
  FileCheck,
  Send,
  Info,
  Package,
  CircleDollarSign,
  Loader2,
} from "lucide-react";
import api from "../api/axios";

function Factures() {
  const navigate = useNavigate();

  const [factures, setFactures] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [clients, setClients] = useState([]);
  const [produits, setProduits] = useState([]);
  const [paiements, setPaiements] = useState([]);

  const [recherche, setRecherche] = useState("");
  const [chargement, setChargement] = useState(true);
  const [actionEnCours, setActionEnCours] = useState(null);

  const [erreur, setErreur] = useState("");
  const [messageSucces, setMessageSucces] = useState("");

  const [factureSelectionnee, setFactureSelectionnee] = useState(null);
  const [factureAction, setFactureAction] = useState(null);

  // Gestion des erreurs
  const gererErreur = (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("utilisateur");
      navigate("/connexion", { replace: true });
      return;
    }

    setErreur(
      error.response?.data?.detail ||
      "Une erreur est survenue. Veuillez réessayer."
    );
  };

  // Chargement des données
  const chargerDonnees = async () => {
    try {
      setChargement(true);
      setErreur("");

      const resultats = await Promise.allSettled([
        api.get("/factures/"),
        api.get("/commandes/"),
        api.get("/clients/"),
        api.get("/produits/"),
        api.get("/paiements/"),
      ]);

      const [
        facturesResult,
        commandesResult,
        clientsResult,
        produitsResult,
        paiementsResult,
      ] = resultats;

      const resultat401 = resultats.find(
        (resultat) =>
          resultat.status === "rejected" &&
          resultat.reason?.response?.status === 401
      );

      if (resultat401) {
        gererErreur(resultat401.reason);
        return false;
      }

      if (facturesResult.status === "fulfilled") {
        setFactures(
          Array.isArray(facturesResult.value.data)
            ? facturesResult.value.data
            : []
        );
      }

      if (commandesResult.status === "fulfilled") {
        setCommandes(
          Array.isArray(commandesResult.value.data)
            ? commandesResult.value.data
            : []
        );
      }

      if (clientsResult.status === "fulfilled") {
        setClients(
          Array.isArray(clientsResult.value.data)
            ? clientsResult.value.data
            : []
        );
      }

      if (produitsResult.status === "fulfilled") {
        setProduits(
          Array.isArray(produitsResult.value.data)
            ? produitsResult.value.data
            : []
        );
      }

      if (paiementsResult.status === "fulfilled") {
        setPaiements(
          Array.isArray(paiementsResult.value.data)
            ? paiementsResult.value.data
            : []
        );
      }

      const premierEchec = resultats.find(
        (resultat) => resultat.status === "rejected"
      );

      if (premierEchec) {
        setErreur(
          premierEchec.reason?.response?.data?.detail ||
          "Certaines informations n'ont pas pu être chargées."
        );
      }

      return facturesResult.status === "fulfilled";
    } catch (error) {
      gererErreur(error);
      return false;
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  // Retrouver une commande
  const trouverCommande = (facture) => {
    return commandes.find(
      (commande) =>
        Number(commande.id) === Number(facture.commande_id)
    );
  };

  // Retrouver un client
  const trouverClient = (facture) => {
    const commande = trouverCommande(facture);

    if (!commande || commande.client_id == null) {
      return null;
    }

    return (
      clients.find(
        (client) =>
          Number(client.id) === Number(commande.client_id)
      ) || null
    );
  };

  // Retrouver un produit
  const trouverProduit = (produitId) => {
    return produits.find(
      (produit) => Number(produit.id) === Number(produitId)
    );
  };

  // Nom du client
  const nomClientFacture = (facture) => {
    const commande = trouverCommande(facture);

    if (commande?.client_id == null) {
      return "Client de passage";
    }

    const client = trouverClient(facture);

    if (!client) {
      return "Client inconnu";
    }

    return `${client.prenom || ""} ${client.nom || ""}`.trim();
  };

  // Nom du client d'une commande
  const nomClientCommande = (commande) => {
    if (commande.client_id == null) {
      return "Client de passage";
    }

    const client = clients.find(
      (element) =>
        Number(element.id) === Number(commande.client_id)
    );

    if (!client) {
      return "Client inconnu";
    }

    return `${client.prenom || ""} ${client.nom || ""}`.trim();
  };

  // Numéro de commande
  const numeroCommandeFacture = (facture) => {
    const commande = trouverCommande(facture);

    return (
      commande?.numero_commande ||
      `Commande #${facture.commande_id}`
    );
  };

  // Formatage des montants
  const formaterMontant = (montant) => {
    return `${Number(montant || 0).toLocaleString("fr-FR")} F`;
  };

  // Formatage des dates
  const formaterDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("fr-FR");
  };

  // Calcul des paiements valides
  const calculerMontantPayeCommande = (commandeId) => {
    return paiements
      .filter(
        (paiement) =>
          Number(paiement.commande_id) === Number(commandeId) &&
          paiement.statut === "VALIDE"
      )
      .reduce(
        (total, paiement) =>
          total + Number(paiement.montant || 0),
        0
      );
  };

  const calculerMontantPaye = (facture) => {
    return calculerMontantPayeCommande(facture.commande_id);
  };

  // Reste à payer
  const calculerResteAPayer = (facture) => {
    const montantTotal = Number(facture.montant_total || 0);
    const montantPaye = calculerMontantPaye(facture);

    return Math.max(0, montantTotal - montantPaye);
  };

  // Statut réel de la facture selon les paiements
  const obtenirStatutActuel = (facture) => {
    const montantTotal = Number(facture.montant_total || 0);
    const montantPaye = calculerMontantPaye(facture);

    if (montantTotal <= 0 || montantPaye <= 0) {
      return "NON_PAYEE";
    }

    if (montantPaye >= montantTotal) {
      return "PAYEE";
    }

    return "PARTIELLEMENT_PAYEE";
  };

  const libelleStatut = (statut) => {
    switch (statut) {
      case "PAYEE":
        return "Payée";
      case "PARTIELLEMENT_PAYEE":
        return "Partiellement payée";
      case "NON_PAYEE":
        return "Non payée";
      case "VALIDE":
        return "Validé";
      case "EN_ATTENTE":
        return "En attente";
      default:
        return statut || "Inconnu";
    }
  };

  const classeStatut = (statut) => {
    switch (statut) {
      case "PAYEE":
      case "VALIDE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";

      case "PARTIELLEMENT_PAYEE":
        return "bg-amber-50 text-amber-700 border-amber-200";

      case "NON_PAYEE":
      case "EN_ATTENTE":
        return "bg-rose-50 text-rose-700 border-rose-200";

      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  // Commandes sans facture
  const commandesEligibles = useMemo(() => {
    return commandes.filter((commande) => {
      const factureExiste = factures.some(
        (facture) =>
          Number(facture.commande_id) === Number(commande.id)
      );

      return (
        !factureExiste &&
        commande.statut !== "ANNULEE" &&
        Number(commande.montant_total) > 0
      );
    });
  }, [commandes, factures]);

  // Recherche des factures
  const facturesFiltrees = useMemo(() => {
    const terme = recherche.toLowerCase().trim();

    return factures.filter((facture) => {
      const statutActuel = obtenirStatutActuel(facture);

      return (
        facture.numero_facture?.toLowerCase().includes(terme) ||
        numeroCommandeFacture(facture).toLowerCase().includes(terme) ||
        nomClientFacture(facture).toLowerCase().includes(terme) ||
        statutActuel.toLowerCase().includes(terme) ||
        libelleStatut(statutActuel).toLowerCase().includes(terme)
      );
    });
  }, [factures, commandes, clients, paiements, recherche]);

  // Statistiques
  const totalFactures = factures.length;

  const facturesPayees = factures.filter(
    (facture) => obtenirStatutActuel(facture) === "PAYEE"
  ).length;

  const facturesPartielles = factures.filter(
    (facture) =>
      obtenirStatutActuel(facture) === "PARTIELLEMENT_PAYEE"
  ).length;

  const facturesNonPayees = factures.filter(
    (facture) => obtenirStatutActuel(facture) === "NON_PAYEE"
  ).length;

  // Générer une facture
  const genererFacture = async (commandeId) => {
    try {
      setActionEnCours(`generation-${commandeId}`);
      setErreur("");
      setMessageSucces("");

      const response = await api.post(
        `/factures/commande/${commandeId}`
      );

      const factureCreee = response.data;

      const commande = commandes.find(
        (element) => Number(element.id) === Number(commandeId)
      );

      const client =
        commande?.client_id != null
          ? clients.find(
              (element) =>
                Number(element.id) === Number(commande.client_id)
            )
          : null;

      await chargerDonnees();

      setFactureAction({
        ...factureCreee,
        emailDisponible: Boolean(client?.email),
        emailClient: client?.email || "",
        nomClient: client
          ? `${client.prenom || ""} ${client.nom || ""}`.trim()
          : "Client de passage",
      });
    } catch (error) {
      gererErreur(error);
      await chargerDonnees();
    } finally {
      setActionEnCours(null);
    }
  };

  // Télécharger une facture PDF
  const telechargerFacture = async (facture) => {
    try {
      setActionEnCours(`pdf-${facture.id}`);
      setErreur("");
      setMessageSucces("");

      const response = await api.get(
        `/factures/${facture.id}/pdf`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data], {
          type: "application/pdf",
        })
      );

      const lien = document.createElement("a");
      lien.href = url;
      lien.download = `${facture.numero_facture}.pdf`;

      document.body.appendChild(lien);
      lien.click();
      document.body.removeChild(lien);

      window.URL.revokeObjectURL(url);

      setMessageSucces("Facture téléchargée avec succès.");
      return true;
    } catch (error) {
      gererErreur(error);
      return false;
    } finally {
      setActionEnCours(null);
    }
  };

  const telechargerFactureCreee = async () => {
    if (!factureAction) return;

    const succes = await telechargerFacture(factureAction);

    if (succes) {
      setFactureAction(null);
    }
  };

  // Envoyer une facture par e-mail
  const envoyerFactureCreee = async () => {
    if (!factureAction || !factureAction.emailDisponible) {
      return;
    }

    try {
      setActionEnCours(`email-${factureAction.id}`);
      setErreur("");
      setMessageSucces("");

      const response = await api.post(
        `/factures/${factureAction.id}/envoyer-email`
      );

      setMessageSucces(
        response.data?.message ||
        "Facture envoyée par e-mail avec succès."
      );

      setFactureAction(null);
    } catch (error) {
      gererErreur(error);
    } finally {
      setActionEnCours(null);
    }
  };

  // Renvoyer une facture
  const renvoyerFacture = async (facture) => {
    const client = trouverClient(facture);

    if (!client?.email) {
      setErreur(
        "Aucune adresse e-mail disponible pour ce client."
      );
      return;
    }

    try {
      setActionEnCours(`email-${facture.id}`);
      setErreur("");
      setMessageSucces("");

      const response = await api.post(
        `/factures/${facture.id}/envoyer-email`
      );

      setMessageSucces(
        response.data?.message ||
        "Facture renvoyée par e-mail avec succès."
      );

      await chargerDonnees();
    } catch (error) {
      gererErreur(error);
    } finally {
      setActionEnCours(null);
    }
  };

  // Afficher les détails
  const afficherDetails = (facture) => {
    setFactureSelectionnee(facture);
    setErreur("");
    setMessageSucces("");
  };

  // Données de la facture sélectionnée
  const commandeDetails = factureSelectionnee
    ? trouverCommande(factureSelectionnee)
    : null;

  const clientDetails = factureSelectionnee
    ? trouverClient(factureSelectionnee)
    : null;

  const paiementsFacture = factureSelectionnee
    ? paiements.filter(
        (paiement) =>
          Number(paiement.commande_id) ===
          Number(factureSelectionnee.commande_id)
      )
    : [];

  const montantPayeDetails = factureSelectionnee
    ? calculerMontantPaye(factureSelectionnee)
    : 0;

  const resteDetails = factureSelectionnee
    ? calculerResteAPayer(factureSelectionnee)
    : 0;

  const fermerFenetreAction = () => setFactureAction(null);
  const fermerDetails = () => setFactureSelectionnee(null);

  const statistiques = [
    {
      titre: "Total des factures",
      valeur: totalFactures,
      icone: FileText,
      couleur: "bg-blue-50 text-blue-600",
      description: "Factures enregistrées",
    },
    {
      titre: "Factures payées",
      valeur: facturesPayees,
      icone: CheckCircle2,
      couleur: "bg-emerald-50 text-emerald-600",
      description: "Paiement complet",
    },
    {
      titre: "Partiellement payées",
      valeur: facturesPartielles,
      icone: Clock3,
      couleur: "bg-amber-50 text-amber-600",
      description: "Paiement en cours",
    },
    {
      titre: "Factures non payées",
      valeur: facturesNonPayees,
      icone: AlertCircle,
      couleur: "bg-rose-50 text-rose-600",
      description: "En attente de paiement",
    },
  ];

  return (
    <div className="w-full min-w-0 space-y-6">

      {/* EN-TÊTE */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
            <Receipt size={17} />
            <span>Gestion commerciale</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
            Gestion des factures
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Générez, consultez et gérez les factures de vos commandes.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            Tableau de bord
          </button>

          <button
            type="button"
            onClick={chargerDonnees}
            disabled={chargement}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={chargement ? "animate-spin" : ""}
            />
            Actualiser
          </button>
        </div>
      </motion.div>

      {/* MESSAGES */}
      <AnimatePresence>
        {messageSucces && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            <CheckCircle2 size={20} />
            <span className="flex-1">{messageSucces}</span>
            <button
              type="button"
              onClick={() => setMessageSucces("")}
              className="rounded-lg p-1 transition hover:bg-emerald-100"
            >
              <X size={17} />
            </button>
          </motion.div>
        )}

        {erreur && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            <AlertCircle size={20} />
            <span className="flex-1">{erreur}</span>
            <button
              type="button"
              onClick={() => setErreur("")}
              className="rounded-lg p-1 transition hover:bg-rose-100"
            >
              <X size={17} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STATISTIQUES */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statistiques.map((stat, index) => {
          const Icone = stat.icone;

          return (
            <motion.div
              key={stat.titre}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {stat.titre}
                  </p>

                  <h2 className="mt-3 text-3xl font-bold text-slate-800">
                    {stat.valeur}
                  </h2>

                  <p className="mt-2 text-xs text-slate-400">
                    {stat.description}
                  </p>
                </div>

                <div className={`rounded-xl p-3 ${stat.couleur}`}>
                  <Icone size={23} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* COMMANDES À FACTURER */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
      >
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <ShoppingCart size={19} />
              </div>

              <h2 className="text-lg font-bold text-slate-800">
                Commandes à facturer
              </h2>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Les commandes qui ne possèdent pas encore de facture.
            </p>
          </div>

          <span className="w-fit rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
            {commandesEligibles.length} commande(s)
          </span>
        </div>

        {chargement ? (
          <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
            <Loader2 className="animate-spin" size={20} />
            Chargement des commandes...
          </div>
        ) : commandesEligibles.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-12 text-center">
            <div className="mb-4 rounded-2xl bg-slate-100 p-4 text-slate-400">
              <FileCheck size={30} />
            </div>

            <h3 className="font-semibold text-slate-700">
              Aucune commande à facturer
            </h3>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              Les nouvelles commandes éligibles apparaîtront automatiquement ici.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">N° Commande</th>
                  <th className="px-5 py-4 font-semibold">Client</th>
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 font-semibold">Montant total</th>
                  <th className="px-5 py-4 font-semibold">Montant payé</th>
                  <th className="px-5 py-4 font-semibold">Reste à payer</th>
                  <th className="px-5 py-4 text-right font-semibold">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {commandesEligibles.map((commande) => {
                  const montantTotal = Number(commande.montant_total || 0);
                  const montantPaye = calculerMontantPayeCommande(commande.id);
                  const resteAPayer = Math.max(0, montantTotal - montantPaye);
                  const generationEnCours =
                    actionEnCours === `generation-${commande.id}`;

                  return (
                    <tr
                      key={commande.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {commande.numero_commande}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {nomClientCommande(commande)}
                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {formaterDate(commande.date_commande)}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-700">
                        {formaterMontant(montantTotal)}
                      </td>

                      <td className="px-5 py-4 text-emerald-700">
                        {formaterMontant(montantPaye)}
                      </td>

                      <td className="px-5 py-4 font-semibold text-amber-700">
                        {formaterMontant(resteAPayer)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => genererFacture(commande.id)}
                          disabled={Boolean(actionEnCours)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {generationEnCours ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <FileText size={15} />
                          )}

                          {generationEnCours ? "Génération..." : "Générer"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>

      {/* FACTURES GÉNÉRÉES */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
      >
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                <Receipt size={19} />
              </div>

              <h2 className="text-lg font-bold text-slate-800">
                Factures générées
              </h2>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Consultez et gérez toutes les factures enregistrées.
            </p>
          </div>

          <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600">
            {facturesFiltrees.length} résultat(s)
          </span>
        </div>

        {/* RECHERCHE */}
        <div className="border-b border-slate-100 p-5">
          <div className="relative max-w-xl">
            <Search
              size={19}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Rechercher une facture, un client ou une commande..."
              value={recherche}
              onChange={(event) => setRecherche(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />

            {recherche && (
              <button
                type="button"
                onClick={() => setRecherche("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
              >
                <X size={17} />
              </button>
            )}
          </div>
        </div>

        {chargement ? (
          <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
            <Loader2 className="animate-spin" size={20} />
            Chargement des factures...
          </div>
        ) : facturesFiltrees.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-12 text-center">
            <div className="mb-4 rounded-2xl bg-slate-100 p-4 text-slate-400">
              <FileText size={30} />
            </div>

            <h3 className="font-semibold text-slate-700">
              Aucune facture trouvée
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {recherche
                ? "Essayez avec un autre terme de recherche."
                : "Les factures générées apparaîtront ici."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">N° Facture</th>
                  <th className="px-5 py-4 font-semibold">Commande</th>
                  <th className="px-5 py-4 font-semibold">Client</th>
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 font-semibold">Montant total</th>
                  <th className="px-5 py-4 font-semibold">Montant payé</th>
                  <th className="px-5 py-4 font-semibold">Reste à payer</th>
                  <th className="px-5 py-4 font-semibold">Statut</th>
                  <th className="px-5 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {facturesFiltrees.map((facture) => {
                  const montantPaye = calculerMontantPaye(facture);
                  const resteAPayer = calculerResteAPayer(facture);
                  const statutActuel = obtenirStatutActuel(facture);
                  const client = trouverClient(facture);

                  const pdfEnCours = actionEnCours === `pdf-${facture.id}`;
                  const emailEnCours = actionEnCours === `email-${facture.id}`;

                  return (
                    <tr
                      key={facture.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {facture.numero_facture}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {numeroCommandeFacture(facture)}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {nomClientFacture(facture)}
                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {formaterDate(facture.date_emission)}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-700">
                        {formaterMontant(facture.montant_total)}
                      </td>

                      <td className="px-5 py-4 font-medium text-emerald-700">
                        {formaterMontant(montantPaye)}
                      </td>

                      <td className="px-5 py-4 font-semibold text-amber-700">
                        {formaterMontant(resteAPayer)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${classeStatut(statutActuel)}`}
                        >
                          {libelleStatut(statutActuel)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            title="Voir les détails"
                            onClick={() => afficherDetails(facture)}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            title="Télécharger le PDF"
                            onClick={() => telechargerFacture(facture)}
                            disabled={Boolean(actionEnCours)}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50"
                          >
                            {pdfEnCours ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Download size={16} />
                            )}
                          </button>

                          {client?.email && (
                            <button
                              type="button"
                              title="Renvoyer par e-mail"
                              onClick={() => renvoyerFacture(facture)}
                              disabled={Boolean(actionEnCours)}
                              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50"
                            >
                              {emailEnCours ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Mail size={16} />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>

      {/* MODALE APRÈS GÉNÉRATION */}
      <AnimatePresence>
        {factureAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={fermerFenetreAction}
            className="fixed inset-0 z-[1100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                  <CheckCircle2 size={28} />
                </div>

                <button
                  type="button"
                  onClick={fermerFenetreAction}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={20} />
                </button>
              </div>

              <h2 className="text-xl font-bold text-slate-800">
                Facture générée avec succès !
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Votre facture a été créée et enregistrée dans le système.
              </p>

              <div className="mt-5 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-slate-500">Numéro de facture</span>
                  <strong className="text-slate-800">
                    {factureAction.numero_facture}
                  </strong>
                </div>

                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-slate-500">Client</span>
                  <strong className="text-right text-slate-800">
                    {factureAction.nomClient}
                  </strong>
                </div>

                {factureAction.emailDisponible && (
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-slate-500">E-mail</span>
                    <strong className="break-all text-right text-slate-800">
                      {factureAction.emailClient}
                    </strong>
                  </div>
                )}
              </div>

              {factureAction.emailDisponible ? (
                <>
                  <p className="mt-5 text-sm font-medium text-slate-700">
                    Que souhaitez-vous faire avec cette facture ?
                  </p>

                  <div className="mt-4 space-y-3">
                    <button
                      type="button"
                      onClick={envoyerFactureCreee}
                      disabled={Boolean(actionEnCours)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                    >
                      {actionEnCours === `email-${factureAction.id}` ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                      Envoyer au client par e-mail
                    </button>

                    <button
                      type="button"
                      onClick={telechargerFactureCreee}
                      disabled={Boolean(actionEnCours)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                    >
                      {actionEnCours === `pdf-${factureAction.id}` ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Download size={18} />
                      )}
                      Télécharger le PDF
                    </button>

                    <button
                      type="button"
                      onClick={fermerFenetreAction}
                      className="w-full rounded-xl px-4 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-50"
                    >
                      Plus tard
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    <Info size={20} className="shrink-0" />
                    <p>
                      Aucune adresse e-mail n'est associée à ce client.
                      Vous pouvez télécharger la facture au format PDF.
                    </p>
                  </div>

                  <div className="mt-5 space-y-3">
                    <button
                      type="button"
                      onClick={telechargerFactureCreee}
                      disabled={Boolean(actionEnCours)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                    >
                      <Download size={18} />
                      Télécharger le PDF
                    </button>

                    <button
                      type="button"
                      onClick={fermerFenetreAction}
                      className="w-full rounded-xl px-4 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-50"
                    >
                      Fermer
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODALE DES DÉTAILS */}
      <AnimatePresence>
        {factureSelectionnee && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={fermerDetails}
            className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
              className="my-auto max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            >
              {/* EN-TÊTE MODALE */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-5 sm:p-6">
                <div>
                  <div className="mb-1 flex items-center gap-2 text-sm font-medium text-blue-600">
                    <Receipt size={17} />
                    Détails de la facture
                  </div>

                  <h2 className="text-xl font-bold text-slate-800">
                    {factureSelectionnee.numero_facture}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={fermerDetails}
                  className="rounded-xl bg-slate-100 p-2.5 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-7 p-5 sm:p-6">

                {/* INFORMATIONS GÉNÉRALES */}
                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <FileText size={19} className="text-blue-600" />
                    <h3 className="font-bold text-slate-800">
                      Informations générales
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-slate-500">Numéro de facture</p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {factureSelectionnee.numero_facture}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Date d'émission</p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {formaterDate(factureSelectionnee.date_emission)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Commande associée</p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {numeroCommandeFacture(factureSelectionnee)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Statut actuel</p>
                      <span
                        className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${classeStatut(obtenirStatutActuel(factureSelectionnee))}`}
                      >
                        {libelleStatut(obtenirStatutActuel(factureSelectionnee))}
                      </span>
                    </div>
                  </div>
                </section>

                {/* CLIENT */}
                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <User size={19} className="text-blue-600" />
                    <h3 className="font-bold text-slate-800">
                      Informations du client
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-100 p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-slate-500">Nom complet</p>
                      <p className="mt-1 font-medium text-slate-800">
                        {clientDetails
                          ? `${clientDetails.prenom || ""} ${clientDetails.nom || ""}`.trim()
                          : "Client de passage"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Téléphone</p>
                      <p className="mt-1 font-medium text-slate-800">
                        {clientDetails?.telephone || "Non renseigné"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Adresse e-mail</p>
                      <p className="mt-1 break-all font-medium text-slate-800">
                        {clientDetails?.email || "Non renseignée"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Adresse</p>
                      <p className="mt-1 font-medium text-slate-800">
                        {clientDetails?.adresse || "Non renseignée"}
                      </p>
                    </div>
                  </div>
                </section>

                {/* COMMANDE */}
                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <ShoppingCart size={19} className="text-blue-600" />
                    <h3 className="font-bold text-slate-800">
                      Informations de la commande
                    </h3>
                  </div>

                  {commandeDetails ? (
                    <>
                      <div className="mb-4 grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
                        <div>
                          <p className="text-xs text-slate-500">Date de commande</p>
                          <p className="mt-1 font-medium text-slate-800">
                            {formaterDate(commandeDetails.date_commande)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">Canal</p>
                          <p className="mt-1 font-medium text-slate-800">
                            {commandeDetails.canal_commande || "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">Statut de commande</p>
                          <p className="mt-1 font-medium text-slate-800">
                            {commandeDetails.statut || "-"}
                          </p>
                        </div>
                      </div>

                      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Package size={17} />
                        Produits commandés
                      </h4>

                      {commandeDetails.details?.length > 0 ? (
                        <div className="overflow-x-auto rounded-xl border border-slate-100">
                          <table className="w-full min-w-[550px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                              <tr>
                                <th className="px-4 py-3 font-semibold">Produit</th>
                                <th className="px-4 py-3 font-semibold">Quantité</th>
                                <th className="px-4 py-3 font-semibold">Prix unitaire</th>
                                <th className="px-4 py-3 font-semibold">Sous-total</th>
                              </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                              {commandeDetails.details.map((detail) => {
                                const produit = trouverProduit(detail.produit_id);

                                return (
                                  <tr key={detail.id}>
                                    <td className="px-4 py-3 font-medium text-slate-700">
                                      {produit?.nom || `Produit #${detail.produit_id}`}
                                    </td>

                                    <td className="px-4 py-3 text-slate-600">
                                      {detail.quantite}
                                    </td>

                                    <td className="px-4 py-3 text-slate-600">
                                      {formaterMontant(detail.prix_unitaire)}
                                    </td>

                                    <td className="px-4 py-3 font-semibold text-slate-800">
                                      {formaterMontant(
                                        detail.sous_total ??
                                        Number(detail.quantite) *
                                          Number(detail.prix_unitaire)
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                          Aucun détail de produit disponible pour cette commande.
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                      Informations de la commande indisponibles.
                    </p>
                  )}
                </section>

                {/* RÉCAPITULATIF FINANCIER */}
                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <CircleDollarSign size={19} className="text-blue-600" />
                    <h3 className="font-bold text-slate-800">
                      Récapitulatif financier
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-100 p-4">
                      <p className="text-xs text-slate-500">Montant total</p>
                      <p className="mt-2 text-lg font-bold text-slate-800">
                        {formaterMontant(factureSelectionnee.montant_total)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                      <p className="text-xs text-emerald-700">Montant payé</p>
                      <p className="mt-2 text-lg font-bold text-emerald-700">
                        {formaterMontant(montantPayeDetails)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                      <p className="text-xs text-amber-700">Reste à payer</p>
                      <p className="mt-2 text-lg font-bold text-amber-700">
                        {formaterMontant(resteDetails)}
                      </p>
                    </div>
                  </div>
                </section>

                {/* HISTORIQUE DES PAIEMENTS */}
                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <CreditCard size={19} className="text-blue-600" />
                    <h3 className="font-bold text-slate-800">
                      Historique des paiements
                    </h3>
                  </div>

                  {paiementsFacture.length === 0 ? (
                    <div className="rounded-xl bg-slate-50 p-5 text-center">
                      <Wallet className="mx-auto mb-2 text-slate-400" size={25} />
                      <p className="text-sm text-slate-500">
                        Aucun paiement enregistré pour cette commande.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full min-w-[600px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Date</th>
                            <th className="px-4 py-3 font-semibold">Montant</th>
                            <th className="px-4 py-3 font-semibold">Mode</th>
                            <th className="px-4 py-3 font-semibold">Référence</th>
                            <th className="px-4 py-3 font-semibold">Statut</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {paiementsFacture.map((paiement) => (
                            <tr key={paiement.id}>
                              <td className="px-4 py-3 text-slate-600">
                                {formaterDate(paiement.date_paiement)}
                              </td>

                              <td className="px-4 py-3 font-semibold text-slate-800">
                                {formaterMontant(paiement.montant)}
                              </td>

                              <td className="px-4 py-3 text-slate-600">
                                {paiement.mode_paiement}
                              </td>

                              <td className="px-4 py-3 text-slate-500">
                                {paiement.reference_paiement || "-"}
                              </td>

                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${classeStatut(paiement.statut)}`}
                                >
                                  {libelleStatut(paiement.statut)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                {/* ACTIONS */}
                <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
                  <button
                    type="button"
                    onClick={fermerDetails}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Fermer
                  </button>

                  <button
                    type="button"
                    onClick={() => telechargerFacture(factureSelectionnee)}
                    disabled={Boolean(actionEnCours)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {actionEnCours === `pdf-${factureSelectionnee.id}` ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <Download size={17} />
                    )}
                    Télécharger le PDF
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Factures;
