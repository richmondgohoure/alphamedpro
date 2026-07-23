package com.alphamedpro.backend.garant.dto;

import com.alphamedpro.backend.garant.Garant;

public record GarantSummary(Long id, String libelle, String numeroTelephone, String email) {
    public static GarantSummary from(Garant garant) {
        return new GarantSummary(garant.getId(), garant.getLibelle(), garant.getNumeroTelephone(), garant.getEmail());
    }
}
