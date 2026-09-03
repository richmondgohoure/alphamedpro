package com.alphamedpro.backend.visite.dto;

import com.alphamedpro.backend.visite.SousFactureDetail;

import java.math.BigDecimal;

public record SousFactureDetailResponse(
        Long id,
        Long acteId,
        String libelleActe,
        String category,
        BigDecimal prixUnitaire,
        Integer quantite,
        BigDecimal montantBrut,
        BigDecimal partAssurance,
        BigDecimal partPatient,
        BigDecimal tauxCouverture,
        String typeCouverture,
        BigDecimal montantForfait,
        String coefficientInfo,
        String tarifFormula,
        Long medecinId,
        String medecinNomComplet
) {
    public static SousFactureDetailResponse from(SousFactureDetail d) {
        String medNom = null;
        if (d.getMedecin() != null) {
            String titre = d.getMedecin().getTitre() != null ? d.getMedecin().getTitre() + " " : "";
            medNom = titre + d.getMedecin().getNom() + " " + d.getMedecin().getPrenom();
        }
        return new SousFactureDetailResponse(
                d.getId(),
                d.getActe() != null ? d.getActe().getId() : null,
                d.getLibelleActe(),
                d.getCategory(),
                d.getPrixUnitaire(),
                d.getQuantite(),
                d.getMontantBrut(),
                d.getPartAssurance(),
                d.getPartPatient(),
                d.getTauxCouverture(),
                d.getTypeCouverture(),
                d.getMontantForfait(),
                d.getCoefficientInfo(),
                d.getTarifFormula(),
                d.getMedecin() != null ? d.getMedecin().getId() : null,
                medNom
        );
    }
}
