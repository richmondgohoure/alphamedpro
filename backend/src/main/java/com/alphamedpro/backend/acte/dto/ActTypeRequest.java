package com.alphamedpro.backend.acte.dto;

import jakarta.validation.constraints.NotBlank;

public record ActTypeRequest(@NotBlank String code, @NotBlank String libelle) {
}
