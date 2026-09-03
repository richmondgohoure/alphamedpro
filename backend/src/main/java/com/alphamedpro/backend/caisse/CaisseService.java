package com.alphamedpro.backend.caisse;

import com.alphamedpro.backend.caisse.dto.VersementLigneRequest;
import com.alphamedpro.backend.caisse.dto.VersementRequest;
import com.alphamedpro.backend.caisse.dto.VersementResponse;
import com.alphamedpro.backend.common.ResourceNotFoundException;
import com.alphamedpro.backend.visite.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class CaisseService {

    private final VisiteRepository visiteRepository;
    private final SousFactureRepository sousFactureRepository;
    private final VersementRepository versementRepository;
    private final VersementLigneRepository versementLigneRepository;

    /**
     * Enregistre un versement pour une visite avec sélection et imputation sur les sous-factures concernées.
     */
    public VersementResponse enregistrerVersement(Long visiteId, VersementRequest request) {
        Visite visite = visiteRepository.findById(visiteId)
                .orElseThrow(() -> new ResourceNotFoundException("Visite introuvable : " + visiteId));

        LocalDateTime dateVersement = request.dateVersement() != null ? request.dateVersement() : LocalDateTime.now();
        BigDecimal montantVerse = request.montantVerse() != null ? request.montantVerse() : BigDecimal.ZERO;
        BigDecimal remiseTotale = request.remise() != null ? request.remise() : BigDecimal.ZERO;
        ModePaiement modePaiement = request.modePaiement() != null ? request.modePaiement() : ModePaiement.ESPECES;

        // 1. Déterminer les sous-factures ciblées
        List<SousFacture> sousFacturesCibles = new ArrayList<>();
        if (request.sousFactureIds() != null && !request.sousFactureIds().isEmpty()) {
            Set<Long> ids = new HashSet<>(request.sousFactureIds());
            sousFacturesCibles = visite.getSousFactures().stream()
                    .filter(sf -> ids.contains(sf.getId()))
                    .toList();
        } else if (request.lignes() != null && !request.lignes().isEmpty()) {
            Set<Long> ids = new HashSet<>();
            for (VersementLigneRequest l : request.lignes()) {
                if (l.sousFactureId() != null) ids.add(l.sousFactureId());
            }
            sousFacturesCibles = visite.getSousFactures().stream()
                    .filter(sf -> ids.contains(sf.getId()))
                    .toList();
        } else {
            // Par défaut, toutes les sous-factures de la visite ayant encore un reste à payer
            sousFacturesCibles = visite.getSousFactures().stream()
                    .filter(sf -> {
                        BigDecimal partPat = sf.getPartPatient() != null ? sf.getPartPatient() : BigDecimal.ZERO;
                        BigDecimal rem = sf.getRemise() != null ? sf.getRemise() : BigDecimal.ZERO;
                        BigDecimal paye = sf.getMontantPaye() != null ? sf.getMontantPaye() : BigDecimal.ZERO;
                        return partPat.subtract(rem).subtract(paye).compareTo(BigDecimal.ZERO) > 0;
                    })
                    .toList();
            if (sousFacturesCibles.isEmpty()) {
                sousFacturesCibles = new ArrayList<>(visite.getSousFactures());
            }
        }

        if (sousFacturesCibles.isEmpty()) {
            throw new IllegalArgumentException("Aucune sous-facture sélectionnée pour ce versement.");
        }

        // Calcul du total restant dû sur les sous-factures sélectionnées avant versement
        BigDecimal totalResteSelection = BigDecimal.ZERO;
        for (SousFacture sf : sousFacturesCibles) {
            BigDecimal partPat = sf.getPartPatient() != null ? sf.getPartPatient() : BigDecimal.ZERO;
            BigDecimal rem = sf.getRemise() != null ? sf.getRemise() : BigDecimal.ZERO;
            BigDecimal paye = sf.getMontantPaye() != null ? sf.getMontantPaye() : BigDecimal.ZERO;
            BigDecimal reste = partPat.subtract(rem).subtract(paye);
            if (reste.compareTo(BigDecimal.ZERO) > 0) {
                totalResteSelection = totalResteSelection.add(reste);
            }
        }

        // 2. Générer le numéro de versement séquentiel REC{AA}-%07d
        String annee2Chiffres = String.format("%02d", dateVersement.getYear() % 100);
        String prefix = "REC" + annee2Chiffres;
        int nextSeq = versementRepository.findMaxSequenceForYear(prefix)
                .map(max -> max + 1)
                .orElse(1);
        String numeroVersement = String.format("%s-%07d", prefix, nextSeq);

        Versement versement = new Versement();
        versement.setNumeroVersement(numeroVersement);
        versement.setVisite(visite);
        versement.setPatient(visite.getPatient());
        versement.setDateVersement(dateVersement);
        versement.setMontantTotal(totalResteSelection);
        versement.setRemise(remiseTotale);
        versement.setMontantVerse(montantVerse);
        versement.setModePaiement(modePaiement);
        versement.setReferencePaiement(request.referencePaiement());
        versement.setCaissier(request.caissier() != null && !request.caissier().isBlank() ? request.caissier() : "Caisse Principale");
        versement.setObservations(request.observations());

        versement = versementRepository.save(versement);

        // 3. Imputation de la remise et du versement sur les sous-factures
        Map<Long, VersementLigneRequest> explicitLinesMap = new HashMap<>();
        if (request.lignes() != null) {
            for (VersementLigneRequest l : request.lignes()) {
                if (l.sousFactureId() != null) {
                    explicitLinesMap.put(l.sousFactureId(), l);
                }
            }
        }

        BigDecimal remiseRestanteADistribuer = remiseTotale;
        BigDecimal versementRestantADistribuer = montantVerse;

        for (SousFacture sf : sousFacturesCibles) {
            BigDecimal partPat = sf.getPartPatient() != null ? sf.getPartPatient() : BigDecimal.ZERO;
            BigDecimal remActuelle = sf.getRemise() != null ? sf.getRemise() : BigDecimal.ZERO;
            BigDecimal payeActuel = sf.getMontantPaye() != null ? sf.getMontantPaye() : BigDecimal.ZERO;
            BigDecimal resteSf = partPat.subtract(remActuelle).subtract(payeActuel);
            if (resteSf.compareTo(BigDecimal.ZERO) < 0) {
                resteSf = BigDecimal.ZERO;
            }

            BigDecimal remisePourSf = BigDecimal.ZERO;
            BigDecimal versementPourSf = BigDecimal.ZERO;

            if (explicitLinesMap.containsKey(sf.getId())) {
                VersementLigneRequest expLigne = explicitLinesMap.get(sf.getId());
                remisePourSf = expLigne.remiseImputee() != null ? expLigne.remiseImputee() : BigDecimal.ZERO;
                versementPourSf = expLigne.montantImpute() != null ? expLigne.montantImpute() : BigDecimal.ZERO;
            } else {
                // Imputation automatique : d'abord la remise sur le reste de la sous-facture
                if (remiseRestanteADistribuer.compareTo(BigDecimal.ZERO) > 0 && resteSf.compareTo(BigDecimal.ZERO) > 0) {
                    remisePourSf = remiseRestanteADistribuer.min(resteSf);
                    remiseRestanteADistribuer = remiseRestanteADistribuer.subtract(remisePourSf);
                    resteSf = resteSf.subtract(remisePourSf);
                }
                // Ensuite le versement sur ce qui reste
                if (versementRestantADistribuer.compareTo(BigDecimal.ZERO) > 0 && resteSf.compareTo(BigDecimal.ZERO) > 0) {
                    versementPourSf = versementRestantADistribuer.min(resteSf);
                    versementRestantADistribuer = versementRestantADistribuer.subtract(versementPourSf);
                }
            }

            // Mettre à jour la sous-facture
            BigDecimal nouvelleRemise = remActuelle.add(remisePourSf);
            BigDecimal nouveauPaye = payeActuel.add(versementPourSf);
            sf.setRemise(nouvelleRemise);
            sf.setMontantPaye(nouveauPaye);

            BigDecimal resteApres = partPat.subtract(nouvelleRemise).subtract(nouveauPaye);
            if (partPat.compareTo(BigDecimal.ZERO) == 0 || resteApres.compareTo(BigDecimal.ZERO) <= 0) {
                sf.setStatutPaiement(StatutPaiement.PAYE);
            } else if (nouveauPaye.compareTo(BigDecimal.ZERO) > 0 || nouvelleRemise.compareTo(BigDecimal.ZERO) > 0) {
                sf.setStatutPaiement(StatutPaiement.PARTIELLEMENT_PAYE);
            } else {
                sf.setStatutPaiement(StatutPaiement.NON_PAYE);
            }

            sousFactureRepository.save(sf);

            // Créer la ligne de versement
            VersementLigne ligne = new VersementLigne();
            ligne.setVersement(versement);
            ligne.setSousFacture(sf);
            ligne.setMontantImpute(versementPourSf);
            ligne.setRemiseImputee(remisePourSf);
            versementLigneRepository.save(ligne);
            versement.getLignes().add(ligne);
        }

        // Si le versement restant > total à payer (ex: espèces données avec monnaie à rendre)
        if (versementRestantADistribuer.compareTo(BigDecimal.ZERO) > 0 && versementRestantADistribuer.compareTo(montantVerse) < 0) {
            versement.setMonnaieRendue(versementRestantADistribuer);
        }

        // 4. Mettre à jour le statut global de la Visite
        boolean allPaye = true;
        boolean auMoinsUnPayeOuPartiel = false;
        BigDecimal totalResteVisite = BigDecimal.ZERO;

        for (SousFacture sf : visite.getSousFactures()) {
            BigDecimal partPat = sf.getPartPatient() != null ? sf.getPartPatient() : BigDecimal.ZERO;
            BigDecimal rem = sf.getRemise() != null ? sf.getRemise() : BigDecimal.ZERO;
            BigDecimal paye = sf.getMontantPaye() != null ? sf.getMontantPaye() : BigDecimal.ZERO;
            BigDecimal r = partPat.subtract(rem).subtract(paye);
            if (r.compareTo(BigDecimal.ZERO) > 0) {
                totalResteVisite = totalResteVisite.add(r);
                allPaye = false;
            }
            if (sf.getStatutPaiement() == StatutPaiement.PAYE || sf.getStatutPaiement() == StatutPaiement.PARTIELLEMENT_PAYE) {
                auMoinsUnPayeOuPartiel = true;
            }
        }

        if (allPaye || totalResteVisite.compareTo(BigDecimal.ZERO) == 0) {
            visite.setStatutPaiement(StatutPaiement.PAYE);
        } else if (auMoinsUnPayeOuPartiel) {
            visite.setStatutPaiement(StatutPaiement.PARTIELLEMENT_PAYE);
        } else {
            visite.setStatutPaiement(StatutPaiement.NON_PAYE);
        }

        visite.getVersements().add(versement);
        visiteRepository.save(visite);

        versement.setResteAPayer(totalResteVisite);
        versement = versementRepository.save(versement);

        return VersementResponse.from(versement);
    }

    /**
     * Liste des versements d'une visite spécifique.
     */
    @Transactional(readOnly = true)
    public List<VersementResponse> getVersementsByVisite(Long visiteId) {
        return versementRepository.findByVisiteIdOrderByDateVersementDesc(visiteId).stream()
                .map(VersementResponse::from)
                .toList();
    }

    /**
     * Retrouve un versement par son ID.
     */
    @Transactional(readOnly = true)
    public VersementResponse getVersementById(Long versementId) {
        return versementRepository.findById(versementId)
                .map(VersementResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Versement introuvable : " + versementId));
    }

    /**
     * Journal de tous les versements.
     */
    @Transactional(readOnly = true)
    public List<VersementResponse> getAllVersements() {
        return versementRepository.findAllByOrderByDateVersementDesc().stream()
                .map(VersementResponse::from)
                .toList();
    }

    /**
     * Liste des versements pour un patient donné.
     */
    @Transactional(readOnly = true)
    public List<VersementResponse> getVersementsByPatient(Long patientId) {
        return versementRepository.findByPatientIdOrderByDateVersementDesc(patientId).stream()
                .map(VersementResponse::from)
                .toList();
    }
}
