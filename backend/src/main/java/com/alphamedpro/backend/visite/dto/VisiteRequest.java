package com.alphamedpro.backend.visite.dto;

import java.time.LocalDateTime;
import java.util.List;

public record VisiteRequest(
        Long priseEnChargeId,
        Long assuranceId,
        Long garantId,
        LocalDateTime dateVisite,
        List<SousFactureRequest> sousFactures
) {
}
