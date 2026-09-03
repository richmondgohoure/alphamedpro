package com.alphamedpro.backend.dossierpatient.dto;

import com.alphamedpro.backend.dossierpatient.DossierPatient;
import com.alphamedpro.backend.patient.Patient;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record DossierPatientResponse(
        Long id,
        String numeroDossier,
        Long patientId,
        String nomPatient,
        String prenomPatient,
        LocalDate dateNaissance,
        String numeroTelephone,
        String quartier,
        String profession,
        String codePatient,
        LocalDateTime dateCreation,
        LocalDateTime dateDerniereModification,
        String groupeSanguin,
        String rhesus,
        Double poids,
        Double taille,
        String tensionArterielle,
        String observationsGenerales,
        List<AntecedentResponse> antecedents
) {
    public static DossierPatientResponse from(DossierPatient dossier) {
        Patient p = dossier.getPatient();
        return new DossierPatientResponse(
                dossier.getId(),
                dossier.getNumeroDossier(),
                p != null ? p.getId() : null,
                p != null ? p.getNom() : null,
                p != null ? p.getPrenom() : null,
                p != null ? p.getDateNaissance() : null,
                p != null ? p.getNumeroTelephone() : null,
                p != null ? p.getQuartier() : null,
                p != null ? p.getProfession() : null,
                p != null ? p.getCode() : null,
                dossier.getDateCreation(),
                dossier.getDateDerniereModification(),
                dossier.getGroupeSanguin(),
                dossier.getRhesus(),
                dossier.getPoids(),
                dossier.getTaille(),
                dossier.getTensionArterielle(),
                dossier.getObservationsGenerales(),
                dossier.getAntecedents() != null
                        ? dossier.getAntecedents().stream().map(AntecedentResponse::from).toList()
                        : List.of()
        );
    }
}
