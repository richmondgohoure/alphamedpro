package com.alphamedpro.backend.patient.dto;

import jakarta.validation.constraints.NotNull;

public record PatientAssuranceRequest(
        @NotNull(message = "L'assurance est obligatoire") Long assuranceId,
        String numeroMatricule
) {
}
