
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Package,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Save,
  Boxes,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Tag,
  Banknote,
  Layers,
  AlertCircle,
} from "lucide-react";
import api from "../api/axios";

function Produits() {
  const navigate = useNavigate();

  const [produits, setProduits] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [messageSucces, setMessageSucces] = useState("");
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [produitEnModification, setProduitEnModification] = useState(null);

  const formulaireInitial = {
    nom: "",
    description: "",
    reference: "",
    prix_unitaire: "",
    quantite_stock: 0,
    actif: true,
  };

  const [formulaire, setFormulaire] = useState(formulaireInitial);

  const gererErreurConnexion = (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("utilisateur");
      navigate("/connexion", { replace: true });
      return true;
    }

    return false;
  };

  const chargerProduits = async () => {
    setChargement(true);
    setErreur("");

    try {
      const response = await api.get("/produits/");
      setProduits(response.data);
    } catch (error) {
      console.error("Erreur chargement produits :", error);

      if (!gererErreurConnexion(error)) {
        setErreur("Impossible de récupérer la liste des produits.");
      }
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerProduits();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormulaire((ancien) => ({
      ...ancien,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const ouvrirFormulaireAjout = () => {
    setProduitEnModification(null);
    setFormulaire(formulaireInitial);
    setErreur("");
    setMessageSucces("");
    setAfficherFormulaire(true);
  };

  const ouvrirFormulaireModification = (produit) => {
    setProduitEnModification(produit);

    setFormulaire({
      nom: produit.nom,
      description: produit.description || "",
      reference: produit.reference,
      prix_unitaire: produit.prix_unitaire,
      quantite_stock: produit.quantite_stock,
      actif: produit.actif,
    });

    setErreur("");
    setMessageSucces("");
    setAfficherFormulaire(true);
  };

  const fermerFormulaire = () => {
    setAfficherFormulaire(false);
    setProduitEnModification(null);
    setFormulaire(formulaireInitial);
    setErreur("");
  };

  const enregistrerProduit = async (e) => {
    e.preventDefault();

    setEnregistrement(true);
    setErreur("");
    setMessageSucces("");

    const modification = Boolean(produitEnModification);

    const donnees = {
      nom: formulaire.nom.trim(),
      description: formulaire.description.trim() || null,
      reference: formulaire.reference.trim(),
      prix_unitaire: formulaire.prix_unitaire,
      quantite_stock: Number(formulaire.quantite_stock),
      actif: formulaire.actif,
    };

    try {
      if (modification) {
        await api.put(
          `/produits/${produitEnModification.id}`,
          donnees
        );
      } else {
        await api.post("/produits/", donnees);
      }

      fermerFormulaire();
      await chargerProduits();

      setMessageSucces(
        modification
          ? "Le produit a été modifié avec succès."
          : "Le produit a été ajouté avec succès."
      );
    } catch (error) {
      console.error("Erreur enregistrement produit :", error);

      if (!gererErreurConnexion(error)) {
        setErreur(
          error.response?.data?.detail ||
          "Une erreur est survenue lors de l'enregistrement."
        );
      }
    } finally {
      setEnregistrement(false);
    }
  };

  const supprimerProduit = async (produit) => {
    const confirmation = window.confirm(
      `Voulez-vous vraiment supprimer le produit "${produit.nom}" ?`
    );

    if (!confirmation) return;

    setErreur("");
    setMessageSucces("");

    try {
      await api.delete(`/produits/${produit.id}`);
      await chargerProduits();

      setMessageSucces("Le produit a été supprimé avec succès.");
    } catch (error) {
      console.error("Erreur suppression produit :", error);

      if (!gererErreurConnexion(error)) {
        setErreur(
          error.response?.data?.detail ||
          "Impossible de supprimer ce produit."
        );
      }
    }
  };

  const produitsFiltres = produits.filter((produit) => {
    const terme = recherche.toLowerCase().trim();

    return (
      (produit.nom || "").toLowerCase().includes(terme) ||
      (produit.reference || "").toLowerCase().includes(terme)
    );
  });

  const formaterPrix = (prix) => {
    return Number(prix).toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const totalProduits = produits.length;
  const produitsActifs = produits.filter((p) => p.actif).length;
  const stockFaible = produits.filter(
    (p) => p.quantite_stock > 0 && p.quantite_stock <= 5
  ).length;
  const stockEpuise = produits.filter(
    (p) => p.quantite_stock === 0
  ).length;

  const statistiques = [
    {
      titre: "Total des produits",
      valeur: totalProduits,
      description: "Produits enregistrés",
      icone: Package,
      couleur: "blue",
      fond: "bg-blue-50",
      texte: "text-blue-600",
    },
    {
      titre: "Produits actifs",
      valeur: produitsActifs,
      description: "Disponibles à la vente",
      icone: CheckCircle2,
      couleur: "emerald",
      fond: "bg-emerald-50",
      texte: "text-emerald-600",
    },
    {
      titre: "Stock faible",
      valeur: stockFaible,
      description: "Quantité inférieure ou égale à 5",
      icone: AlertTriangle,
      couleur: "amber",
      fond: "bg-amber-50",
      texte: "text-amber-600",
    },
    {
      titre: "Stock épuisé",
      valeur: stockEpuise,
      description: "Produits indisponibles",
      icone: XCircle,
      couleur: "rose",
      fond: "bg-rose-50",
      texte: "text-rose-600",
    },
  ];

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

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
            <Package size={17} />
            <span>Catalogue</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
            Gestion des produits
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Gérez votre catalogue et surveillez les niveaux de stock.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={chargerProduits}
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
            onClick={
              afficherFormulaire
                ? fermerFormulaire
                : ouvrirFormulaireAjout
            }
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-blue-600/30"
          >
            {afficherFormulaire ? <X size={17} /> : <Plus size={17} />}
            {afficherFormulaire ? "Fermer" : "Ajouter un produit"}
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
            {messageSucces}
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
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {stat.titre}
                  </p>

                  <h2 className="mt-3 text-3xl font-bold text-slate-800">
                    {stat.valeur}
                  </h2>
                </div>

                <div className={`rounded-xl p-3 ${stat.fond} ${stat.texte}`}>
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

      {/* Formulaire */}
      <AnimatePresence>
        {afficherFormulaire && (
          <motion.section
            initial={{ opacity: 0, height: 0, y: 15 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                  {produitEnModification ? (
                    <Pencil size={20} />
                  ) : (
                    <Plus size={20} />
                  )}
                </div>

                <div>
                  <h2 className="font-bold text-slate-800">
                    {produitEnModification
                      ? "Modifier un produit"
                      : "Ajouter un produit"}
                  </h2>

                  <p className="text-xs text-slate-500">
                    Renseignez les informations du produit.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={fermerFormulaire}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={enregistrerProduit} className="space-y-5 p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Nom du produit *
                  </label>
                  <input
                    type="text"
                    name="nom"
                    value={formulaire.nom}
                    onChange={handleChange}
                    minLength={2}
                    maxLength={150}
                    placeholder="Ex : Téléviseur Samsung"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Référence *
                  </label>
                  <input
                    type="text"
                    name="reference"
                    value={formulaire.reference}
                    onChange={handleChange}
                    minLength={2}
                    maxLength={50}
                    placeholder="Ex : TV-SAM-001"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Prix unitaire (F) *
                  </label>
                  <div className="relative">
                    <Banknote
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="number"
                      name="prix_unitaire"
                      value={formulaire.prix_unitaire}
                      onChange={handleChange}
                      min="0.01"
                      step="0.01"
                      placeholder="Ex : 150000"
                      className={`${inputClass} pl-10`}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Quantité en stock *
                  </label>
                  <div className="relative">
                    <Boxes
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="number"
                      name="quantite_stock"
                      value={formulaire.quantite_stock}
                      onChange={handleChange}
                      min="0"
                      step="1"
                      className={`${inputClass} pl-10`}
                      required
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formulaire.description}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Ajoutez une description du produit..."
                    className={`${inputClass} resize-y`}
                  />
                </div>
              </div>

              <div className="flex flex-col justify-between gap-4 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    name="actif"
                    checked={formulaire.actif}
                    onChange={handleChange}
                    className="h-4 w-4 accent-blue-600"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-700">
                      Produit actif
                    </span>
                    <span className="block text-xs text-slate-500">
                      Ce produit est disponible dans le catalogue.
                    </span>
                  </span>
                </label>

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

                  {enregistrement
                    ? "Enregistrement..."
                    : produitEnModification
                      ? "Enregistrer les modifications"
                      : "Enregistrer le produit"}
                </button>
              </div>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Liste des produits */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
      >
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Catalogue des produits
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {produitsFiltres.length} résultat(s) sur {totalProduits} produit(s)
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              placeholder="Nom ou référence..."
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
              Chargement des produits...
            </p>
          </div>
        ) : produitsFiltres.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <div className="mb-4 rounded-2xl bg-slate-100 p-5 text-slate-400">
              <Package size={34} />
            </div>

            <h3 className="font-semibold text-slate-700">
              {recherche
                ? "Aucun résultat trouvé"
                : "Aucun produit enregistré"}
            </h3>

            <p className="mt-2 max-w-sm text-sm text-slate-500">
              {recherche
                ? "Aucun produit ne correspond à votre recherche."
                : "Commencez par ajouter votre premier produit au catalogue."}
            </p>

            {!recherche && (
              <button
                type="button"
                onClick={ouvrirFormulaireAjout}
                className="mt-5 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Plus size={17} />
                Ajouter un produit
              </button>
            )}
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Produit</th>
                  <th className="px-6 py-4">Référence</th>
                  <th className="px-6 py-4">Prix unitaire</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                <AnimatePresence>
                  {produitsFiltres.map((produit) => (
                    <motion.tr
                      key={produit.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Package size={19} />
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800">
                              {produit.nom}
                            </p>
                            {produit.description && (
                              <p className="mt-1 max-w-[220px] truncate text-xs text-slate-400">
                                {produit.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                          <Tag size={13} />
                          {produit.reference}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-700">
                          {formaterPrix(produit.prix_unitaire)} F
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                            produit.quantite_stock === 0
                              ? "bg-rose-50 text-rose-600"
                              : produit.quantite_stock <= 5
                                ? "bg-amber-50 text-amber-700"
                                : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          <Layers size={13} />
                          {produit.quantite_stock}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                            produit.actif
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              produit.actif
                                ? "bg-emerald-500"
                                : "bg-slate-400"
                            }`}
                          />
                          {produit.actif ? "Actif" : "Inactif"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            title="Modifier"
                            onClick={() =>
                              ouvrirFormulaireModification(produit)
                            }
                            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            title="Supprimer"
                            onClick={() => supprimerProduit(produit)}
                            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {!chargement && produitsFiltres.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-3">
            <p className="text-xs text-slate-500">
              Affichage de {produitsFiltres.length} produit(s)
            </p>
          </div>
        )}
      </motion.section>
    </div>
  );
}

export default Produits;
