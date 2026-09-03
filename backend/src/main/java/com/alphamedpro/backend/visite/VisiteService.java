package com.alphamedpro.backend.visite;

import com.alphamedpro.backend.acte.Acte;
import com.alphamedpro.backend.acte.ActeRepository;
import com.alphamedpro.backend.assurance.Assurance;
import com.alphamedpro.backend.assurance.AssuranceRepository;
import com.alphamedpro.backend.caisse.VersementLigneRepository;
import com.alphamedpro.backend.common.ResourceNotFoundException;
import com.alphamedpro.backend.garant.Garant;
import com.alphamedpro.backend.garant.GarantRepository;
import com.alphamedpro.backend.medecin.Medecin;
import com.alphamedpro.backend.medecin.MedecinRepository;
import com.alphamedpro.backend.patient.Patient;
import com.alphamedpro.backend.patient.PatientRepository;
import com.alphamedpro.backend.priseencharge.PriseEnCharge;
import com.alphamedpro.backend.priseencharge.PriseEnChargeRepository;
import com.alphamedpro.backend.visite.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class VisiteService {

    private final VisiteRepository visiteRepository;
    private final SousFactureRepository sousFactureRepository;
    private final SousFactureDetailRepository sousFactureDetailRepository;
    private final VersementLigneRepository versementLigneRepository;
    private final PatientRepository patientRepository;
    private final PriseEnChargeRepository priseEnChargeRepository;
    private final AssuranceRepository assuranceRepository;
    private final GarantRepository garantRepository;
    private final MedecinRepository medecinRepository;
    private final ActeRepository acteRepository;

    /**
     * Crée une Visite pour un patient avec ses sous-factures et leurs détails d'actes.
     */
    public VisiteResponse creerVisite(Long patientId, VisiteRequest request) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient introuvable : " + patientId));

        PriseEnCharge priseEnCharge = null;
        if (request.priseEnChargeId() != null) {
            priseEnCharge = priseEnChargeRepository.findById(request.priseEnChargeId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Prise en charge introuvable : " + request.priseEnChargeId()));
        }

        LocalDateTime dateVisite = request.dateVisite() != null ? request.dateVisite() : LocalDateTime.now();
        LocalDateTime dateCreation = LocalDateTime.now();
        String annee2Chiffres = String.format("%02d", dateVisite.getYear() % 100);

        String numeroVisite = genererNumeroVisite(annee2Chiffres);

        Visite visite = new Visite();
        visite.setNumeroVisite(numeroVisite);
        visite.setPatient(patient);
        visite.setPriseEnCharge(priseEnCharge);
        visite.setDateVisite(dateVisite);
        visite.setDateCreation(dateCreation);
        visite = visiteRepository.save(visite);

        // Déterminer l'assurance globale par défaut si présente
        Assurance defaultAssurance = null;
        if (request.assuranceId() != null) {
            defaultAssurance = assuranceRepository.findById(request.assuranceId()).orElse(null);
        } else if (priseEnCharge != null && priseEnCharge.getAssurance() != null) {
            defaultAssurance = priseEnCharge.getAssurance();
        }

        // Déterminer le garant global par défaut si présent
        Garant defaultGarant = null;
        if (request.garantId() != null) {
            defaultGarant = garantRepository.findById(request.garantId()).orElse(null);
        }

        // Créer les sous-factures et leurs détails
        if (request.sousFactures() != null) {
            for (SousFactureRequest sfReq : request.sousFactures()) {
                String numeroSousFacture = genererNumeroSousFacture(sfReq.codeCategorie(), annee2Chiffres);

                Assurance sfAssurance = defaultAssurance;
                if (sfReq.assuranceId() != null) {
                    sfAssurance = assuranceRepository.findById(sfReq.assuranceId()).orElse(defaultAssurance);
                }

                Garant sfGarant = defaultGarant;
                if (sfReq.garantId() != null) {
                    sfGarant = garantRepository.findById(sfReq.garantId()).orElse(defaultGarant);
                }

                Medecin sfMedecin = null;
                if (sfReq.medecinId() != null) {
                    sfMedecin = medecinRepository.findById(sfReq.medecinId()).orElse(null);
                }

                SousFacture sf = new SousFacture();
                sf.setNumeroSousFacture(numeroSousFacture);
                sf.setCodeCategorie(sfReq.codeCategorie());
                sf.setLibelleCategorie(sfReq.libelleCategorie());
                sf.setVisite(visite);
                sf.setPatient(patient);
                sf.setAssurance(sfAssurance);
                sf.setGarant(sfGarant);
                sf.setMedecin(sfMedecin);
                sf.setMontantBrut(sfReq.montantBrut());
                sf.setPartAssurance(sfReq.partAssurance());
                sf.setPartPatient(sfReq.partPatient());
                sf.setDateCreation(sfReq.dateCreation() != null ? sfReq.dateCreation() : dateCreation);
                sf = sousFactureRepository.save(sf);

                // Enregistrer les détails de la sous-facture
                if (sfReq.details() != null) {
                    for (SousFactureDetailRequest dReq : sfReq.details()) {
                        SousFactureDetail detail = new SousFactureDetail();
                        detail.setSousFacture(sf);

                        Acte acte = null;
                        if (dReq.acteId() != null) {
                            acte = acteRepository.findById(dReq.acteId()).orElse(null);
                        }
                        detail.setActe(acte);
                        detail.setLibelleActe(dReq.libelleActe());
                        detail.setCategory(dReq.category());
                        detail.setPrixUnitaire(dReq.prixUnitaire());
                        detail.setQuantite(dReq.quantite() != null ? dReq.quantite() : 1);
                        detail.setMontantBrut(dReq.montantBrut());
                        detail.setPartAssurance(dReq.partAssurance());
                        detail.setPartPatient(dReq.partPatient());
                        detail.setTauxCouverture(dReq.tauxCouverture());
                        detail.setTypeCouverture(dReq.typeCouverture());
                        detail.setMontantForfait(dReq.montantForfait());
                        detail.setCoefficientInfo(dReq.coefficientInfo());
                        detail.setTarifFormula(dReq.tarifFormula());

                        Medecin detailMedecin = sfMedecin;
                        if (dReq.medecinId() != null) {
                            detailMedecin = medecinRepository.findById(dReq.medecinId()).orElse(sfMedecin);
                        }
                        detail.setMedecin(detailMedecin);

                        sousFactureDetailRepository.save(detail);
                        sf.getDetails().add(detail);
                    }
                }

                visite.getSousFactures().add(sf);
            }
        }

        return VisiteResponse.from(visite);
    }

    /**
     * Liste toutes les visites globales (pour la caisse / facturation) avec filtres optionnels.
     */
    @Transactional(readOnly = true)
    public List<VisiteResponse> findAllVisites(String search, StatutPaiement statut, LocalDate date) {
        List<Visite> list = visiteRepository.findAllByOrderByDateVisiteDescIdDesc();
        return list.stream()
                .filter(v -> {
                    if (statut != null && v.getStatutPaiement() != statut) {
                        return false;
                    }
                    if (date != null && (v.getDateVisite() == null || !date.equals(v.getDateVisite().toLocalDate()))) {
                        return false;
                    }
                    if (search != null && !search.isBlank()) {
                        String q = search.toLowerCase().trim();
                        boolean matchNum = v.getNumeroVisite() != null && v.getNumeroVisite().toLowerCase().contains(q);
                        boolean matchNom = v.getPatient() != null && v.getPatient().getNom() != null && v.getPatient().getNom().toLowerCase().contains(q);
                        boolean matchPrenom = v.getPatient() != null && v.getPatient().getPrenom() != null && v.getPatient().getPrenom().toLowerCase().contains(q);
                        boolean matchCode = v.getPatient() != null && v.getPatient().getCode() != null && v.getPatient().getCode().toLowerCase().contains(q);
                        boolean matchTel = v.getPatient() != null && v.getPatient().getNumeroTelephone() != null && v.getPatient().getNumeroTelephone().toLowerCase().contains(q);
                        boolean matchDossier = v.getPatient() != null && v.getPatient().getDossierPatient() != null && v.getPatient().getDossierPatient().getNumeroDossier() != null && v.getPatient().getDossierPatient().getNumeroDossier().toLowerCase().contains(q);
                        return matchNum || matchNom || matchPrenom || matchCode || matchTel || matchDossier;
                    }
                    return true;
                })
                .map(VisiteResponse::from)
                .toList();
    }

    /**
     * Liste toutes les visites d'un patient.
     */
    @Transactional(readOnly = true)
    public List<VisiteResponse> findByPatient(Long patientId) {
        return visiteRepository.findByPatientIdOrderByDateVisiteDesc(patientId).stream()
                .map(VisiteResponse::from)
                .toList();
    }

    /**
     * Retrouve une visite par son identifiant.
     */
    @Transactional(readOnly = true)
    public VisiteResponse findById(Long visiteId) {
        return visiteRepository.findById(visiteId)
                .map(VisiteResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Visite introuvable : " + visiteId));
    }

    /**
     * Retrouve la visite liée à une prise en charge.
     */
    @Transactional(readOnly = true)
    public VisiteResponse findByPriseEnCharge(Long priseEnChargeId) {
        return visiteRepository.findByPriseEnChargeId(priseEnChargeId)
                .map(VisiteResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Aucune visite trouvée pour la prise en charge : " + priseEnChargeId));
    }

    /**
     * Retrouve une sous-facture par son ID avec ses détails.
     */
    @Transactional(readOnly = true)
    public SousFactureResponse findSousFactureById(Long sousFactureId) {
        return sousFactureRepository.findById(sousFactureId)
                .map(SousFactureResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Sous-facture introuvable : " + sousFactureId));
    }

    /**
     * Liste toutes les sous-factures d'un patient.
     */
    @Transactional(readOnly = true)
    public List<SousFactureResponse> findSousFacturesByPatient(Long patientId) {
        return sousFactureRepository.findByPatientIdOrderByDateCreationDesc(patientId).stream()
                .map(SousFactureResponse::from)
                .toList();
    }

    /**
     * Modifie une visite existante et ses sous-factures / détails si aucun versement n'a encore été effectué.
     */
    public VisiteResponse modifierVisite(Long visiteId, VisiteRequest request) {
        Visite visite = visiteRepository.findById(visiteId)
                .orElseThrow(() -> new ResourceNotFoundException("Visite introuvable : " + visiteId));

        // Vérifier si des versements ont déjà été imputés sur cette visite ou ses sous-factures
        for (SousFacture sf : visite.getSousFactures()) {
            boolean hasVersementLignes = !versementLigneRepository.findBySousFactureId(sf.getId()).isEmpty();
            boolean hasMontantPaye = sf.getMontantPaye() != null && sf.getMontantPaye().compareTo(BigDecimal.ZERO) > 0;
            if (hasVersementLignes || hasMontantPaye || sf.getStatutPaiement() != StatutPaiement.NON_PAYE) {
                throw new IllegalStateException("Impossible de modifier une visite ayant déjà fait l'objet d'un versement.");
            }
        }

        if (request.dateVisite() != null) {
            visite.setDateVisite(request.dateVisite());
        }

        Patient patient = visite.getPatient();
        String annee2Chiffres = String.format("%02d", visite.getDateVisite().getYear() % 100);

        // Déterminer l'assurance et garant par défaut
        Assurance defaultAssurance = null;
        if (request.assuranceId() != null) {
            defaultAssurance = assuranceRepository.findById(request.assuranceId()).orElse(null);
        } else if (visite.getPriseEnCharge() != null && visite.getPriseEnCharge().getAssurance() != null) {
            defaultAssurance = visite.getPriseEnCharge().getAssurance();
        }

        Garant defaultGarant = null;
        if (request.garantId() != null) {
            defaultGarant = garantRepository.findById(request.garantId()).orElse(null);
        }

        if (request.sousFactures() != null) {
            // Nettoyer les anciennes sous-factures
            List<SousFacture> oldSousFactures = List.copyOf(visite.getSousFactures());
            visite.getSousFactures().clear();
            for (SousFacture oldSf : oldSousFactures) {
                sousFactureRepository.delete(oldSf);
            }
            sousFactureRepository.flush();

            LocalDateTime dateCreation = LocalDateTime.now();

            for (SousFactureRequest sfReq : request.sousFactures()) {
                String numeroSousFacture = genererNumeroSousFacture(sfReq.codeCategorie(), annee2Chiffres);

                Assurance sfAssurance = defaultAssurance;
                if (sfReq.assuranceId() != null) {
                    sfAssurance = assuranceRepository.findById(sfReq.assuranceId()).orElse(defaultAssurance);
                }

                Garant sfGarant = defaultGarant;
                if (sfReq.garantId() != null) {
                    sfGarant = garantRepository.findById(sfReq.garantId()).orElse(defaultGarant);
                }

                Medecin sfMedecin = null;
                if (sfReq.medecinId() != null) {
                    sfMedecin = medecinRepository.findById(sfReq.medecinId()).orElse(null);
                }

                SousFacture sf = new SousFacture();
                sf.setNumeroSousFacture(numeroSousFacture);
                sf.setCodeCategorie(sfReq.codeCategorie());
                sf.setLibelleCategorie(sfReq.libelleCategorie());
                sf.setVisite(visite);
                sf.setPatient(patient);
                sf.setAssurance(sfAssurance);
                sf.setGarant(sfGarant);
                sf.setMedecin(sfMedecin);
                sf.setMontantBrut(sfReq.montantBrut());
                sf.setPartAssurance(sfReq.partAssurance());
                sf.setPartPatient(sfReq.partPatient());
                sf.setDateCreation(sfReq.dateCreation() != null ? sfReq.dateCreation() : dateCreation);
                sf = sousFactureRepository.save(sf);

                if (sfReq.details() != null) {
                    for (SousFactureDetailRequest dReq : sfReq.details()) {
                        SousFactureDetail detail = new SousFactureDetail();
                        detail.setSousFacture(sf);

                        Acte acte = null;
                        if (dReq.acteId() != null) {
                            acte = acteRepository.findById(dReq.acteId()).orElse(null);
                        }
                        detail.setActe(acte);
                        detail.setLibelleActe(dReq.libelleActe());
                        detail.setCategory(dReq.category());
                        detail.setPrixUnitaire(dReq.prixUnitaire());
                        detail.setQuantite(dReq.quantite() != null ? dReq.quantite() : 1);
                        detail.setMontantBrut(dReq.montantBrut());
                        detail.setPartAssurance(dReq.partAssurance());
                        detail.setPartPatient(dReq.partPatient());
                        detail.setTauxCouverture(dReq.tauxCouverture());
                        detail.setTypeCouverture(dReq.typeCouverture());
                        detail.setMontantForfait(dReq.montantForfait());
                        detail.setCoefficientInfo(dReq.coefficientInfo());
                        detail.setTarifFormula(dReq.tarifFormula());

                        Medecin detailMedecin = sfMedecin;
                        if (dReq.medecinId() != null) {
                            detailMedecin = medecinRepository.findById(dReq.medecinId()).orElse(sfMedecin);
                        }
                        detail.setMedecin(detailMedecin);

                        sousFactureDetailRepository.save(detail);
                        sf.getDetails().add(detail);
                    }
                }

                visite.getSousFactures().add(sf);
            }
        }

        visite = visiteRepository.save(visite);
        return VisiteResponse.from(visite);
    }

    /**
     * Modifie une sous-facture existante si aucun versement n'a encore été effectué.
     */
    public SousFactureResponse modifierSousFacture(Long sousFactureId, SousFactureRequest request) {
        SousFacture sf = sousFactureRepository.findById(sousFactureId)
                .orElseThrow(() -> new ResourceNotFoundException("Sous-facture introuvable : " + sousFactureId));

        // Vérification stricte qu'aucun versement n'a été fait
        boolean hasVersementLignes = !versementLigneRepository.findBySousFactureId(sousFactureId).isEmpty();
        boolean hasMontantPaye = sf.getMontantPaye() != null && sf.getMontantPaye().compareTo(BigDecimal.ZERO) > 0;
        if (hasVersementLignes || hasMontantPaye || sf.getStatutPaiement() != StatutPaiement.NON_PAYE) {
            throw new IllegalStateException("Impossible de modifier une sous-facture ayant déjà fait l'objet d'un versement.");
        }

        if (request.libelleCategorie() != null && !request.libelleCategorie().isBlank()) {
            sf.setLibelleCategorie(request.libelleCategorie());
        }

        if (request.assuranceId() != null) {
            sf.setAssurance(assuranceRepository.findById(request.assuranceId()).orElse(null));
        }
        if (request.garantId() != null) {
            sf.setGarant(garantRepository.findById(request.garantId()).orElse(null));
        }

        if (request.medecinId() != null) {
            sf.setMedecin(medecinRepository.findById(request.medecinId()).orElse(null));
        } else {
            sf.setMedecin(null);
        }

        if (request.details() != null) {
            // Nettoyer les détails existants
            sf.getDetails().clear();

            BigDecimal totalBrut = BigDecimal.ZERO;
            BigDecimal totalAssur = BigDecimal.ZERO;
            BigDecimal totalPat = BigDecimal.ZERO;

            for (SousFactureDetailRequest dReq : request.details()) {
                SousFactureDetail detail = new SousFactureDetail();
                detail.setSousFacture(sf);

                Acte acte = null;
                if (dReq.acteId() != null) {
                    acte = acteRepository.findById(dReq.acteId()).orElse(null);
                }
                detail.setActe(acte);
                detail.setLibelleActe(dReq.libelleActe());
                detail.setCategory(dReq.category());
                detail.setPrixUnitaire(dReq.prixUnitaire());
                detail.setQuantite(dReq.quantite() != null ? dReq.quantite() : 1);
                detail.setMontantBrut(dReq.montantBrut());
                detail.setPartAssurance(dReq.partAssurance());
                detail.setPartPatient(dReq.partPatient());
                detail.setTauxCouverture(dReq.tauxCouverture());
                detail.setTypeCouverture(dReq.typeCouverture());
                detail.setMontantForfait(dReq.montantForfait());
                detail.setCoefficientInfo(dReq.coefficientInfo());
                detail.setTarifFormula(dReq.tarifFormula());

                Medecin detailMedecin = sf.getMedecin();
                if (dReq.medecinId() != null) {
                    detailMedecin = medecinRepository.findById(dReq.medecinId()).orElse(sf.getMedecin());
                }
                detail.setMedecin(detailMedecin);

                if (dReq.montantBrut() != null) totalBrut = totalBrut.add(dReq.montantBrut());
                if (dReq.partAssurance() != null) totalAssur = totalAssur.add(dReq.partAssurance());
                if (dReq.partPatient() != null) totalPat = totalPat.add(dReq.partPatient());

                sf.getDetails().add(detail);
            }

            sf.setMontantBrut(request.montantBrut() != null ? request.montantBrut() : totalBrut);
            sf.setPartAssurance(request.partAssurance() != null ? request.partAssurance() : totalAssur);
            sf.setPartPatient(request.partPatient() != null ? request.partPatient() : totalPat);
        } else {
            if (request.montantBrut() != null) sf.setMontantBrut(request.montantBrut());
            if (request.partAssurance() != null) sf.setPartAssurance(request.partAssurance());
            if (request.partPatient() != null) sf.setPartPatient(request.partPatient());
        }

        sf = sousFactureRepository.save(sf);
        return SousFactureResponse.from(sf);
    }

    /**
     * Supprime une sous-facture si aucun versement n'a encore été effectué.
     */
    public void supprimerSousFacture(Long sousFactureId) {
        SousFacture sf = sousFactureRepository.findById(sousFactureId)
                .orElseThrow(() -> new ResourceNotFoundException("Sous-facture introuvable : " + sousFactureId));

        // Vérification stricte qu'aucun versement n'a été fait
        boolean hasVersementLignes = !versementLigneRepository.findBySousFactureId(sousFactureId).isEmpty();
        boolean hasMontantPaye = sf.getMontantPaye() != null && sf.getMontantPaye().compareTo(BigDecimal.ZERO) > 0;
        if (hasVersementLignes || hasMontantPaye || sf.getStatutPaiement() != StatutPaiement.NON_PAYE) {
            throw new IllegalStateException("Impossible de supprimer une sous-facture ayant déjà fait l'objet d'un versement.");
        }

        Visite visite = sf.getVisite();
        if (visite != null) {
            visite.getSousFactures().remove(sf);
        }
        sousFactureRepository.delete(sf);
    }

    /**
     * Génère le prochain numéro de visite au format V{AA}-{NNNNNNN}.
     * La séquence repart à 0000001 chaque nouvelle année.
     */
    private String genererNumeroVisite(String annee2Chiffres) {
        String prefix = "V" + annee2Chiffres;
        int nextSeq = visiteRepository.findMaxSequenceForYear(prefix)
                .map(max -> max + 1)
                .orElse(1);
        return String.format("%s-%07d", prefix, nextSeq);
    }

    /**
     * Génère le prochain numéro de sous-facture au format {CODE}{AA}-{NNNNNNNN}.
     * La séquence repart à 00000001 chaque nouvelle année.
     */
    private String genererNumeroSousFacture(String codeCategorie, String annee2Chiffres) {
        String prefix = codeCategorie + annee2Chiffres;
        int nextSeq = sousFactureRepository.findMaxSequenceForPrefix(prefix)
                .map(max -> max + 1)
                .orElse(1);
        return String.format("%s-%08d", prefix, nextSeq);
    }
}
