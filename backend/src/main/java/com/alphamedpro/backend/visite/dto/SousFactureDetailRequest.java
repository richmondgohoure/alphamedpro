package com.alphamedpro.backend.visite.dto;

import java.math.BigDecimal;

public record SousFactureDetailRequest(
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
        Long medecinId
) {
}
