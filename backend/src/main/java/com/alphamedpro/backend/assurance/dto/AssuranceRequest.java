package com.alphamedpro.backend.assurance.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.util.List;

public record AssuranceRequest(
        @NotBlank(message = "Le libellé est obligatoire") String libelle,
        String ncc,
        String numeroTelephone,
        @Email(message = "Email invalide") String email,
        @PositiveOrZero(message = "Doit être positif") BigDecimal prixConsultationGeneraliste,
        @PositiveOrZero(message = "Doit être positif") BigDecimal prixConsultationSpecialiste,
        @PositiveOrZero(message = "Doit être positif") BigDecimal coutB,
        @PositiveOrZero(message = "Doit être positif") BigDecimal coutZ,
        @PositiveOrZero(message = "Doit être positif") BigDecimal coutK,
        @PositiveOrZero(message = "Doit être positif") BigDecimal prixChambreTriple,
        @PositiveOrZero(message = "Doit être positif") BigDecimal prixChambreDouble,
        @PositiveOrZero(message = "Doit être positif") BigDecimal prixChambreIndividuelleSimple,
        @PositiveOrZero(message = "Doit être positif") BigDecimal prixChambreVip,
        @PositiveOrZero(message = "Doit être positif") BigDecimal prixChambreVvip,
        List<Long> garantIds
) {
}
