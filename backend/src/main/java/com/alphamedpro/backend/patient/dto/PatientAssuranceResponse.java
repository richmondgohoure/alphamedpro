package com.alphamedpro.backend.patient.dto;

import com.alphamedpro.backend.patientassurance.PatientAssurance;

public record PatientAssuranceResponse(
        Long assuranceId,
        String libelle,
        String ncc,
        String numeroMatricule
) {
    public static PatientAssuranceResponse from(PatientAssurance patientAssurance) {
        return new PatientAssuranceResponse(
                patientAssurance.getAssurance().getId(),
                patientAssurance.getAssurance().getLibelle(),
                patientAssurance.getAssurance().getNcc(),
                patientAssurance.getNumeroMatricule()
        );
    }
}
