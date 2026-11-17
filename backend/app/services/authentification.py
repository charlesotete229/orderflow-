
import os
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv


load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


if not SECRET_KEY:
    raise ValueError(
        "SECRET_KEY absente du fichier .env."
    )


def creer_access_token(
    donnees: dict,
    duree_validite: timedelta | None = None
) -> str:
    donnees_a_encoder = donnees.copy()

    expiration = datetime.now(timezone.utc) + (
        duree_validite
        or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    donnees_a_encoder.update({
        "exp": expiration
    })

    return jwt.encode(
        donnees_a_encoder,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def decoder_access_token(token: str) -> dict:
    return jwt.decode(
        token,
        SECRET_KEY,
        algorithms=[ALGORITHM]
    )
