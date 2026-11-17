
import os
import smtplib

from email.message import EmailMessage
from dotenv import load_dotenv


load_dotenv()


def envoyer_facture_email(
    destinataire: str,
    numero_facture: str,
    pdf_content: bytes
):
    expediteur = os.getenv("MAIL_FROM")
    mot_de_passe = os.getenv("MAIL_PASSWORD")
    serveur = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    port = int(os.getenv("MAIL_PORT", "587"))

    if not expediteur or not mot_de_passe:
        raise ValueError(
            "Configuration Gmail incomplète dans le fichier .env."
        )

    message = EmailMessage()

    message["Subject"] = f"Votre facture OrderFlow - {numero_facture}"
    message["From"] = expediteur
    message["To"] = destinataire

    message.set_content(
        f"""
Bonjour,

Veuillez trouver en pièce jointe votre facture
{numero_facture}, générée par OrderFlow.

Nous vous remercions pour votre confiance.

Cordialement,
L'équipe OrderFlow.
"""
    )

    message.add_attachment(
        pdf_content,
        maintype="application",
        subtype="pdf",
        filename=f"{numero_facture}.pdf"
    )

    with smtplib.SMTP(serveur, port) as smtp:
        smtp.ehlo()
        smtp.starttls()
        smtp.ehlo()

        smtp.login(expediteur, mot_de_passe)
        smtp.send_message(message)

    return True
