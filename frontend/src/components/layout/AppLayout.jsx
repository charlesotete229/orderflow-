
import { useEffect, useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  CreditCard,
  FileText,
  UserCog,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronRight,
} from "lucide-react";

import api from "../../api/axios";

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [utilisateur, setUtilisateur] = useState(() => {
    try {
      return JSON.parse(
        sessionStorage.getItem("utilisateur") || "null"
      );
    } catch {
      return null;
    }
  });

  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false);

  // Récupérer le profil de l'utilisateur connecté
  useEffect(() => {
    const chargerProfil = async () => {
      try {
        const response = await api.get("/auth/me");

        setUtilisateur(response.data);

        sessionStorage.setItem(
          "utilisateur",
          JSON.stringify(response.data)
        );
      } catch (error) {
        console.error("Erreur de récupération du profil :", error);

        if (error.response?.status === 401) {
          sessionStorage.removeItem("access_token");
          sessionStorage.removeItem("utilisateur");
          navigate("/connexion", { replace: true });
        }
      }
    };

    chargerProfil();
  }, [navigate]);

  // Déconnexion
  const handleDeconnexion = () => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("utilisateur");

    navigate("/connexion", { replace: true });
  };

  const estAdministrateur =
    utilisateur?.role === "ADMINISTRATEUR";

  // Éléments du menu
  const menu = [
    {
      nom: "Tableau de bord",
      chemin: "/dashboard",
      icone: LayoutDashboard,
    },
    {
      nom: "Clients",
      chemin: "/clients",
      icone: Users,
    },
    {
      nom: "Produits",
      chemin: "/produits",
      icone: Package,
    },
    {
      nom: "Commandes",
      chemin: "/commandes",
      icone: ShoppingCart,
    },
    {
      nom: "Paiements",
      chemin: "/paiements",
      icone: CreditCard,
    },
    {
      nom: "Factures",
      chemin: "/factures",
      icone: FileText,
    },
  ];

  if (estAdministrateur) {
    menu.push({
      nom: "Utilisateurs",
      chemin: "/utilisateurs",
      icone: UserCog,
    });
  }

  const titresPages = {
    "/dashboard": "Tableau de bord",
    "/clients": "Gestion des clients",
    "/produits": "Gestion des produits",
    "/commandes": "Gestion des commandes",
    "/paiements": "Gestion des paiements",
    "/factures": "Gestion des factures",
    "/utilisateurs": "Gestion des utilisateurs",
  };

  const titrePage =
    titresPages[location.pathname] || "OrderFlow";

  const initiale =
    utilisateur?.prenom?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">

      {/* Menu mobile : arrière-plan */}
      <AnimatePresence>
        {menuMobileOuvert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
            onClick={() => setMenuMobileOuvert(false)}
          />
        )}
      </AnimatePresence>

      {/* Barre latérale */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex w-[260px] flex-col
          border-r border-slate-200
          bg-white
          transition-transform duration-300
          lg:translate-x-0
          ${menuMobileOuvert ? "translate-x-0" : "-translate-x-full"}
        `}
      >

        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <Package size={22} />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Order<span className="text-blue-600">Flow</span>
              </h1>
              <p className="text-[10px] font-medium uppercase tracking-[2px] text-slate-400">
                Gestion commerciale
              </p>
            </div>
          </div>

          <button
            onClick={() => setMenuMobileOuvert(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Fermer le menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-7">

          <p className="mb-4 px-3 text-[11px] font-bold uppercase tracking-[1.5px] text-slate-400">
            Menu principal
          </p>

          <nav className="space-y-1.5">
            {menu.map((item) => {
              const Icone = item.icone;

              return (
                <NavLink
                  key={item.chemin}
                  to={item.chemin}
                  onClick={() => setMenuMobileOuvert(false)}
                  className={({ isActive }) =>
                    `group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                        : "text-slate-600 hover:bg-slate-100 hover:text-blue-600"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="flex items-center gap-3">
                        <Icone
                          size={19}
                          strokeWidth={isActive ? 2.5 : 2}
                        />
                        {item.nom}
                      </span>

                      {isActive && (
                        <ChevronRight size={17} />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Profil et déconnexion */}
        <div className="border-t border-slate-100 p-4">

          <div className="mb-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
              {initiale}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">
                {utilisateur
                  ? `${utilisateur.prenom || ""} ${utilisateur.nom || ""}`
                  : "Utilisateur"}
              </p>

              <p className="truncate text-xs text-slate-500">
                {utilisateur?.role || "Chargement..."}
              </p>
            </div>
          </div>

          <button
            onClick={handleDeconnexion}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={19} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Zone principale */}
      <div className="min-h-screen lg:ml-[260px]">

        {/* Barre supérieure */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl sm:px-8">

          <div className="flex items-center gap-3">

            <button
              onClick={() => setMenuMobileOuvert(true)}
              className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu size={23} />
            </button>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {titrePage}
              </h2>

              <p className="hidden text-xs text-slate-500 sm:block">
                Bienvenue dans votre espace de gestion
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">
                {utilisateur?.prenom} {utilisateur?.nom}
              </p>

              <p className="text-xs text-slate-500">
                {utilisateur?.role}
              </p>
            </div>

            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
              {initiale}
            </div>

          </div>
        </header>

        {/* Contenu des pages avec animation */}
        <main className="p-4 sm:p-6 lg:p-8">

          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>

        </main>
      </div>
    </div>
  );
}

export default AppLayout;
