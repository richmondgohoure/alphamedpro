package com.alphamedpro.backend.patient.dto;

import com.alphamedpro.backend.patientassurance.PatientAssurance;

public record PatientAssuranceResponse(
        Long assuranceId,
        String libelle,
        String ncc,
        Long garantId,
        String garantLibelle,
        String numeroMatricule
) {
    public static PatientAssuranceResponse from(PatientAssurance patientAssurance) {
        Long gId = patientAssurance.getGarant() != null ? patientAssurance.getGarant().getId() : null;
        String gLibelle = patientAssurance.getGarant() != null ? patientAssurance.getGarant().getLibelle() : null;

        return new PatientAssuranceResponse(
                patientAssurance.getAssurance().getId(),
                patientAssurance.getAssurance().getLibelle(),
                patientAssurance.getAssurance().getNcc(),
                gId,
                gLibelle,
                patientAssurance.getNumeroMatricule()
        );
    }
}
