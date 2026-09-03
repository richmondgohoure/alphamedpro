package com.alphamedpro.backend.visite.dto;

import com.alphamedpro.backend.visite.StatutPaiement;
import com.alphamedpro.backend.visite.Visite;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record VisiteResponse(
        Long id,
        String numeroVisite,
        Long patientId,
        String patientNom,
        String patientPrenom,
        String patientTelephone,
        String patientCode,
        String patientNumeroDossier,
        Long priseEnChargeId,
        LocalDateTime dateVisite,
        LocalDateTime dateCreation,
        BigDecimal montantTotalBrut,
        BigDecimal totalPartAssurance,
        BigDecimal totalPartPatient,
        BigDecimal totalRemise,
        BigDecimal totalPaye,
        BigDecimal totalResteAPayer,
        StatutPaiement statutPaiement,
        int versementsCount,
        List<SousFactureResponse> sousFactures
) {
    public static VisiteResponse from(Visite visite) {
        String code = null;
        String tel = null;
        String dossier = null;
        if (visite.getPatient() != null) {
            code = visite.getPatient().getCode();
            tel = visite.getPatient().getNumeroTelephone();
            if (visite.getPatient().getDossierPatient() != null) {
                dossier = visite.getPatient().getDossierPatient().getNumeroDossier();
            }
        }

        List<SousFactureResponse> sfResponses = visite.getSousFactures() != null
                ? visite.getSousFactures().stream().map(SousFactureResponse::from).toList()
                : List.of();

        BigDecimal brut = BigDecimal.ZERO;
        BigDecimal partAssur = BigDecimal.ZERO;
        BigDecimal partPat = BigDecimal.ZERO;
        BigDecimal remise = BigDecimal.ZERO;
        BigDecimal paye = BigDecimal.ZERO;

        for (var sf : sfResponses) {
            if (sf.montantBrut() != null) brut = brut.add(sf.montantBrut());
            if (sf.partAssurance() != null) partAssur = partAssur.add(sf.partAssurance());
            if (sf.partPatient() != null) partPat = partPat.add(sf.partPatient());
            if (sf.remise() != null) remise = remise.add(sf.remise());
            if (sf.montantPaye() != null) paye = paye.add(sf.montantPaye());
        }

        BigDecimal reste = partPat.subtract(remise).subtract(paye);
        if (reste.compareTo(BigDecimal.ZERO) < 0) {
            reste = BigDecimal.ZERO;
        }

        StatutPaiement statut = visite.getStatutPaiement();
        if (statut == null) {
            if (partPat.compareTo(BigDecimal.ZERO) == 0 || reste.compareTo(BigDecimal.ZERO) == 0 && paye.compareTo(BigDecimal.ZERO) > 0) {
                statut = StatutPaiement.PAYE;
            } else if (paye.compareTo(BigDecimal.ZERO) > 0 || remise.compareTo(BigDecimal.ZERO) > 0) {
                statut = StatutPaiement.PARTIELLEMENT_PAYE;
            } else {
                statut = StatutPaiement.NON_PAYE;
            }
        }

        int count = visite.getVersements() != null ? visite.getVersements().size() : 0;

        return new VisiteResponse(
                visite.getId(),
                visite.getNumeroVisite(),
                visite.getPatient() != null ? visite.getPatient().getId() : null,
                visite.getPatient() != null ? visite.getPatient().getNom() : null,
                visite.getPatient() != null ? visite.getPatient().getPrenom() : null,
                tel,
                code,
                dossier,
                visite.getPriseEnCharge() != null ? visite.getPriseEnCharge().getId() : null,
                visite.getDateVisite(),
                visite.getDateCreation(),
                brut,
                partAssur,
                partPat,
                remise,
                paye,
                reste,
                statut,
                count,
                sfResponses
        );
    }
}
