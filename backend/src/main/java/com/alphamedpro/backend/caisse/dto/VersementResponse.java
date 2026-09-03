package com.alphamedpro.backend.caisse.dto;

import com.alphamedpro.backend.caisse.ModePaiement;
import com.alphamedpro.backend.caisse.Versement;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record VersementResponse(
        Long id,
        String numeroVersement,
        Long visiteId,
        String numeroVisite,
        Long patientId,
        String patientNom,
        String patientPrenom,
        String patientTelephone,
        String patientCode,
        String patientNumeroDossier,
        LocalDateTime dateVersement,
        BigDecimal montantTotal,
        BigDecimal remise,
        BigDecimal montantVerse,
        BigDecimal monnaieRendue,
        BigDecimal resteAPayer,
        ModePaiement modePaiement,
        String referencePaiement,
        String caissier,
        String observations,
        List<VersementLigneResponse> lignes
) {
    public static VersementResponse from(Versement v) {
        String code = null;
        String tel = null;
        String dossier = null;
        if (v.getPatient() != null) {
            code = v.getPatient().getCode();
            tel = v.getPatient().getNumeroTelephone();
            if (v.getPatient().getDossierPatient() != null) {
                dossier = v.getPatient().getDossierPatient().getNumeroDossier();
            }
        }
        return new VersementResponse(
                v.getId(),
                v.getNumeroVersement(),
                v.getVisite() != null ? v.getVisite().getId() : null,
                v.getVisite() != null ? v.getVisite().getNumeroVisite() : null,
                v.getPatient() != null ? v.getPatient().getId() : null,
                v.getPatient() != null ? v.getPatient().getNom() : null,
                v.getPatient() != null ? v.getPatient().getPrenom() : null,
                tel,
                code,
                dossier,
                v.getDateVersement(),
                v.getMontantTotal(),
                v.getRemise(),
                v.getMontantVerse(),
                v.getMonnaieRendue(),
                v.getResteAPayer(),
                v.getModePaiement(),
                v.getReferencePaiement(),
                v.getCaissier(),
                v.getObservations(),
                v.getLignes() != null
                        ? v.getLignes().stream().map(VersementLigneResponse::from).toList()
                        : List.of()
        );
    }
}
