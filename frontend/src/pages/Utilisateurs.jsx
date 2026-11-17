
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  UserPlus,
  Users,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  ShieldCheck,
  UserCog,
  CheckCircle2,
  XCircle,
  X,
  Save,
  Mail,
  Lock,
  User,
  Shield,
  AlertCircle,
  LoaderCircle,
  Power,
  UserRoundCheck,
} from "lucide-react";
import api from "../api/axios";

function Utilisateurs() {
  const navigate = useNavigate();

  const [utilisateurs, setUtilisateurs] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);
  const [actionEnCours, setActionEnCours] = useState(null);

  const [erreur, setErreur] = useState("");
  const [messageSucces, setMessageSucces] = useState("");

  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [utilisateurEnModification, setUtilisateurEnModification] =
    useState(null);

  const formulaireInitial = {
    nom: "",
    prenom: "",
    email: "",
    mot_de_passe: "",
    role: "GESTIONNAIRE",
  };

  const [formulaire, setFormulaire] = useState(formulaireInitial);

  const gererErreurAuthentification = (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("utilisateur");
      navigate("/connexion", { replace: true });
      return true;
    }

    return false;
  };

  const chargerUtilisateurs = async () => {
    setChargement(true);
    setErreur("");

    try {
      const response = await api.get("/utilisateurs/");
      setUtilisateurs(response.data);
    } catch (error) {
      console.error("Erreur chargement utilisateurs :", error);

      if (gererErreurAuthentification(error)) return;

      if (error.response?.status === 403) {
        setErreur(
          "Vous n'avez pas l'autorisation de gérer les utilisateurs."
        );
        return;
      }

      setErreur("Impossible de récupérer la liste des utilisateurs.");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerUtilisateurs();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormulaire((ancien) => ({
      ...ancien,
      [name]: value,
    }));
  };

  const ouvrirFormulaireAjout = () => {
    setUtilisateurEnModification(null);
    setFormulaire({ ...formulaireInitial });
    setErreur("");
    setMessageSucces("");
    setAfficherFormulaire(true);
  };

  const ouvrirFormulaireModification = (utilisateur) => {
    setUtilisateurEnModification(utilisateur);

    setFormulaire({
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email,
      mot_de_passe: "",
      role: utilisateur.role,
    });

    setErreur("");
    setMessageSucces("");
    setAfficherFormulaire(true);
  };

  const fermerFormulaire = () => {
    setAfficherFormulaire(false);
    setUtilisateurEnModification(null);
    setFormulaire({ ...formulaireInitial });
    setErreur("");
  };

  const enregistrerUtilisateur = async (e) => {
    e.preventDefault();

    setEnregistrement(true);
    setErreur("");
    setMessageSucces("");

    const modification = Boolean(utilisateurEnModification);

    const donnees = {
      nom: formulaire.nom.trim(),
      prenom: formulaire.prenom.trim(),
      email: formulaire.email.trim(),
      role: formulaire.role,
    };

    try {
      if (modification) {
        await api.put(
          `/utilisateurs/${utilisateurEnModification.id}`,
          donnees
        );
      } else {
        await api.post("/utilisateurs/", {
          ...donnees,
          mot_de_passe: formulaire.mot_de_passe,
        });
      }

      fermerFormulaire();
      await chargerUtilisateurs();

      setMessageSucces(
        modification
          ? "Les informations de l'utilisateur ont été modifiées avec succès."
          : "L'utilisateur a été créé avec succès."
      );
    } catch (error) {
      console.error("Erreur enregistrement utilisateur :", error);

      if (gererErreurAuthentification(error)) return;

      setErreur(
        error.response?.data?.detail ||
          "Une erreur est survenue lors de l'enregistrement."
      );
    } finally {
      setEnregistrement(false);
    }
  };

  const changerStatut = async (utilisateur) => {
    const action = utilisateur.actif ? "désactiver" : "activer";

    const confirmation = window.confirm(
      `Voulez-vous vraiment ${action} le compte de ${utilisateur.prenom} ${utilisateur.nom} ?`
    );

    if (!confirmation) return;

    setErreur("");
    setMessageSucces("");
    setActionEnCours(`statut-${utilisateur.id}`);

    try {
      const endpoint = utilisateur.actif
        ? `/utilisateurs/${utilisateur.id}/desactiver`
        : `/utilisateurs/${utilisateur.id}/activer`;

      await api.patch(endpoint);
      await chargerUtilisateurs();

      setMessageSucces(
        utilisateur.actif
          ? "Le compte a été désactivé avec succès."
          : "Le compte a été activé avec succès."
      );
    } catch (error) {
      console.error("Erreur changement statut :", error);

      if (gererErreurAuthentification(error)) return;

      setErreur(
        error.response?.data?.detail ||
          "Impossible de modifier le statut du compte."
      );
    } finally {
      setActionEnCours(null);
    }
  };

  const supprimerUtilisateur = async (utilisateur) => {
    const confirmation = window.confirm(
      `Voulez-vous vraiment supprimer ${utilisateur.prenom} ${utilisateur.nom} ?`
    );

    if (!confirmation) return;

    setErreur("");
    setMessageSucces("");
    setActionEnCours(`suppression-${utilisateur.id}`);

    try {
      await api.delete(`/utilisateurs/${utilisateur.id}`);
      await chargerUtilisateurs();

      setMessageSucces("L'utilisateur a été supprimé avec succès.");
    } catch (error) {
      console.error("Erreur suppression utilisateur :", error);

      if (gererErreurAuthentification(error)) return;

      setErreur(
        error.response?.data?.detail ||
          "Impossible de supprimer cet utilisateur."
      );
    } finally {
      setActionEnCours(null);
    }
  };

  const utilisateursFiltres = useMemo(() => {
    const terme = recherche.toLowerCase().trim();

    return utilisateurs.filter((utilisateur) => {
      return (
        utilisateur.nom.toLowerCase().includes(terme) ||
        utilisateur.prenom.toLowerCase().includes(terme) ||
        utilisateur.email.toLowerCase().includes(terme) ||
        utilisateur.role.toLowerCase().includes(terme)
      );
    });
  }, [utilisateurs, recherche]);

  const nombreActifs = utilisateurs.filter((u) => u.actif).length;
  const nombreInactifs = utilisateurs.length - nombreActifs;
  const nombreAdministrateurs = utilisateurs.filter(
    (u) => u.role === "ADMINISTRATEUR"
  ).length;

  const cartesStatistiques = [
    {
      titre: "Total utilisateurs",
      valeur: utilisateurs.length,
      description: "Comptes enregistrés",
      icone: Users,
      couleur: "bg-blue-50 text-blue-600",
    },
    {
      titre: "Comptes actifs",
      valeur: nombreActifs,
      description: "Comptes opérationnels",
      icone: UserRoundCheck,
      couleur: "bg-emerald-50 text-emerald-600",
    },
    {
      titre: "Comptes désactivés",
      valeur: nombreInactifs,
      description: "Comptes inactifs",
      icone: XCircle,
      couleur: "bg-rose-50 text-rose-600",
    },
    {
      titre: "Administrateurs",
      valeur: nombreAdministrateurs,
      description: "Comptes avec accès admin",
      icone: ShieldCheck,
      couleur: "bg-violet-50 text-violet-600",
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
            <ShieldCheck size={17} />
            Administration
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
            Gestion des utilisateurs
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Gérez les comptes et les autorisations de votre application.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={chargerUtilisateurs}
            disabled={chargement}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            {afficherFormulaire ? <X size={17} /> : <UserPlus size={17} />}
            {afficherFormulaire ? "Fermer" : "Ajouter un utilisateur"}
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
            className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
            <span className="flex-1">{messageSucces}</span>
            <button
              type="button"
              onClick={() => setMessageSucces("")}
              className="text-emerald-600 hover:text-emerald-800"
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
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <span className="flex-1">{erreur}</span>
            <button
              type="button"
              onClick={() => setErreur("")}
              className="text-red-600 hover:text-red-800"
            >
              <X size={17} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Statistiques */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cartesStatistiques.map((carte, index) => {
          const Icone = carte.icone;

          return (
            <motion.div
              key={carte.titre}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07 }}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {carte.titre}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-800">
                    {carte.valeur}
                  </p>
                </div>

                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${carte.couleur}`}
                >
                  <Icone size={23} />
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-400">
                {carte.description}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Formulaire */}
      <AnimatePresence>
        {afficherFormulaire && (
          <motion.section
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <h2 className="font-bold text-slate-800">
                  {utilisateurEnModification
                    ? "Modifier un utilisateur"
                    : "Créer un utilisateur"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Renseignez les informations du compte.
                </p>
              </div>

              <button
                type="button"
                onClick={fermerFormulaire}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={enregistrerUtilisateur} className="p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Nom *
                  </label>
                  <div className="relative">
                    <User
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      name="nom"
                      value={formulaire.nom}
                      onChange={handleChange}
                      minLength={2}
                      maxLength={100}
                      required
                      placeholder="Nom de famille"
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Prénom *
                  </label>
                  <div className="relative">
                    <User
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      name="prenom"
                      value={formulaire.prenom}
                      onChange={handleChange}
                      minLength={2}
                      maxLength={100}
                      required
                      placeholder="Prénom"
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Adresse e-mail *
                  </label>
                  <div className="relative">
                    <Mail
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="email"
                      name="email"
                      value={formulaire.email}
                      onChange={handleChange}
                      required
                      placeholder="exemple@email.com"
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>
                </div>

                {!utilisateurEnModification && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Mot de passe *
                    </label>
                    <div className="relative">
                      <Lock
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="password"
                        name="mot_de_passe"
                        value={formulaire.mot_de_passe}
                        onChange={handleChange}
                        minLength={8}
                        maxLength={128}
                        required
                        placeholder="Au moins 8 caractères"
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Rôle *
                  </label>
                  <div className="relative">
                    <Shield
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <select
                      name="role"
                      value={formulaire.role}
                      onChange={handleChange}
                      required
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    >
                      <option value="GESTIONNAIRE">Gestionnaire</option>
                      <option value="ADMINISTRATEUR">
                        Administrateur
                      </option>
                    </select>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    L'administrateur possède des droits de gestion des comptes.
                  </p>
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
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {enregistrement ? (
                    <>
                      <LoaderCircle size={17} className="animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      {utilisateurEnModification
                        ? "Enregistrer les modifications"
                        : "Créer l'utilisateur"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Liste des utilisateurs */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
      >
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="font-bold text-slate-800">
              Liste des utilisateurs
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {utilisateurs.length} compte(s) enregistré(s)
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              placeholder="Rechercher un utilisateur..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
          </div>
        </div>

        {chargement ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <LoaderCircle size={30} className="animate-spin text-blue-600" />
            <p className="text-sm text-slate-500">
              Chargement des utilisateurs...
            </p>
          </div>
        ) : utilisateursFiltres.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Users size={30} />
            </div>

            <h3 className="font-semibold text-slate-700">
              {recherche
                ? "Aucun résultat trouvé"
                : "Aucun utilisateur enregistré"}
            </h3>

            <p className="mt-2 max-w-sm text-sm text-slate-400">
              {recherche
                ? "Aucun utilisateur ne correspond à votre recherche."
                : "Commencez par créer un compte utilisateur."}
            </p>

            {!recherche && (
              <button
                type="button"
                onClick={ouvrirFormulaireAjout}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <UserPlus size={17} />
                Ajouter un utilisateur
              </button>
            )}
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">
                    Utilisateur
                  </th>
                  <th className="px-6 py-4 font-semibold">Adresse e-mail</th>
                  <th className="px-6 py-4 font-semibold">Rôle</th>
                  <th className="px-6 py-4 font-semibold">Statut</th>
                  <th className="px-6 py-4 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {utilisateursFiltres.map((utilisateur) => {
                  const traitement =
                    actionEnCours?.includes(`-${utilisateur.id}`) ?? false;

                  return (
                    <tr
                      key={utilisateur.id}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-600">
                            {`${utilisateur.prenom?.[0] || ""}${utilisateur.nom?.[0] || ""}`.toUpperCase()}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-800">
                              {utilisateur.prenom} {utilisateur.nom}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-400">
                              ID : {utilisateur.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {utilisateur.email}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                            utilisateur.role === "ADMINISTRATEUR"
                              ? "bg-violet-50 text-violet-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {utilisateur.role === "ADMINISTRATEUR" ? (
                            <ShieldCheck size={14} />
                          ) : (
                            <UserCog size={14} />
                          )}
                          {utilisateur.role === "ADMINISTRATEUR"
                            ? "Administrateur"
                            : "Gestionnaire"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                            utilisateur.actif
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {utilisateur.actif ? (
                            <CheckCircle2 size={14} />
                          ) : (
                            <XCircle size={14} />
                          )}
                          {utilisateur.actif ? "Actif" : "Désactivé"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            title="Modifier"
                            disabled={Boolean(actionEnCours)}
                            onClick={() =>
                              ouvrirFormulaireModification(utilisateur)
                            }
                            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            title={
                              utilisateur.actif ? "Désactiver" : "Activer"
                            }
                            disabled={Boolean(actionEnCours)}
                            onClick={() => changerStatut(utilisateur)}
                            className={`rounded-lg border p-2 transition disabled:opacity-50 ${
                              utilisateur.actif
                                ? "border-amber-200 text-amber-600 hover:bg-amber-50"
                                : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            }`}
                          >
                            {traitement ? (
                              <LoaderCircle size={16} className="animate-spin" />
                            ) : (
                              <Power size={16} />
                            )}
                          </button>

                          <button
                            type="button"
                            title="Supprimer"
                            disabled={Boolean(actionEnCours)}
                            onClick={() => supprimerUtilisateur(utilisateur)}
                            className="rounded-lg border border-rose-200 p-2 text-rose-500 transition hover:bg-rose-50 disabled:opacity-50"
                          >
                            <Trash2 size={16} />
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

        {!chargement && utilisateursFiltres.length > 0 && (
          <div className="border-t border-slate-100 px-6 py-3 text-xs text-slate-400">
            Affichage de {utilisateursFiltres.length} utilisateur(s)
          </div>
        )}
      </motion.section>
    </div>
  );
}

export default Utilisateurs;
