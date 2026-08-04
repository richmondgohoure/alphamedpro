package com.alphamedpro.backend.acte.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ActeRequest(
        @NotNull Long actTypeId,
        @NotBlank String libelle,
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
}
