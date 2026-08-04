package com.alphamedpro.backend.priseencharge.dto;

import com.alphamedpro.backend.priseencharge.PriseEnCharge;
import com.alphamedpro.backend.priseencharge.StatutPriseEnCharge;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PriseEnChargeResponse(
        Long id,
        Long patientId,
        Long assuranceId,
        String assuranceLibelle,
        LocalDate dateDemande,
        String motif,
        BigDecimal montant,
        StatutPriseEnCharge statut,
        String observation
) {
    public static PriseEnChargeResponse from(PriseEnCharge priseEnCharge) {
        return new PriseEnChargeResponse(
                priseEnCharge.getId(),
                priseEnCharge.getPatient().getId(),
                priseEnCharge.getAssurance() != null ? priseEnCharge.getAssurance().getId() : null,
                priseEnCharge.getAssurance() != null ? priseEnCharge.getAssurance().getLibelle() : null,
                priseEnCharge.getDateDemande(),
                priseEnCharge.getMotif(),
                priseEnCharge.getMontant(),
                priseEnCharge.getStatut(),
                priseEnCharge.getObservation()
        );
    }
}
