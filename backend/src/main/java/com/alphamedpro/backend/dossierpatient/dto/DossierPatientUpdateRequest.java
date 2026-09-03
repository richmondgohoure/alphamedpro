package com.alphamedpro.backend.dossierpatient.dto;

import java.util.List;

public record DossierPatientUpdateRequest(
        String groupeSanguin,
        String rhesus,
        Double poids,
        Double taille,
        String tensionArterielle,
        String observationsGenerales,
        List<AntecedentRequest> antecedents
) {
}
