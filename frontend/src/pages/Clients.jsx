
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Mail,
  Phone,
  MapPin,
  UserRound,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import api from "../api/axios";

function Clients() {
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [messageSucces, setMessageSucces] = useState("");
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [clientEnModification, setClientEnModification] = useState(null);

  const formulaireInitial = {
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    adresse: "",
  };

  const [formulaire, setFormulaire] = useState(formulaireInitial);

  // Charger les clients
  const chargerClients = async () => {
    setChargement(true);
    setErreur("");

    try {
      const response = await api.get("/clients/");
      setClients(response.data);
    } catch (error) {
      console.error("Erreur chargement clients :", error);

      if (error.response?.status === 401) {
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("utilisateur");
        navigate("/connexion", { replace: true });
        return;
      }

      setErreur("Impossible de récupérer la liste des clients.");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerClients();
  }, []);

  // Modifier les champs du formulaire
  const handleChange = (e) => {
    setFormulaire({
      ...formulaire,
      [e.target.name]: e.target.value,
    });
  };

  // Ouvrir le formulaire d'ajout
  const ouvrirFormulaireAjout = () => {
    setClientEnModification(null);
    setFormulaire(formulaireInitial);
    setErreur("");
    setMessageSucces("");
    setAfficherFormulaire(true);
  };

  // Ouvrir le formulaire de modification
  const ouvrirFormulaireModification = (client) => {
    setClientEnModification(client);

    setFormulaire({
      nom: client.nom,
      prenom: client.prenom,
      telephone: client.telephone,
      email: client.email || "",
      adresse: client.adresse || "",
    });

    setErreur("");
    setMessageSucces("");
    setAfficherFormulaire(true);
  };

  // Fermer le formulaire
  const fermerFormulaire = () => {
    setAfficherFormulaire(false);
    setClientEnModification(null);
    setFormulaire(formulaireInitial);
    setErreur("");
  };

  // Ajouter ou modifier un client
  const enregistrerClient = async (e) => {
    e.preventDefault();

    setEnregistrement(true);
    setErreur("");
    setMessageSucces("");

    const modification = Boolean(clientEnModification);

    const donnees = {
      ...formulaire,
      nom: formulaire.nom.trim(),
      prenom: formulaire.prenom.trim(),
      telephone: formulaire.telephone.trim(),
      email: formulaire.email.trim() || null,
      adresse: formulaire.adresse.trim() || null,
    };

    try {
      if (modification) {
        await api.put(
          `/clients/${clientEnModification.id}`,
          donnees
        );
      } else {
        await api.post("/clients/", donnees);
      }

      fermerFormulaire();
      await chargerClients();

      setMessageSucces(
        modification
          ? "Les informations du client ont été modifiées avec succès."
          : "Le client a été ajouté avec succès."
      );
    } catch (error) {
      console.error("Erreur enregistrement client :", error);

      if (error.response?.status === 401) {
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("utilisateur");
        navigate("/connexion", { replace: true });
        return;
      }

      setErreur(
        error.response?.data?.detail ||
          "Une erreur est survenue lors de l'enregistrement."
      );
    } finally {
      setEnregistrement(false);
    }
  };

  // Supprimer un client
  const supprimerClient = async (client) => {
    const confirmation = window.confirm(
      `Voulez-vous vraiment supprimer ${client.prenom} ${client.nom} ?`
    );

    if (!confirmation) return;

    setErreur("");
    setMessageSucces("");

    try {
      await api.delete(`/clients/${client.id}`);
      await chargerClients();

      setMessageSucces("Le client a été supprimé avec succès.");
    } catch (error) {
      console.error("Erreur suppression client :", error);

      if (error.response?.status === 401) {
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("utilisateur");
        navigate("/connexion", { replace: true });
        return;
      }

      setErreur(
        error.response?.data?.detail ||
          "Impossible de supprimer ce client."
      );
    }
  };

  // Rechercher un client
  const clientsFiltres = clients.filter((client) => {
    const terme = recherche.toLowerCase().trim();

    return (
      (client.nom || "").toLowerCase().includes(terme) ||
      (client.prenom || "").toLowerCase().includes(terme) ||
      (client.telephone || "").toLowerCase().includes(terme) ||
      (client.email || "").toLowerCase().includes(terme)
    );
  });

  return (
    <div className="w-full min-w-0 space-y-6">

      {/* En-tête */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6"
      >
        <div>
          <div className="mb-2 flex items-center gap-2 text-blue-600">
            <Users size={19} />
            <span className="text-xs font-bold uppercase tracking-wider">
              Gestion commerciale
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Gestion des clients
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Consultez, recherchez et gérez les informations de vos clients.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={chargerClients}
            disabled={chargement}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={chargement ? "animate-spin" : ""}
            />
            Actualiser
          </button>

          <button
            type="button"
            onClick={
              afficherFormulaire
                ? fermerFormulaire
                : ouvrirFormulaireAjout
            }
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700"
          >
            {afficherFormulaire ? <X size={17} /> : <UserPlus size={17} />}
            {afficherFormulaire ? "Fermer" : "Ajouter un client"}
          </button>
        </div>
      </motion.section>

      {/* Messages */}
      <AnimatePresence>
        {messageSucces && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-medium text-emerald-700"
          >
            <CheckCircle2 size={19} />
            {messageSucces}
          </motion.div>
        )}

        {erreur && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={19} />
            {erreur}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formulaire */}
      <AnimatePresence>
        {afficherFormulaire && (
          <motion.section
            initial={{ opacity: 0, height: 0, y: 15 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: 15 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:px-6">
              <div>
                <h2 className="font-bold text-slate-900">
                  {clientEnModification
                    ? "Modifier un client"
                    : "Nouveau client"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Les champs marqués d'un astérisque sont obligatoires.
                </p>
              </div>

              <button
                type="button"
                onClick={fermerFormulaire}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Fermer le formulaire"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={enregistrerClient} className="p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Nom *
                  </label>
                  <input
                    type="text"
                    name="nom"
                    value={formulaire.nom}
                    onChange={handleChange}
                    minLength={2}
                    maxLength={100}
                    required
                    placeholder="Nom du client"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    name="prenom"
                    value={formulaire.prenom}
                    onChange={handleChange}
                    minLength={2}
                    maxLength={100}
                    required
                    placeholder="Prénom du client"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Phone size={15} className="text-slate-400" />
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    name="telephone"
                    value={formulaire.telephone}
                    onChange={handleChange}
                    minLength={8}
                    maxLength={20}
                    required
                    placeholder="Numéro de téléphone"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Mail size={15} className="text-slate-400" />
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formulaire.email}
                    onChange={handleChange}
                    placeholder="exemple@email.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <MapPin size={15} className="text-slate-400" />
                    Adresse
                  </label>
                  <input
                    type="text"
                    name="adresse"
                    value={formulaire.adresse}
                    onChange={handleChange}
                    maxLength={255}
                    placeholder="Adresse du client"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={fermerFormulaire}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={enregistrement}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {enregistrement && (
                    <RefreshCw size={16} className="animate-spin" />
                  )}

                  {enregistrement
                    ? "Enregistrement..."
                    : clientEnModification
                      ? "Enregistrer les modifications"
                      : "Enregistrer le client"}
                </button>
              </div>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Statistique rapide */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Users size={23} />
          </div>

          <div>
            <p className="text-sm text-slate-500">Total des clients</p>
            <p className="text-2xl font-bold text-slate-900">
              {clients.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <UserRound size={23} />
          </div>

          <div>
            <p className="text-sm text-slate-500">Résultats affichés</p>
            <p className="text-2xl font-bold text-slate-900">
              {clientsFiltres.length}
            </p>
          </div>
        </div>
      </div>

      {/* Liste des clients */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="font-bold text-slate-900">
              Liste des clients
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {clients.length} client(s) enregistré(s)
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              placeholder="Rechercher un client..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
          </div>
        </div>

        {chargement ? (
          <div className="flex flex-col items-center justify-center gap-3 p-12">
            <RefreshCw size={26} className="animate-spin text-blue-600" />
            <p className="text-sm text-slate-500">
              Chargement des clients...
            </p>
          </div>
        ) : clientsFiltres.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Users size={30} />
            </div>

            <h3 className="font-bold text-slate-800">
              {recherche
                ? "Aucun résultat"
                : "Aucun client enregistré"}
            </h3>

            <p className="mt-2 max-w-sm text-sm text-slate-500">
              {recherche
                ? "Aucun client ne correspond à votre recherche. Essayez un autre terme."
                : "Commencez par ajouter votre premier client."}
            </p>

            {!recherche && (
              <button
                onClick={ouvrirFormulaireAjout}
                className="mt-5 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <UserPlus size={17} />
                Ajouter un client
              </button>
            )}
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Nom et prénom
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Téléphone
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Email
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Adresse
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {clientsFiltres.map((client, index) => (
                  <motion.tr
                    key={client.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.025 }}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600">
                          {(client.prenom || "C").charAt(0).toUpperCase()}
                        </div>

                        <span className="whitespace-nowrap text-sm font-semibold text-slate-800">
                          {client.prenom} {client.nom}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {client.telephone}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {client.email || "Non renseigné"}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {client.adresse || "Non renseignée"}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          title="Modifier"
                          onClick={() =>
                            ouvrirFormulaireModification(client)
                          }
                          className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          title="Supprimer"
                          onClick={() => supprimerClient(client)}
                          className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Clients;
