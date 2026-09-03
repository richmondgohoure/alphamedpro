package com.alphamedpro.backend.visite.dto;

import com.alphamedpro.backend.visite.SousFacture;
import com.alphamedpro.backend.visite.StatutPaiement;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record SousFactureResponse(
        Long id,
        String numeroSousFacture,
        String codeCategorie,
        String libelleCategorie,
        Long patientId,
        String patientNom,
        String patientPrenom,
        Long assuranceId,
        String assuranceLibelle,
        Long garantId,
        String garantLibelle,
        Long medecinId,
        String medecinNomComplet,
        BigDecimal montantBrut,
        BigDecimal partAssurance,
        BigDecimal partPatient,
        BigDecimal remise,
        BigDecimal montantPaye,
        BigDecimal resteAPayer,
        StatutPaiement statutPaiement,
        LocalDateTime dateCreation,
        List<SousFactureDetailResponse> details
) {
    public static SousFactureResponse from(SousFacture sf) {
        String medNom = null;
        if (sf.getMedecin() != null) {
            String titre = sf.getMedecin().getTitre() != null ? sf.getMedecin().getTitre() + " " : "";
            medNom = titre + sf.getMedecin().getNom() + " " + sf.getMedecin().getPrenom();
        }

        BigDecimal partPat = sf.getPartPatient() != null ? sf.getPartPatient() : BigDecimal.ZERO;
        BigDecimal rem = sf.getRemise() != null ? sf.getRemise() : BigDecimal.ZERO;
        BigDecimal paye = sf.getMontantPaye() != null ? sf.getMontantPaye() : BigDecimal.ZERO;
        BigDecimal reste = partPat.subtract(rem).subtract(paye);
        if (reste.compareTo(BigDecimal.ZERO) < 0) {
            reste = BigDecimal.ZERO;
        }

        return new SousFactureResponse(
                sf.getId(),
                sf.getNumeroSousFacture(),
                sf.getCodeCategorie(),
                sf.getLibelleCategorie(),
                sf.getPatient() != null ? sf.getPatient().getId() : null,
                sf.getPatient() != null ? sf.getPatient().getNom() : null,
                sf.getPatient() != null ? sf.getPatient().getPrenom() : null,
                sf.getAssurance() != null ? sf.getAssurance().getId() : null,
                sf.getAssurance() != null ? sf.getAssurance().getLibelle() : null,
                sf.getGarant() != null ? sf.getGarant().getId() : null,
                sf.getGarant() != null ? sf.getGarant().getLibelle() : null,
                sf.getMedecin() != null ? sf.getMedecin().getId() : null,
                medNom,
                sf.getMontantBrut(),
                sf.getPartAssurance(),
                partPat,
                rem,
                paye,
                reste,
                sf.getStatutPaiement() != null ? sf.getStatutPaiement() : StatutPaiement.NON_PAYE,
                sf.getDateCreation(),
                sf.getDetails() != null
                        ? sf.getDetails().stream().map(SousFactureDetailResponse::from).toList()
                        : List.of()
        );
    }
}
