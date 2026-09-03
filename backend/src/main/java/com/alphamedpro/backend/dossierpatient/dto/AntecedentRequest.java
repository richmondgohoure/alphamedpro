package com.alphamedpro.backend.dossierpatient.dto;

import com.alphamedpro.backend.dossierpatient.GroupeAntecedent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AntecedentRequest(
        Long id,
        @NotNull(message = "Le groupe d'antécédent est obligatoire")
        GroupeAntecedent groupe,
        @NotBlank(message = "Le libellé de l'antécédent est obligatoire")
        String libelle,
        boolean actif,
        String details,
        Integer annee,
        int ordre
) {
}
