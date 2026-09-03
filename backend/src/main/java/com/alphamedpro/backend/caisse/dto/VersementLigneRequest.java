package com.alphamedpro.backend.caisse.dto;

import java.math.BigDecimal;

public record VersementLigneRequest(
        Long sousFactureId,
        BigDecimal montantImpute,
        BigDecimal remiseImputee
) {}
