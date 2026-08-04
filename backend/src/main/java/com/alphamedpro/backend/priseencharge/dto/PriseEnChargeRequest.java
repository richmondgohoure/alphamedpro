package com.alphamedpro.backend.priseencharge.dto;

import com.alphamedpro.backend.priseencharge.StatutPriseEnCharge;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PriseEnChargeRequest(
        Long assuranceId,
        @NotNull(message = "La date de la demande est obligatoire") LocalDate dateDemande,
        @NotBlank(message = "Le motif est obligatoire") String motif,
        BigDecimal montant,
        StatutPriseEnCharge statut,
        String observation
) {
}
