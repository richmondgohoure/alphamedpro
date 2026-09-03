package com.alphamedpro.backend.visite.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record SousFactureRequest(
        String codeCategorie,
        String libelleCategorie,
        Long assuranceId,
        Long garantId,
        Long medecinId,
        BigDecimal montantBrut,
        BigDecimal partAssurance,
        BigDecimal partPatient,
        LocalDateTime dateCreation,
        List<SousFactureDetailRequest> details
) {
}
