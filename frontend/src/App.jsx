
import { Routes, Route, Navigate } from "react-router-dom";

import Connexion from "./pages/Connexion";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Produits from "./pages/Produits";
import Commandes from "./pages/Commandes";
import Paiements from "./pages/Paiements";
import Factures from "./pages/Factures";
import Utilisateurs from "./pages/Utilisateurs";

import RouteProtegee from "./routes/RouteProtegee";
import AppLayout from "./components/layout/AppLayout";

function App() {
  return (
    <Routes>
      {/* Connexion */}
      <Route path="/connexion" element={<Connexion />} />

      {/* Pages accessibles aux utilisateurs connectés */}
      <Route element={<RouteProtegee />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/produits" element={<Produits />} />
          <Route path="/commandes" element={<Commandes />} />
          <Route path="/paiements" element={<Paiements />} />
          <Route path="/factures" element={<Factures />} />

          {/* Page réservée aux administrateurs */}
          <Route
            element={
              <RouteProtegee rolesAutorises={["ADMINISTRATEUR"]} />
            }
          >
            <Route path="/utilisateurs" element={<Utilisateurs />} />
          </Route>
        </Route>
      </Route>

      {/* Redirections */}
      <Route path="/" element={<Navigate to="/connexion" replace />} />
      <Route path="*" element={<Navigate to="/connexion" replace />} />
    </Routes>
  );
}

export default App;
