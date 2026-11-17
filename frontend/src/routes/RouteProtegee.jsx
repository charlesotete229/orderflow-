
import { Navigate, Outlet } from "react-router-dom";

function RouteProtegee({ rolesAutorises }) {
  const token = sessionStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/connexion" replace />;
  }

  const utilisateur = JSON.parse(
    sessionStorage.getItem("utilisateur") || "null"
  );

  if (
    rolesAutorises &&
    (!utilisateur || !rolesAutorises.includes(utilisateur.role))
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default RouteProtegee;
