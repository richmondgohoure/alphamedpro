package com.alphamedpro.backend.caisse.dto;

import com.alphamedpro.backend.caisse.VersementLigne;

import java.math.BigDecimal;

public record VersementLigneResponse(
        Long id,
        Long sousFactureId,
        String numeroSousFacture,
        String codeCategorie,
        String libelleCategorie,
        BigDecimal montantImpute,
        BigDecimal remiseImputee
) {
    public static VersementLigneResponse from(VersementLigne ligne) {
        return new VersementLigneResponse(
                ligne.getId(),
                ligne.getSousFacture() != null ? ligne.getSousFacture().getId() : null,
                ligne.getSousFacture() != null ? ligne.getSousFacture().getNumeroSousFacture() : null,
                ligne.getSousFacture() != null ? ligne.getSousFacture().getCodeCategorie() : null,
                ligne.getSousFacture() != null ? ligne.getSousFacture().getLibelleCategorie() : null,
                ligne.getMontantImpute(),
                ligne.getRemiseImputee()
        );
    }
}
