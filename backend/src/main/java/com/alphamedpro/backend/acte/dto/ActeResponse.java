package com.alphamedpro.backend.acte.dto;

import com.alphamedpro.backend.acte.Acte;

import java.math.BigDecimal;

public record ActeResponse(
        Long id,
        ActTypeResponse actType,
        String libelle,
        BigDecimal prixFixe,
        BigDecimal coefficientB,
        String unitePrincipale,
        String uniteSecondaire,
        String typeAnalyse,
        String referenceHommeAdulte,
        String referenceFemmeAdulte,
        String referenceEnfant,
        String referenceNourrisson,
        Long numeroOrdre,
        BigDecimal coefficientZ,
        BigDecimal coefficientK,
        String typeConsultation
) {
    public static ActeResponse from(Acte acte) {
        return new ActeResponse(
                acte.getId(),
                ActTypeResponse.from(acte.getActType()),
                acte.getLibelle(),
                acte.getPrixFixe(),
                acte.getCoefficientB(),
                acte.getUnitePrincipale(),
                acte.getUniteSecondaire(),
                acte.getTypeAnalyse(),
                acte.getReferenceHommeAdulte(),
                acte.getReferenceFemmeAdulte(),
                acte.getReferenceEnfant(),
                acte.getReferenceNourrisson(),
                acte.getNumeroOrdre(),
                acte.getCoefficientZ(),
                acte.getCoefficientK(),
                acte.getTypeConsultation()
        );
    }
}
