package com.alphamedpro.backend.acte.dto;

import jakarta.validation.constraints.NotBlank;

public record ServiceRequest(@NotBlank String libelle) {
}
