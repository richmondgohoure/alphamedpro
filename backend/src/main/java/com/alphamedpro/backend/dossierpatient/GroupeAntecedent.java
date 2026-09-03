package com.alphamedpro.backend.dossierpatient;

public enum GroupeAntecedent {
    ALLERGIES("Allergies"),
    MEDICAUX("Antécédents Médicaux"),
    CHIRURGICAUX("Antécédents Chirurgicaux"),
    GYNECO_OBSTETRIQUES("Gynécologiques & Obstétriques"),
    VACCINATIONS("Vaccinations"),
    FAMILIAUX("Antécédents Familiaux"),
    HABITUDES_VIE("Habitudes de vie & Facteurs de risque");

    private final String libelleGroupe;

    GroupeAntecedent(String libelleGroupe) {
        this.libelleGroupe = libelleGroupe;
    }

    public String getLibelleGroupe() {
        return libelleGroupe;
    }
}
