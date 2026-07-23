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
        List<PatientAssuranceResponse> assurances
) {
    public static PatientResponse from(Patient patient) {
        return new PatientResponse(
                patient.getId(),
                patient.getNom(),
                patient.getPrenom(),
                patient.getDateNaissance(),
                patient.getNumeroTelephone(),
                patient.getQuartier(),
                patient.getProfession(),
                patient.getAssurances().stream().map(PatientAssuranceResponse::from).toList()
        );
    }
}
