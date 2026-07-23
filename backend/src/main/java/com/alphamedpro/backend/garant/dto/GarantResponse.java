package com.alphamedpro.backend.garant.dto;

import com.alphamedpro.backend.garant.Garant;

public record GarantResponse(
        Long id,
        String libelle,
        String numeroTelephone,
        String email,
        int nombreAssurances
) {
    public static GarantResponse from(Garant garant) {
        return new GarantResponse(
                garant.getId(),
                garant.getLibelle(),
                garant.getNumeroTelephone(),
                garant.getEmail(),
                garant.getAssurances().size()
        );
    }
}
