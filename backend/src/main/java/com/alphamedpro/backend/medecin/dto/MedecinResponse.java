package com.alphamedpro.backend.medecin.dto;

import com.alphamedpro.backend.medecin.Medecin;

public record MedecinResponse(
        Long id,
        String nom,
        String prenom,
        String titre,
        String nomComplet,
        String specialite,
        String typeMedecin,
        String numeroTelephone,
        String email,
        String centreDeSante,
        String code,
        String adresse,
        Boolean actif
) {
    public static MedecinResponse from(Medecin m) {
        String titreStr = (m.getTitre() != null && !m.getTitre().isBlank()) ? m.getTitre().trim() : "Dr.";
        String nomStr = m.getNom() != null ? m.getNom().trim() : "";
        String prenomStr = m.getPrenom() != null ? m.getPrenom().trim() : "";
        String full = titreStr + " " + (nomStr + " " + prenomStr).trim();

        return new MedecinResponse(
                m.getId(),
                m.getNom(),
                m.getPrenom(),
                titreStr,
                full.trim(),
                m.getSpecialite(),
                m.getTypeMedecin() != null ? m.getTypeMedecin() : "INTERNE",
                m.getNumeroTelephone(),
                m.getEmail(),
                m.getCentreDeSante(),
                m.getCode(),
                m.getAdresse(),
                m.getActif() != null ? m.getActif() : true
        );
    }
}
