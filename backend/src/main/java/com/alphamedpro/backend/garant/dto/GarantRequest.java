package com.alphamedpro.backend.garant.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record GarantRequest(
        @NotBlank(message = "Le libellé est obligatoire") String libelle,
        String numeroTelephone,
        @Email(message = "Email invalide") String email
) {
}
