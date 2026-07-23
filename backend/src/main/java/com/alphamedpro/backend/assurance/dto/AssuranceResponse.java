package com.alphamedpro.backend.assurance.dto;

import com.alphamedpro.backend.assurance.Assurance;
import com.alphamedpro.backend.garant.dto.GarantSummary;

import java.math.BigDecimal;
import java.util.List;

public record AssuranceResponse(
        Long id,
        String libelle,
        String ncc,
        String numeroTelephone,
        String email,
        BigDecimal prixConsultationGeneraliste,
        BigDecimal prixConsultationSpecialiste,
        BigDecimal coutB,
        BigDecimal coutZ,
        BigDecimal coutK,
        BigDecimal prixChambreTriple,
        BigDecimal prixChambreDouble,
        BigDecimal prixChambreIndividuelleSimple,
        BigDecimal prixChambreVip,
        BigDecimal prixChambreVvip,
        List<GarantSummary> garants,
        int nombrePatients
) {
    public static AssuranceResponse from(Assurance assurance) {
        return new AssuranceResponse(
                assurance.getId(),
                assurance.getLibelle(),
                assurance.getNcc(),
                assurance.getNumeroTelephone(),
                assurance.getEmail(),
                assurance.getPrixConsultationGeneraliste(),
                assurance.getPrixConsultationSpecialiste(),
                assurance.getCoutB(),
                assurance.getCoutZ(),
                assurance.getCoutK(),
                assurance.getPrixChambreTriple(),
                assurance.getPrixChambreDouble(),
                assurance.getPrixChambreIndividuelleSimple(),
                assurance.getPrixChambreVip(),
                assurance.getPrixChambreVvip(),
                assurance.getGarants().stream().map(GarantSummary::from).toList(),
                assurance.getPatientAssurances().size()
        );
    }
}
