package com.alphamedpro.backend.caisse.dto;

import com.alphamedpro.backend.caisse.ModePaiement;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record VersementRequest(
        LocalDateTime dateVersement,
        BigDecimal montantVerse,
        BigDecimal remise,
        ModePaiement modePaiement,
        String referencePaiement,
        String caissier,
        String observations,
        List<Long> sousFactureIds,
        List<VersementLigneRequest> lignes
) {}
