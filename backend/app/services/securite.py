
from pwdlib import PasswordHash


password_hash = PasswordHash.recommended()


def hacher_mot_de_passe(mot_de_passe: str) -> str:
    """Transforme un mot de passe en empreinte sécurisée."""
    return password_hash.hash(mot_de_passe)


def verifier_mot_de_passe(
    mot_de_passe: str,
    mot_de_passe_hache: str
) -> bool:
    """Vérifie si le mot de passe correspond à son empreinte."""
    return password_hash.verify(
        mot_de_passe,
        mot_de_passe_hache
    )
