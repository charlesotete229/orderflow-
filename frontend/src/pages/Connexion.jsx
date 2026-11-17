
import { useState } from "react";
import api from "../api/axios";

function Connexion() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  const handleConnexion = async (e) => {
    e.preventDefault();

    setErreur("");
    setChargement(true);

    try {
      // Authentification
      const response = await api.post("/auth/connexion", {
        email: email,
        mot_de_passe: motDePasse,
      });

      // Enregistrer le token
      sessionStorage.setItem(
        "access_token",
        response.data.access_token
      );

      // Récupérer les informations de l'utilisateur connecté
      const utilisateurResponse = await api.get("/auth/me");

      // Enregistrer les informations de l'utilisateur
      sessionStorage.setItem(
        "utilisateur",
        JSON.stringify(utilisateurResponse.data)
      );

      // Redirection
      window.location.href = "/dashboard";

    } catch (error) {
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("utilisateur");

      setErreur(
        error.response?.data?.detail ||
        "Impossible de se connecter au serveur."
      );

    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="connexion-container">
      <div className="connexion-card">
        <h1>OrderFlow</h1>
        <p>Connectez-vous à votre espace de gestion</p>

        <form onSubmit={handleConnexion}>
          <div>
            <label>Adresse e-mail</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemple@email.com"
              required
            />
          </div>

          <div>
            <label>Mot de passe</label>

            <input
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="Votre mot de passe"
              required
            />
          </div>

          {erreur && <p className="erreur">{erreur}</p>}

          <button type="submit" disabled={chargement}>
            {chargement ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Connexion;
