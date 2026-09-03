package com.alphamedpro.backend.medecin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MedecinRequest(
        @NotBlank(message = "Le nom du médecin est obligatoire")
        @Size(max = 100, message = "Le nom ne peut pas dépasser 100 caractères")
        String nom,

        @NotBlank(message = "Le prénom du médecin est obligatoire")
        @Size(max = 100, message = "Le prénom ne peut pas dépasser 100 caractères")
        String prenom,

        String titre,

        @NotBlank(message = "La spécialité est obligatoire")
        @Size(max = 150, message = "La spécialité ne peut pas dépasser 150 caractères")
        String specialite,

        @NotBlank(message = "Le type de médecin est obligatoire (INTERNE ou EXTERNE)")
        String typeMedecin,

        @NotBlank(message = "Le numéro de téléphone est obligatoire")
        @Size(max = 50, message = "Le numéro de téléphone ne peut pas dépasser 50 caractères")
        String numeroTelephone,

        String email,

        String centreDeSante,

        String code,

        String adresse,

        Boolean actif
) {
}
