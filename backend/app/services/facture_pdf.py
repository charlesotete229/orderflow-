
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable
)


def generer_pdf_facture(
    facture,
    commande,
    client,
    details,
    produits,
    montant_paye
):
    buffer = BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm
    )

    styles = getSampleStyleSheet()

    titre = ParagraphStyle(
        "TitreFacture",
        parent=styles["Title"],
        fontSize=22,
        textColor=colors.HexColor("#17365D"),
        alignment=TA_CENTER,
        spaceAfter=15
    )

    sous_titre = ParagraphStyle(
        "SousTitre",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#555555"),
        alignment=TA_CENTER
    )

    elements = []

    # En-tête
    elements.append(Paragraph("ORDERFLOW", titre))

    elements.append(
        Paragraph(
            "GESTION COMMERCIALE ET FACTURATION",
            sous_titre
        )
    )

    elements.append(Spacer(1, 15))

    elements.append(
        HRFlowable(
            width="100%",
            color=colors.HexColor("#17365D")
        )
    )

    elements.append(Spacer(1, 20))

    elements.append(
        Paragraph("FACTURE", styles["Heading1"])
    )

    # Informations de la facture
    informations = [
        ["Numéro :", facture.numero_facture],
        ["Date d'émission :", str(facture.date_emission)],
        ["Numéro de commande :", commande.numero_commande],
        ["Statut :", facture.statut]
    ]

    tableau_infos = Table(
        informations,
        colWidths=[55 * mm, 100 * mm]
    )

    tableau_infos.setStyle(
        TableStyle([
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE")
        ])
    )

    elements.append(tableau_infos)
    elements.append(Spacer(1, 20))

    # Informations du client
    elements.append(
        Paragraph("INFORMATIONS DU CLIENT", styles["Heading2"])
    )

    if client:
        nom_client = f"{client.nom} {client.prenom}"
        telephone = client.telephone or "Non renseigné"
        email = client.email or "Non renseigné"
        adresse = client.adresse or "Non renseignée"
    else:
        nom_client = "Client de passage"
        telephone = "Non renseigné"
        email = "Non renseigné"
        adresse = "Non renseignée"

    elements.append(
        Paragraph(
            f"<b>Nom :</b> {nom_client}",
            styles["Normal"]
        )
    )

    elements.append(
        Paragraph(
            f"<b>Téléphone :</b> {telephone}",
            styles["Normal"]
        )
    )

    elements.append(
        Paragraph(
            f"<b>Email :</b> {email}",
            styles["Normal"]
        )
    )

    elements.append(
        Paragraph(
            f"<b>Adresse :</b> {adresse}",
            styles["Normal"]
        )
    )

    elements.append(Spacer(1, 20))

    # Détails des produits
    elements.append(
        Paragraph("DÉTAIL DES PRODUITS", styles["Heading2"])
    )

    donnees = [
        ["Produit", "Quantité", "Prix unitaire", "Sous-total"]
    ]

    for detail in details:
        produit = produits.get(detail.produit_id)

        nom_produit = (
            produit.nom if produit else
            f"Produit {detail.produit_id}"
        )

        donnees.append([
            nom_produit,
            str(detail.quantite),
            f"{detail.prix_unitaire:,.2f} F",
            f"{detail.sous_total:,.2f} F"
        ])

    tableau_produits = Table(
        donnees,
        colWidths=[65 * mm, 22 * mm, 38 * mm, 38 * mm],
        repeatRows=1
    )

    tableau_produits.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0),
             colors.HexColor("#17365D")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1),
             [colors.white, colors.HexColor("#F2F5F9")]),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 9)
        ])
    )

    elements.append(tableau_produits)
    elements.append(Spacer(1, 20))

    # Récapitulatif financier
    montant_restant = facture.montant_total - montant_paye

    recapitulatif = [
        ["Montant total :", f"{facture.montant_total:,.2f} F"],
        ["Montant payé :", f"{montant_paye:,.2f} F"],
        ["Reste à payer :", f"{montant_restant:,.2f} F"]
    ]

    tableau_recap = Table(
        recapitulatif,
        colWidths=[110 * mm, 53 * mm]
    )

    tableau_recap.setStyle(
        TableStyle([
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTNAME", (1, 0), (1, -1), "Helvetica-Bold"),
            ("ALIGN", (1, 0), (1, -1), "RIGHT"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LINEABOVE", (0, 0), (-1, 0), 1,
             colors.HexColor("#17365D"))
        ])
    )

    elements.append(tableau_recap)
    elements.append(Spacer(1, 35))

    elements.append(
        Paragraph(
            "Merci pour votre confiance !",
            ParagraphStyle(
                "Remerciement",
                parent=styles["Normal"],
                alignment=TA_CENTER,
                fontSize=12,
                textColor=colors.HexColor("#17365D")
            )
        )
    )

    document.build(elements)

    buffer.seek(0)

    return buffer
