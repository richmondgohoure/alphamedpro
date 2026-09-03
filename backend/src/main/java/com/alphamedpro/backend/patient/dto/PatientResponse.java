package com.alphamedpro.backend.patient.dto;

import com.alphamedpro.backend.patient.Patient;

import java.time.LocalDate;
import java.util.List;

public record PatientResponse(
        Long id,
        String nom,
        String prenom,
        LocalDate dateNaissance,
        String numeroTelephone,
        String quartier,
        String profession,
        String code,
        Long dossierId,
        String numeroDossier,
        List<PatientAssuranceResponse> assurances
) {
    public static PatientResponse from(Patient patient) {
        Long dossierId = patient.getDossierPatient() != null ? patient.getDossierPatient().getId() : null;
        String numeroDossier = patient.getDossierPatient() != null ? patient.getDossierPatient().getNumeroDossier() : null;

        return new PatientResponse(
                patient.getId(),
                patient.getNom(),
                patient.getPrenom(),
                patient.getDateNaissance(),
                patient.getNumeroTelephone(),
                patient.getQuartier(),
                patient.getProfession(),
                patient.getCode(),
                dossierId,
                numeroDossier,
                patient.getAssurances().stream().map(PatientAssuranceResponse::from).toList()
        );
    }
}
