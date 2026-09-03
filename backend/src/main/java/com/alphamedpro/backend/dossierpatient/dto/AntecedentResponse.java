package com.alphamedpro.backend.dossierpatient.dto;

import com.alphamedpro.backend.dossierpatient.AntecedentPatient;
import com.alphamedpro.backend.dossierpatient.GroupeAntecedent;

public record AntecedentResponse(
        Long id,
        GroupeAntecedent groupe,
        String libelleGroupe,
        String libelle,
        boolean actif,
        String details,
        Integer annee,
        int ordre
) {
    public static AntecedentResponse from(AntecedentPatient entity) {
        return new AntecedentResponse(
                entity.getId(),
                entity.getGroupe(),
                entity.getGroupe() != null ? entity.getGroupe().getLibelleGroupe() : null,
                entity.getLibelle(),
                entity.isActif(),
                entity.getDetails(),
                entity.getAnnee(),
                entity.getOrdre()
        );
    }
}
