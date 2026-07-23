package com.alphamedpro.backend.patient.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;

import java.time.LocalDate;
import java.util.List;

public record PatientRequest(
        @NotBlank(message = "Le nom est obligatoire") String nom,
        @NotBlank(message = "Le prénom est obligatoire") String prenom,
        @PastOrPresent(message = "La date de naissance doit être dans le passé") LocalDate dateNaissance,
        String numeroTelephone,
        String quartier,
        String profession,
        List<PatientAssuranceRequest> assurances
) {
}
