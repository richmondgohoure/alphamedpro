package com.alphamedpro.backend.priseencharge.dto;

import com.alphamedpro.backend.priseencharge.PriseEnCharge;
import com.alphamedpro.backend.priseencharge.StatutPriseEnCharge;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PriseEnChargeResponse(
        Long id,
        Long patientId,
        Long assuranceId,
        String assuranceLibelle,
        LocalDateTime dateDemande,
        String motif,
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
    public static PriseEnChargeResponse from(PriseEnCharge priseEnCharge) {
        return new PriseEnChargeResponse(
                priseEnCharge.getId(),
                priseEnCharge.getPatient().getId(),
                priseEnCharge.getAssurance() != null ? priseEnCharge.getAssurance().getId() : null,
                priseEnCharge.getAssurance() != null ? priseEnCharge.getAssurance().getLibelle() : null,
                priseEnCharge.getDateDemande(),
                priseEnCharge.getMotif(),
                priseEnCharge.getMontant(),
                priseEnCharge.getTypeCouverture(),
                priseEnCharge.getTauxCouverture(),
                priseEnCharge.getMontantForfait(),
                priseEnCharge.getMontantTotal(),
                priseEnCharge.getPartAssurance(),
                priseEnCharge.getPartPatient(),
                priseEnCharge.getDetailsActes(),
                priseEnCharge.getStatut(),
                priseEnCharge.getObservation()
        );
    }
}
