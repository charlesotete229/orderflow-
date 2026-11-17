
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ShoppingCart,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  X,
  Save,
  Package,
  User,
  Users,
  Banknote,
  Clock3,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  CalendarDays,
  Tag,
  Minus,
  ClipboardList,
} from "lucide-react";
import api from "../api/axios";

function Commandes() {
  const navigate = useNavigate();

  const [commandes, setCommandes] = useState([]);
  const [clients, setClients] = useState([]);
  const [produits, setProduits] = useState([]);

  const [recherche, setRecherche] = useState("");
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);

  const [erreur, setErreur] = useState("");
  const [messageSucces, setMessageSucces] = useState("");

  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [commandeSelectionnee, setCommandeSelectionnee] = useState(null);
  const [chargementDetails, setChargementDetails] = useState(false);

  const [modeModification, setModeModification] = useState(false);
  const [detailsModification, setDetailsModification] = useState([]);
  const [canalModification, setCanalModification] = useState("GESTIONNAIRE");
  const [enregistrementModification, setEnregistrementModification] =
    useState(false);

  const formulaireInitial = {
    type_client: "ENREGISTRE",
    client_id: "",
    canal_commande: "GESTIONNAIRE",
    details: [{ produit_id: "", quantite: 1 }],
  };

  const [formulaire, setFormulaire] = useState(formulaireInitial);

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

  const verifierAuthentification = (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("utilisateur");
      navigate("/connexion", { replace: true });
      return true;
    }
    return false;
  };

  const formaterMontant = (montant) =>
    Number(montant || 0).toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " F";

  const formaterDate = (date) => {
    if (!date) return "—";

    const valeur = new Date(date);

    if (Number.isNaN(valeur.getTime())) return "—";

    return valeur.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const obtenirNomClient = (commande) => {
    if (commande.client_id === null || commande.client_id === undefined) {
      return "Client de passage";
    }

    const client = clients.find(
      (c) => Number(c.id) === Number(commande.client_id)
    );

    return client
      ? `${client.nom} ${client.prenom || ""}`.trim()
      : "Client introuvable";
  };

  const obtenirStatut = (statut) => {
    const configurations = {
      PAYEE: {
        label: "Payée",
        classe: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
        point: "bg-emerald-500",
      },
      PARTIELLEMENT_PAYEE: {
        label: "Partiellement payée",
        classe: "bg-amber-50 text-amber-700 ring-amber-600/20",
        point: "bg-amber-500",
      },
      ANNULEE: {
        label: "Annulée",
        classe: "bg-rose-50 text-rose-700 ring-rose-600/20",
        point: "bg-rose-500",
      },
      TERMINEE: {
        label: "Terminée",
        classe: "bg-blue-50 text-blue-700 ring-blue-600/20",
        point: "bg-blue-500",
      },
      LIVREE: {
        label: "Livrée",
        classe: "bg-violet-50 text-violet-700 ring-violet-600/20",
        point: "bg-violet-500",
      },
    };

    return (
      configurations[statut] || {
        label: String(statut || "En attente").replaceAll("_", " "),
        classe: "bg-slate-100 text-slate-600 ring-slate-500/20",
        point: "bg-slate-400",
      }
    );
  };

  const commandeModifiable = (commande) => {
    const statutsInterdits = [
      "PAYEE",
      "PARTIELLEMENT_PAYEE",
      "TERMINEE",
      "LIVREE",
      "ANNULEE",
    ];

    return !statutsInterdits.includes(commande.statut);
  };

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur("");

    try {
      const [
        commandesResponse,
        clientsResponse,
        produitsResponse,
      ] = await Promise.all([
        api.get("/commandes/"),
        api.get("/clients/"),
        api.get("/produits/"),
      ]);

      setCommandes(commandesResponse.data);
      setClients(clientsResponse.data);
      setProduits(produitsResponse.data);

      return true;
    } catch (error) {
      console.error("Erreur chargement commandes :", error);

      if (verifierAuthentification(error)) return false;

      setErreur(
        error.response?.data?.detail ||
        "Impossible de récupérer les données des commandes."
      );

      return false;
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  const afficherDetailsCommande = async (commandeId) => {
    setErreur("");
    setMessageSucces("");
    setModeModification(false);
    setChargementDetails(true);

    try {
      const response = await api.get(`/commandes/${commandeId}`);
      setCommandeSelectionnee(response.data);
    } catch (error) {
      console.error("Erreur récupération détails :", error);

      if (!verifierAuthentification(error)) {
        setErreur(
          error.response?.data?.detail ||
          "Impossible de récupérer les détails de cette commande."
        );
      }
    } finally {
      setChargementDetails(false);
    }
  };

  const modifierDetail = (index, champ, valeur) => {
    setFormulaire((ancien) => ({
      ...ancien,
      details: ancien.details.map((detail, i) =>
        i === index ? { ...detail, [champ]: valeur } : detail
      ),
    }));
  };

  const ajouterLigne = () => {
    setFormulaire((ancien) => ({
      ...ancien,
      details: [
        ...ancien.details,
        { produit_id: "", quantite: 1 },
      ],
    }));
  };

  const retirerLigne = (index) => {
    setFormulaire((ancien) => ({
      ...ancien,
      details: ancien.details.filter((_, i) => i !== index),
    }));
  };

  const modifierDetailModification = (index, champ, valeur) => {
    setDetailsModification((anciens) =>
      anciens.map((detail, i) =>
        i === index ? { ...detail, [champ]: valeur } : detail
      )
    );
  };

  const ajouterLigneModification = () => {
    setDetailsModification((anciens) => [
      ...anciens,
      { produit_id: "", quantite: 1 },
    ]);
  };

  const retirerLigneModification = (index) => {
    setDetailsModification((anciens) =>
      anciens.filter((_, i) => i !== index)
    );
  };

  const calculerMontant = (details) =>
    details.reduce((total, detail) => {
      const produit = produits.find(
        (p) => Number(p.id) === Number(detail.produit_id)
      );

      if (!produit) return total;

      return (
        total +
        Number(produit.prix_unitaire) * Number(detail.quantite || 0)
      );
    }, 0);

  const montantEstime = useMemo(
    () => calculerMontant(formulaire.details),
    [formulaire.details, produits]
  );

  const montantModification = useMemo(
    () => calculerMontant(detailsModification),
    [detailsModification, produits]
  );

  const validerDetails = (details) => {
    if (details.length === 0) {
      return "Une commande doit contenir au moins un produit.";
    }

    if (
      details.some(
        (detail) =>
          !detail.produit_id ||
          !Number.isInteger(Number(detail.quantite)) ||
          Number(detail.quantite) < 1
      )
    ) {
      return "Veuillez sélectionner les produits et saisir des quantités valides.";
    }

    const produitsSelectionnes = details.map(
      (detail) => Number(detail.produit_id)
    );

    if (new Set(produitsSelectionnes).size !== produitsSelectionnes.length) {
      return "Un même produit ne peut pas être ajouté plusieurs fois.";
    }

    return "";
  };

  const enregistrerCommande = async (e) => {
    e.preventDefault();

    setErreur("");
    setMessageSucces("");

    if (
      formulaire.type_client === "ENREGISTRE" &&
      !formulaire.client_id
    ) {
      setErreur("Veuillez sélectionner un client.");
      return;
    }

    const erreurDetails = validerDetails(formulaire.details);

    if (erreurDetails) {
      setErreur(erreurDetails);
      return;
    }

    setEnregistrement(true);

    try {
      const donnees = {
        client_id:
          formulaire.type_client === "ENREGISTRE"
            ? Number(formulaire.client_id)
            : null,
        canal_commande: formulaire.canal_commande,
        details: formulaire.details.map((detail) => ({
          produit_id: Number(detail.produit_id),
          quantite: Number(detail.quantite),
        })),
      };

      await api.post("/commandes/", donnees);

      setFormulaire(formulaireInitial);
      setAfficherFormulaire(false);

      const resultat = await chargerDonnees();

      if (resultat) {
        setMessageSucces("La commande a été enregistrée avec succès.");
      }
    } catch (error) {
      console.error("Erreur enregistrement commande :", error);

      if (!verifierAuthentification(error)) {
        setErreur(
          error.response?.data?.detail ||
          "Impossible d'enregistrer la commande."
        );
      }
    } finally {
      setEnregistrement(false);
    }
  };

  const commencerModification = () => {
    if (!commandeSelectionnee) return;

    if (!commandeModifiable(commandeSelectionnee)) {
      setErreur("Cette commande ne peut pas être modifiée.");
      return;
    }

    setErreur("");
    setMessageSucces("");

    setDetailsModification(
      commandeSelectionnee.details.map((detail) => ({
        produit_id: String(detail.produit_id),
        quantite: Number(detail.quantite),
      }))
    );

    setCanalModification(commandeSelectionnee.canal_commande);
    setModeModification(true);
  };

  const enregistrerModification = async (e) => {
    e.preventDefault();

    if (!commandeSelectionnee) return;

    setErreur("");
    setMessageSucces("");

    const erreurDetails = validerDetails(detailsModification);

    if (erreurDetails) {
      setErreur(erreurDetails);
      return;
    }

    setEnregistrementModification(true);

    try {
      const donnees = {
        canal_commande: canalModification,
        details: detailsModification.map((detail) => ({
          produit_id: Number(detail.produit_id),
          quantite: Number(detail.quantite),
        })),
      };

      await api.put(
        `/commandes/${commandeSelectionnee.id}`,
        donnees
      );

      const commandeResponse = await api.get(
        `/commandes/${commandeSelectionnee.id}`
      );

      setCommandeSelectionnee(commandeResponse.data);
      setModeModification(false);

      const resultat = await chargerDonnees();

      if (resultat) {
        setMessageSucces("La commande a été modifiée avec succès.");
      }
    } catch (error) {
      console.error("Erreur modification commande :", error);

      if (!verifierAuthentification(error)) {
        setErreur(
          error.response?.data?.detail ||
          "Impossible de modifier cette commande."
        );
      }
    } finally {
      setEnregistrementModification(false);
    }
  };

  const commandesFiltrees = useMemo(() => {
    const terme = recherche.toLowerCase().trim();

    return commandes.filter((commande) => {
      const numero = (commande.numero_commande || "").toLowerCase();
      const client = obtenirNomClient(commande).toLowerCase();

      return numero.includes(terme) || client.includes(terme);
    });
  }, [commandes, recherche, clients]);

  const commandesEnAttente = commandes.filter(
    (c) => ![
      "PAYEE",
      "PARTIELLEMENT_PAYEE",
      "TERMINEE",
      "LIVREE",
      "ANNULEE",
    ].includes(c.statut)
  ).length;

  const commandesPayees = commandes.filter(
    (c) => c.statut === "PAYEE"
  ).length;

  const montantTotal = commandes.reduce(
    (total, commande) => total + Number(commande.montant_total || 0),
    0
  );

  const statistiques = [
    {
      titre: "Total commandes",
      valeur: commandes.length,
      description: "Toutes les commandes",
      icone: ShoppingCart,
      couleur: "blue",
      fond: "bg-blue-50",
      texte: "text-blue-600",
    },
    {
      titre: "En attente",
      valeur: commandesEnAttente,
      description: "Commandes non réglées",
      icone: Clock3,
      couleur: "amber",
      fond: "bg-amber-50",
      texte: "text-amber-600",
    },
    {
      titre: "Commandes payées",
      valeur: commandesPayees,
      description: "Commandes entièrement réglées",
      icone: CheckCircle2,
      couleur: "emerald",
      fond: "bg-emerald-50",
      texte: "text-emerald-600",
    },
    {
      titre: "Montant des commandes",
      valeur: formaterMontant(montantTotal),
      description: "Montant total enregistré",
      icone: Banknote,
      couleur: "violet",
      fond: "bg-violet-50",
      texte: "text-violet-600",
    },
  ];

  const fermerDetails = () => {
    setCommandeSelectionnee(null);
    setModeModification(false);
    setErreur("");
  };

  const produitsDisponibles = (details, index) =>
    produits.filter(
      (produit) =>
        produit.actif &&
        !details.some(
          (detail, i) =>
            i !== index &&
            Number(detail.produit_id) === Number(produit.id)
        )
    );

  const rendreLignesProduits = (
    details,
    modifier,
    retirer,
    detailsComplets
  ) => (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {details.map((detail, index) => {
          const produit = produits.find(
            (p) => Number(p.id) === Number(detail.produit_id)
          );

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -12 }}
              className="grid grid-cols-1 items-end gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-[1fr_140px_44px]"
            >
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-600">
                  Produit {index + 1}
                </label>

                <select
                  required
                  value={detail.produit_id}
                  onChange={(e) =>
                    modifier(index, "produit_id", e.target.value)
                  }
                  className={inputClass}
                >
                  <option value="">Sélectionner un produit</option>

                  {produitsDisponibles(details, index).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom} — Stock : {p.quantite_stock}
                    </option>
                  ))}
                </select>

                {produit && (
                  <p className="mt-1 text-xs text-slate-500">
                    Prix unitaire : {formaterMontant(produit.prix_unitaire)}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-600">
                  Quantité
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={detail.quantite}
                  onChange={(e) =>
                    modifier(index, "quantite", Number(e.target.value))
                  }
                  className={inputClass}
                />
              </div>

              <button
                type="button"
                title="Retirer ce produit"
                disabled={detailsComplets.length <= 1}
                onClick={() => retirer(index)}
                className="flex h-11 items-center justify-center rounded-xl border border-rose-200 text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Trash2 size={17} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="w-full min-w-0 space-y-6">

      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
            <ShoppingCart size={17} />
            <span>Ventes</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
            Gestion des commandes
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Créez, consultez et gérez les commandes de votre boutique.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={chargerDonnees}
            disabled={chargement}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={chargement ? "animate-spin" : ""}
            />
            Actualiser
          </button>

          <button
            type="button"
            onClick={() => {
              setAfficherFormulaire((ancien) => !ancien);
              setErreur("");
              setMessageSucces("");
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            {afficherFormulaire ? <X size={17} /> : <Plus size={17} />}
            {afficherFormulaire ? "Fermer" : "Nouvelle commande"}
          </button>
        </div>
      </motion.div>

      {/* Messages */}
      <AnimatePresence>
        {messageSucces && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            <CheckCircle2 size={19} />
            <span>{messageSucces}</span>
            <button
              type="button"
              onClick={() => setMessageSucces("")}
              className="ml-auto"
            >
              <X size={17} />
            </button>
          </motion.div>
        )}

        {erreur && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            <AlertCircle size={19} />
            <span>{erreur}</span>
            <button
              type="button"
              onClick={() => setErreur("")}
              className="ml-auto"
            >
              <X size={17} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Statistiques */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statistiques.map((stat, index) => {
          const Icone = stat.icone;

          return (
            <motion.div
              key={stat.titre}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-500">
                    {stat.titre}
                  </p>

                  <h2 className="mt-3 break-words text-2xl font-bold text-slate-800">
                    {stat.valeur}
                  </h2>
                </div>

                <div className={`shrink-0 rounded-xl p-3 ${stat.fond} ${stat.texte}`}>
                  <Icone size={22} />
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-400">
                {stat.description}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Formulaire de création */}
      <AnimatePresence>
        {afficherFormulaire && (
          <motion.section
            initial={{ opacity: 0, height: 0, y: 15 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                <ShoppingBag size={21} />
              </div>

              <div>
                <h2 className="font-bold text-slate-800">
                  Nouvelle commande
                </h2>
                <p className="text-xs text-slate-500">
                  Renseignez le client et les produits commandés.
                </p>
              </div>
            </div>

            <form onSubmit={enregistrerCommande} className="space-y-6 p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Type de client
                  </label>

                  <select
                    value={formulaire.type_client}
                    onChange={(e) =>
                      setFormulaire((ancien) => ({
                        ...ancien,
                        type_client: e.target.value,
                        client_id: "",
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="ENREGISTRE">Client enregistré</option>
                    <option value="PASSAGE">Client de passage</option>
                  </select>
                </div>

                {formulaire.type_client === "ENREGISTRE" ? (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Client *
                    </label>

                    <select
                      required
                      value={formulaire.client_id}
                      onChange={(e) =>
                        setFormulaire((ancien) => ({
                          ...ancien,
                          client_id: e.target.value,
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="">Sélectionner un client</option>

                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.nom} {client.prenom}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <User size={22} className="shrink-0 text-blue-600" />
                    <div>
                      <p className="text-sm font-semibold text-blue-800">
                        Client de passage
                      </p>
                      <p className="text-xs text-blue-600">
                        Aucune fiche client ne sera créée.
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Canal de commande
                  </label>

                  <select
                    value={formulaire.canal_commande}
                    onChange={(e) =>
                      setFormulaire((ancien) => ({
                        ...ancien,
                        canal_commande: e.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="GESTIONNAIRE">Gestionnaire</option>
                    <option value="EN_LIGNE">En ligne</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-800">
                      Produits commandés
                    </h3>
                    <p className="text-xs text-slate-500">
                      Ajoutez les produits et leurs quantités.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={ajouterLigne}
                    className="flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                  >
                    <Plus size={16} />
                    Ajouter un produit
                  </button>
                </div>

                {rendreLignesProduits(
                  formulaire.details,
                  modifierDetail,
                  retirerLigne,
                  formulaire.details
                )}
              </div>

              <div className="flex flex-col justify-between gap-4 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Montant total estimé
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-800">
                    {formaterMontant(montantEstime)}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={enregistrement}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {enregistrement ? (
                    <RefreshCw size={17} className="animate-spin" />
                  ) : (
                    <Save size={17} />
                  )}

                  {enregistrement ? "Enregistrement..." : "Enregistrer la commande"}
                </button>
              </div>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Liste des commandes */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
      >
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Historique des commandes
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {commandesFiltrees.length} résultat(s) sur {commandes.length} commande(s)
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              placeholder="Numéro ou nom du client..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className={`${inputClass} pl-10`}
            />
          </div>
        </div>

        {chargement ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <RefreshCw size={28} className="animate-spin text-blue-600" />
            <p className="text-sm text-slate-500">
              Chargement des commandes...
            </p>
          </div>
        ) : commandesFiltrees.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <div className="mb-4 rounded-2xl bg-slate-100 p-5 text-slate-400">
              <ClipboardList size={34} />
            </div>

            <h3 className="font-semibold text-slate-700">
              {recherche ? "Aucun résultat trouvé" : "Aucune commande enregistrée"}
            </h3>

            <p className="mt-2 max-w-sm text-sm text-slate-500">
              {recherche
                ? "Aucune commande ne correspond à votre recherche."
                : "Les nouvelles commandes apparaîtront ici."}
            </p>

            {!recherche && (
              <button
                type="button"
                onClick={() => setAfficherFormulaire(true)}
                className="mt-5 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Plus size={17} />
                Nouvelle commande
              </button>
            )}
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[950px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Commande</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Montant</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Canal</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                <AnimatePresence>
                  {commandesFiltrees.map((commande) => {
                    const statut = obtenirStatut(commande.statut);

                    return (
                      <motion.tr
                        key={commande.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                              <ShoppingBag size={19} />
                            </div>
                            <span className="font-semibold text-slate-800">
                              {commande.numero_commande}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <User size={15} className="text-slate-400" />
                            {obtenirNomClient(commande)}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-500">
                          {formaterDate(commande.date_commande)}
                        </td>

                        <td className="px-6 py-4 font-semibold text-slate-700">
                          {formaterMontant(commande.montant_total)}
                        </td>

                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${statut.classe}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${statut.point}`} />
                            {statut.label}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-xs font-medium text-slate-500">
                          {String(commande.canal_commande || "").replaceAll("_", " ")}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              title="Voir les détails"
                              disabled={chargementDetails}
                              onClick={() => afficherDetailsCommande(commande.id)}
                              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
                            >
                              <Eye size={15} />
                              Voir
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {!chargement && commandesFiltrees.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-3">
            <p className="text-xs text-slate-500">
              Affichage de {commandesFiltrees.length} commande(s)
            </p>
          </div>
        )}
      </motion.section>

      {/* Fenêtre des détails */}
      <AnimatePresence>
        {(commandeSelectionnee || chargementDetails) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6"
            onClick={(e) => {
              if (e.target === e.currentTarget && !chargementDetails) {
                fermerDetails();
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 25, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="my-auto w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              {chargementDetails ? (
                <div className="flex flex-col items-center gap-3 py-20">
                  <RefreshCw size={30} className="animate-spin text-blue-600" />
                  <p className="text-sm text-slate-500">
                    Chargement des détails...
                  </p>
                </div>
              ) : commandeSelectionnee && (
                <>
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-blue-600">
                        Détail de la commande
                      </p>
                      <h2 className="mt-1 text-lg font-bold text-slate-800">
                        {commandeSelectionnee.numero_commande}
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={fermerDetails}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X size={21} />
                    </button>
                  </div>

                  <div className="max-h-[75vh] space-y-5 overflow-y-auto p-5 sm:p-6">
                    {erreur && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                        {erreur}
                      </div>
                    )}

                    {messageSucces && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                        {messageSucces}
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        {
                          label: "Client",
                          valeur: obtenirNomClient(commandeSelectionnee),
                          icone: User,
                        },
                        {
                          label: "Date",
                          valeur: formaterDate(commandeSelectionnee.date_commande),
                          icone: CalendarDays,
                        },
                        {
                          label: "Statut",
                          valeur: obtenirStatut(commandeSelectionnee.statut).label,
                          icone: CheckCircle2,
                        },
                        {
                          label: "Canal",
                          valeur: String(commandeSelectionnee.canal_commande || "").replaceAll("_", " "),
                          icone: Tag,
                        },
                      ].map((info) => {
                        const Icone = info.icone;

                        return (
                          <div key={info.label} className="rounded-xl bg-slate-50 p-4">
                            <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
                              <Icone size={15} />
                              {info.label}
                            </div>
                            <p className="break-words text-sm font-semibold text-slate-700">
                              {info.valeur}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {!modeModification ? (
                      <>
                        <div>
                          <h3 className="mb-3 font-bold text-slate-800">
                            Produits de la commande
                          </h3>

                          <div className="overflow-x-auto rounded-xl border border-slate-100">
                            <table className="w-full min-w-[600px] text-left">
                              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                                <tr>
                                  <th className="px-4 py-3">Produit</th>
                                  <th className="px-4 py-3">Quantité</th>
                                  <th className="px-4 py-3">Prix unitaire</th>
                                  <th className="px-4 py-3">Sous-total</th>
                                </tr>
                              </thead>

                              <tbody className="divide-y divide-slate-100">
                                {commandeSelectionnee.details.map((detail) => {
                                  const produit = produits.find(
                                    (p) => Number(p.id) === Number(detail.produit_id)
                                  );

                                  return (
                                    <tr key={detail.id}>
                                      <td className="px-4 py-3 text-sm font-medium text-slate-700">
                                        {produit?.nom || "Produit introuvable"}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-slate-600">
                                        {detail.quantite}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-slate-600">
                                        {formaterMontant(detail.prix_unitaire)}
                                      </td>
                                      <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                                        {formaterMontant(detail.sous_total)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="flex flex-col justify-between gap-4 rounded-xl bg-blue-50 p-4 sm:flex-row sm:items-center">
                          <div>
                            <p className="text-xs font-medium text-blue-600">
                              Montant total de la commande
                            </p>
                            <p className="mt-1 text-2xl font-bold text-slate-800">
                              {formaterMontant(commandeSelectionnee.montant_total)}
                            </p>
                          </div>

                          {commandeModifiable(commandeSelectionnee) && (
                            <button
                              type="button"
                              onClick={commencerModification}
                              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                              <Pencil size={16} />
                              Modifier la commande
                            </button>
                          )}
                        </div>

                        {!commandeModifiable(commandeSelectionnee) && (
                          <p className="text-xs text-slate-500">
                            Cette commande ne peut plus être modifiée en raison de son statut.
                          </p>
                        )}
                      </>
                    ) : (
                      <form onSubmit={enregistrerModification} className="space-y-5">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Canal de commande
                          </label>

                          <select
                            required
                            value={canalModification}
                            onChange={(e) => setCanalModification(e.target.value)}
                            className={inputClass}
                          >
                            <option value="GESTIONNAIRE">Gestionnaire</option>
                            <option value="EN_LIGNE">En ligne</option>
                          </select>
                        </div>

                        <div className="border-t border-slate-100 pt-5">
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <h3 className="font-bold text-slate-800">
                              Produits de la commande
                            </h3>

                            <button
                              type="button"
                              onClick={ajouterLigneModification}
                              className="flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                            >
                              <Plus size={16} />
                              Ajouter un produit
                            </button>
                          </div>

                          {rendreLignesProduits(
                            detailsModification,
                            modifierDetailModification,
                            retirerLigneModification,
                            detailsModification
                          )}
                        </div>

                        <div className="flex flex-col justify-between gap-4 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center">
                          <div>
                            <p className="text-xs text-slate-500">
                              Nouveau total estimé
                            </p>
                            <p className="mt-1 text-xl font-bold text-slate-800">
                              {formaterMontant(montantModification)}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={enregistrementModification}
                              onClick={() => {
                                setModeModification(false);
                                setErreur("");
                              }}
                              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                            >
                              Annuler
                            </button>

                            <button
                              type="submit"
                              disabled={enregistrementModification}
                              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                            >
                              {enregistrementModification ? (
                                <RefreshCw size={16} className="animate-spin" />
                              ) : (
                                <Save size={16} />
                              )}
                              Enregistrer
                            </button>
                          </div>
                        </div>
                      </form>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Commandes;
