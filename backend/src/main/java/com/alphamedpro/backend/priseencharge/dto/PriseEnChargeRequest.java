package com.alphamedpro.backend.priseencharge.dto;

import com.alphamedpro.backend.priseencharge.StatutPriseEnCharge;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PriseEnChargeRequest(
        Long assuranceId,
        @NotNull(message = "La date de la demande est obligatoire") LocalDateTime dateDemande,
        @NotBlank(message = "Le motif est obligatoire") String motif,
        BigDecimal montant,
        String typeCouverture,
        BigDecimal tauxCouverture,
        BigDecimal montantForfait,
        BigDecimal montantTotal,
        BigDecimal partAssurance,
        BigDecimal partPatient,
        String detailsActes,
        StatutPriseEnCharge statut,
        String observation
) {
}
