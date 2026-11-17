
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Banknote,
  Wallet,
  Clock3,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  X,
  Plus,
  User,
  ShoppingCart,
  CalendarDays,
  CreditCard,
  History,
  Receipt,
  ArrowUpRight,
  Save,
  Smartphone,
  Building2,
  CircleDollarSign,
} from "lucide-react";
import api from "../api/axios";

function Paiements() {
  const navigate = useNavigate();
  const formulaireRef = useRef(null);

  const [paiements, setPaiements] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [clients, setClients] = useState([]);

  const [recherche, setRecherche] = useState("");
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);

  const [erreur, setErreur] = useState("");
  const [messageSucces, setMessageSucces] = useState("");

  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [historique, setHistorique] = useState(null);
  const [chargementHistorique, setChargementHistorique] = useState(false);

  const formulaireInitial = {
    commande_id: "",
    montant: "",
    mode_paiement: "ESPECES",
    reference_paiement: "",
  };

  const [formulaire, setFormulaire] = useState(formulaireInitial);

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

  useEffect(() => {
    if (afficherFormulaire && formulaireRef.current) {
      formulaireRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [afficherFormulaire]);

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
    if (!date) return "Date inconnue";

    const valeur = new Date(date);

    if (Number.isNaN(valeur.getTime())) return "Date inconnue";

    return valeur.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const trouverCommande = (commandeId) =>
    commandes.find(
      (commande) => Number(commande.id) === Number(commandeId)
    );

  const trouverClient = (clientId) => {
    if (clientId === null || clientId === undefined) return null;

    return clients.find(
      (client) => Number(client.id) === Number(clientId)
    );
  };

  const nomClientCommande = (commande) => {
    if (!commande) return "Client inconnu";

    if (commande.client_id === null || commande.client_id === undefined) {
      return "Client de passage";
    }

    const client = trouverClient(commande.client_id);

    return client
      ? `${client.prenom || ""} ${client.nom || ""}`.trim()
      : "Client introuvable";
  };

  const calculerTotalPaye = (commandeId) =>
    paiements
      .filter(
        (paiement) =>
          Number(paiement.commande_id) === Number(commandeId) &&
          paiement.statut === "VALIDE"
      )
      .reduce(
        (total, paiement) => total + Number(paiement.montant || 0),
        0
      );

  const calculerSolde = (commande) => {
    if (!commande) return 0;

    return Math.max(
      0,
      Number(commande.montant_total || 0) -
        calculerTotalPaye(commande.id)
    );
  };

  const obtenirStatutPaiement = (statut) => {
    if (statut === "VALIDE") {
      return {
        label: "Validé",
        classe: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
        point: "bg-emerald-500",
      };
    }

    if (statut === "ANNULE" || statut === "ANNULEE") {
      return {
        label: "Annulé",
        classe: "bg-rose-50 text-rose-700 ring-rose-600/20",
        point: "bg-rose-500",
      };
    }

    return {
      label: String(statut || "En attente").replaceAll("_", " "),
      classe: "bg-amber-50 text-amber-700 ring-amber-600/20",
      point: "bg-amber-500",
    };
  };

  const obtenirModePaiement = (mode) => {
    const modes = {
      ESPECES: "Espèces",
      MOBILE_MONEY: "Mobile Money",
      VIREMENT: "Virement bancaire",
    };

    return modes[mode] || String(mode || "Non renseigné").replaceAll("_", " ");
  };

  const obtenirIconeMode = (mode) => {
    if (mode === "MOBILE_MONEY") return Smartphone;
    if (mode === "VIREMENT") return Building2;
    return Banknote;
  };

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur("");

    try {
      const [
        paiementsResponse,
        commandesResponse,
        clientsResponse,
      ] = await Promise.all([
        api.get("/paiements/"),
        api.get("/commandes/"),
        api.get("/clients/"),
      ]);

      setPaiements(paiementsResponse.data);
      setCommandes(commandesResponse.data);
      setClients(clientsResponse.data);

      return true;
    } catch (error) {
      console.error("Erreur chargement paiements :", error);

      if (verifierAuthentification(error)) return false;

      setErreur(
        error.response?.data?.detail ||
          "Impossible de récupérer les données des paiements."
      );

      return false;
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  const commandeFormulaire = trouverCommande(formulaire.commande_id);

  const soldeFormulaire = commandeFormulaire
    ? calculerSolde(commandeFormulaire)
    : 0;

  const commandesAPayer = useMemo(
    () =>
      commandes.filter(
        (commande) =>
          commande.statut !== "ANNULEE" &&
          calculerSolde(commande) > 0
      ),
    [commandes, paiements]
  );

  const totalEncaisse = useMemo(
    () =>
      paiements
        .filter((paiement) => paiement.statut === "VALIDE")
        .reduce(
          (total, paiement) => total + Number(paiement.montant || 0),
          0
        ),
    [paiements]
  );

  const commandesPartiellementPayees = commandes.filter(
    (commande) => commande.statut === "PARTIELLEMENT_PAYEE"
  ).length;

  const commandesEnAttente = commandes.filter(
    (commande) => commande.statut === "EN_ATTENTE"
  ).length;

  const paiementsFiltres = useMemo(() => {
    const terme = recherche.toLowerCase().trim();

    return paiements.filter((paiement) => {
      const commande = trouverCommande(paiement.commande_id);
      const nomClient = nomClientCommande(commande).toLowerCase();

      return (
        String(paiement.id).includes(terme) ||
        String(paiement.commande_id).includes(terme) ||
        (commande?.numero_commande || "").toLowerCase().includes(terme) ||
        nomClient.includes(terme) ||
        (paiement.mode_paiement || "").toLowerCase().includes(terme) ||
        (paiement.reference_paiement || "").toLowerCase().includes(terme)
      );
    });
  }, [paiements, commandes, clients, recherche]);

  const ouvrirFormulairePaiement = (commande) => {
    setErreur("");
    setMessageSucces("");
    setHistorique(null);

    setFormulaire({
      ...formulaireInitial,
      commande_id: String(commande.id),
    });

    setAfficherFormulaire(true);
  };

  const fermerFormulaire = () => {
    setAfficherFormulaire(false);
    setFormulaire(formulaireInitial);
    setErreur("");
  };

  const enregistrerPaiement = async (e) => {
    e.preventDefault();

    setErreur("");
    setMessageSucces("");

    if (!formulaire.commande_id) {
      setErreur("Veuillez sélectionner une commande.");
      return;
    }

    const montant = Number(formulaire.montant);

    if (!Number.isFinite(montant) || montant <= 0) {
      setErreur("Veuillez saisir un montant valide.");
      return;
    }

    if (montant > soldeFormulaire) {
      setErreur(
        `Le montant dépasse le solde restant de ${formaterMontant(soldeFormulaire)}.`
      );
      return;
    }

    setEnregistrement(true);

    try {
      const donnees = {
        commande_id: Number(formulaire.commande_id),
        montant: montant.toFixed(2),
        mode_paiement: formulaire.mode_paiement,
        reference_paiement:
          formulaire.reference_paiement.trim() || null,
      };

      await api.post("/paiements/", donnees);

      const chargementReussi = await chargerDonnees();

      if (chargementReussi) {
        setMessageSucces("Le paiement a été enregistré avec succès.");
        setFormulaire(formulaireInitial);
        setAfficherFormulaire(false);
      }
    } catch (error) {
      console.error("Erreur enregistrement paiement :", error);

      if (!verifierAuthentification(error)) {
        setErreur(
          error.response?.data?.detail ||
            "Impossible d'enregistrer le paiement."
        );
      }
    } finally {
      setEnregistrement(false);
    }
  };

  const consulterHistorique = async (commandeId) => {
    setErreur("");
    setMessageSucces("");
    setChargementHistorique(true);

    try {
      const response = await api.get(
        `/paiements/commande/${commandeId}`
      );

      setHistorique({
        commandeId,
        paiements: response.data,
      });
    } catch (error) {
      console.error("Erreur historique paiements :", error);

      if (!verifierAuthentification(error)) {
        setErreur(
          error.response?.data?.detail ||
            "Impossible de récupérer l'historique."
        );
      }
    } finally {
      setChargementHistorique(false);
    }
  };

  const statistiques = [
    {
      titre: "Total encaissé",
      valeur: formaterMontant(totalEncaisse),
      description: "Somme des paiements validés",
      icone: CircleDollarSign,
      fond: "bg-emerald-50",
      texte: "text-emerald-600",
    },
    {
      titre: "Commandes partiellement payées",
      valeur: commandesPartiellementPayees,
      description: "Commandes avec un paiement partiel",
      icone: Wallet,
      fond: "bg-amber-50",
      texte: "text-amber-600",
    },
    {
      titre: "Commandes en attente",
      valeur: commandesEnAttente,
      description: "Commandes en attente de règlement",
      icone: Clock3,
      fond: "bg-blue-50",
      texte: "text-blue-600",
    },
    {
      titre: "Paiements enregistrés",
      valeur: paiements.length,
      description: "Nombre total de transactions",
      icone: Receipt,
      fond: "bg-violet-50",
      texte: "text-violet-600",
    },
  ];

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
            <Wallet size={17} />
            <span>Finance</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
            Gestion des paiements
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Enregistrez et suivez les règlements de vos commandes.
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
              setErreur("");
              setMessageSucces("");
              setAfficherFormulaire((ancien) => !ancien);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            {afficherFormulaire ? <X size={17} /> : <Plus size={17} />}
            {afficherFormulaire ? "Fermer" : "Nouveau paiement"}
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

      {/* Formulaire */}
      <AnimatePresence>
        {afficherFormulaire && (
          <motion.section
            ref={formulaireRef}
            initial={{ opacity: 0, height: 0, y: 15 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            style={{ scrollMarginTop: "20px" }}
            className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                  <CreditCard size={21} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-800">
                    Enregistrer un paiement
                  </h2>
                  <p className="text-xs text-slate-500">
                    Renseignez les informations du règlement.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={fermerFormulaire}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={enregistrerPaiement}
              className="space-y-5 p-5 sm:p-6"
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Commande *
                  </label>

                  <select
                    required
                    value={formulaire.commande_id}
                    onChange={(e) =>
                      setFormulaire({
                        ...formulaire,
                        commande_id: e.target.value,
                        montant: "",
                      })
                    }
                    className={inputClass}
                  >
                    <option value="">Sélectionner une commande</option>

                    {commandesAPayer.map((commande) => (
                      <option key={commande.id} value={commande.id}>
                        {commande.numero_commande} — {nomClientCommande(commande)} — Solde :{" "}
                        {formaterMontant(calculerSolde(commande))}
                      </option>
                    ))}
                  </select>
                </div>

                {commandeFormulaire && (
                  <div className="md:col-span-2 grid grid-cols-1 gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-xs text-slate-500">Client</p>
                      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                        {nomClientCommande(commandeFormulaire)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Montant total</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {formaterMontant(commandeFormulaire.montant_total)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Déjà payé</p>
                      <p className="mt-1 text-sm font-semibold text-emerald-700">
                        {formaterMontant(
                          calculerTotalPaye(commandeFormulaire.id)
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Solde restant</p>
                      <p className="mt-1 text-sm font-bold text-rose-600">
                        {formaterMontant(soldeFormulaire)}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Montant du paiement (F) *
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    max={soldeFormulaire || undefined}
                    value={formulaire.montant}
                    onChange={(e) =>
                      setFormulaire({
                        ...formulaire,
                        montant: e.target.value,
                      })
                    }
                    placeholder="Exemple : 15000"
                    className={inputClass}
                  />

                  {commandeFormulaire && (
                    <p className="mt-1 text-xs text-slate-400">
                      Maximum autorisé : {formaterMontant(soldeFormulaire)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Mode de paiement *
                  </label>

                  <select
                    required
                    value={formulaire.mode_paiement}
                    onChange={(e) =>
                      setFormulaire({
                        ...formulaire,
                        mode_paiement: e.target.value,
                      })
                    }
                    className={inputClass}
                  >
                    <option value="ESPECES">Espèces</option>
                    <option value="MOBILE_MONEY">Mobile Money</option>
                    <option value="VIREMENT">Virement bancaire</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Référence du paiement
                    <span className="ml-1 font-normal text-slate-400">
                      (facultatif)
                    </span>
                  </label>

                  <input
                    type="text"
                    maxLength="100"
                    value={formulaire.reference_paiement}
                    onChange={(e) =>
                      setFormulaire({
                        ...formulaire,
                        reference_paiement: e.target.value,
                      })
                    }
                    placeholder="Numéro de transaction ou référence"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex flex-col justify-between gap-4 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Montant à enregistrer
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-800">
                    {formaterMontant(formulaire.montant)}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={enregistrement || !formulaire.commande_id}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {enregistrement ? (
                    <RefreshCw size={17} className="animate-spin" />
                  ) : (
                    <Save size={17} />
                  )}

                  {enregistrement
                    ? "Enregistrement..."
                    : "Valider le paiement"}
                </button>
              </div>
            </form>
          </motion.section>
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

      {/* Commandes à régler */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
      >
        <div className="border-b border-slate-100 p-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
              <Clock3 size={21} />
            </div>

            <div>
              <h2 className="font-bold text-slate-800">
                Commandes à régler
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {commandesAPayer.length} commande(s) avec un solde restant.
              </p>
            </div>
          </div>
        </div>

        {chargement ? (
          <div className="flex items-center justify-center gap-3 py-14 text-sm text-slate-500">
            <RefreshCw size={20} className="animate-spin text-blue-600" />
            Chargement des commandes...
          </div>
        ) : commandesAPayer.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
            <div className="mb-4 rounded-2xl bg-emerald-50 p-5 text-emerald-600">
              <CheckCircle2 size={34} />
            </div>

            <h3 className="font-semibold text-slate-700">
              Aucune commande à régler
            </h3>

            <p className="mt-2 max-w-sm text-sm text-slate-500">
              Les nouvelles commandes apparaîtront automatiquement ici.
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Commande</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Montant total</th>
                  <th className="px-6 py-4">Déjà payé</th>
                  <th className="px-6 py-4">Solde restant</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {commandesAPayer.map((commande) => (
                  <tr
                    key={commande.id}
                    className="transition hover:bg-slate-50/80"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <ShoppingCart size={18} />
                        </div>

                        <span className="font-semibold text-slate-800">
                          {commande.numero_commande}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {nomClientCommande(commande)}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formaterMontant(commande.montant_total)}
                    </td>

                    <td className="px-6 py-4 text-sm font-medium text-emerald-700">
                      {formaterMontant(calculerTotalPaye(commande.id))}
                    </td>

                    <td className="px-6 py-4 text-sm font-bold text-rose-600">
                      {formaterMontant(calculerSolde(commande))}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => ouvrirFormulairePaiement(commande)}
                          className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                        >
                          <Plus size={15} />
                          Enregistrer un paiement
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>

      {/* Historique global */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
      >
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600">
              <History size={21} />
            </div>

            <div>
              <h2 className="font-bold text-slate-800">
                Historique des paiements
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {paiementsFiltres.length} résultat(s) sur {paiements.length} paiement(s).
              </p>
            </div>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              placeholder="Rechercher un paiement..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className={`${inputClass} pl-10`}
            />
          </div>
        </div>

        {chargement ? (
          <div className="flex items-center justify-center gap-3 py-14 text-sm text-slate-500">
            <RefreshCw size={20} className="animate-spin text-blue-600" />
            Chargement des paiements...
          </div>
        ) : paiementsFiltres.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
            <div className="mb-4 rounded-2xl bg-slate-100 p-5 text-slate-400">
              <Receipt size={34} />
            </div>

            <h3 className="font-semibold text-slate-700">
              Aucun paiement trouvé
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Les paiements enregistrés apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1200px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4">Commande</th>
                  <th className="px-5 py-4">Client</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Montant payé</th>
                  <th className="px-5 py-4">Total commande</th>
                  <th className="px-5 py-4">Déjà payé</th>
                  <th className="px-5 py-4">Solde restant</th>
                  <th className="px-5 py-4">Mode</th>
                  <th className="px-5 py-4">Statut</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paiementsFiltres.map((paiement) => {
                  const commande = trouverCommande(paiement.commande_id);

                  const totalPaye = commande
                    ? calculerTotalPaye(commande.id)
                    : 0;

                  const soldeRestant = commande
                    ? calculerSolde(commande)
                    : 0;

                  const statut = obtenirStatutPaiement(paiement.statut);
                  const IconeMode = obtenirIconeMode(paiement.mode_paiement);

                  return (
                    <tr
                      key={paiement.id}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-800">
                          {commande?.numero_commande ||
                            `Commande #${paiement.commande_id}`}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {nomClientCommande(commande)}
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-500">
                        {formaterDate(paiement.date_paiement)}
                      </td>

                      <td className="px-5 py-4 text-sm font-bold text-slate-800">
                        {formaterMontant(paiement.montant)}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {commande
                          ? formaterMontant(commande.montant_total)
                          : "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-emerald-700">
                        {commande ? formaterMontant(totalPaye) : "—"}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold">
                        <span className={soldeRestant > 0 ? "text-rose-600" : "text-emerald-600"}>
                          {commande ? formaterMontant(soldeRestant) : "—"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                          <IconeMode size={15} className="text-slate-400" />
                          {obtenirModePaiement(paiement.mode_paiement)}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${statut.classe}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statut.point}`} />
                          {statut.label}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            disabled={chargementHistorique}
                            onClick={() =>
                              consulterHistorique(paiement.commande_id)
                            }
                            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
                          >
                            <History size={15} />
                            Historique
                          </button>
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

      {/* Fenêtre historique d'une commande */}
      <AnimatePresence>
        {(historique || chargementHistorique) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6"
            onClick={(e) => {
              if (e.target === e.currentTarget && !chargementHistorique) {
                setHistorique(null);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 25, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="my-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600">
                    <History size={21} />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-800">
                      Historique des paiements
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {historique
                        ? trouverCommande(historique.commandeId)?.numero_commande ||
                          `Commande #${historique.commandeId}`
                        : "Chargement..."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={chargementHistorique}
                  onClick={() => setHistorique(null)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              {chargementHistorique ? (
                <div className="flex flex-col items-center gap-3 py-16">
                  <RefreshCw size={28} className="animate-spin text-blue-600" />
                  <p className="text-sm text-slate-500">
                    Chargement de l'historique...
                  </p>
                </div>
              ) : historique && (
                <div className="max-h-[70vh] overflow-y-auto p-5 sm:p-6">
                  {historique.paiements.length === 0 ? (
                    <div className="py-10 text-center">
                      <Receipt size={32} className="mx-auto text-slate-300" />
                      <h3 className="mt-3 font-semibold text-slate-700">
                        Aucun paiement enregistré
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Cette commande ne possède pas encore de paiement.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {historique.paiements.map((paiement) => {
                        const statut = obtenirStatutPaiement(paiement.statut);
                        const IconeMode = obtenirIconeMode(paiement.mode_paiement);

                        return (
                          <div
                            key={paiement.id}
                            className="flex flex-col justify-between gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center"
                          >
                            <div className="flex items-start gap-3">
                              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                                <IconeMode size={20} />
                              </div>

                              <div>
                                <p className="font-bold text-slate-800">
                                  {formaterMontant(paiement.montant)}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {obtenirModePaiement(paiement.mode_paiement)}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  {formaterDate(paiement.date_paiement)}
                                </p>

                                {paiement.reference_paiement && (
                                  <p className="mt-1 text-xs text-slate-500">
                                    Référence : {paiement.reference_paiement}
                                  </p>
                                )}
                              </div>
                            </div>

                            <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${statut.classe}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${statut.point}`} />
                              {statut.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Paiements;
