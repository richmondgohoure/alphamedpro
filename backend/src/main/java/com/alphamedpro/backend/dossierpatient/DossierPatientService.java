package com.alphamedpro.backend.dossierpatient;

import com.alphamedpro.backend.common.ResourceNotFoundException;
import com.alphamedpro.backend.dossierpatient.dto.AntecedentRequest;
import com.alphamedpro.backend.dossierpatient.dto.AntecedentResponse;
import com.alphamedpro.backend.dossierpatient.dto.DossierPatientResponse;
import com.alphamedpro.backend.dossierpatient.dto.DossierPatientUpdateRequest;
import com.alphamedpro.backend.patient.Patient;
import com.alphamedpro.backend.patient.PatientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class DossierPatientService {

    private final DossierPatientRepository dossierPatientRepository;
    private final AntecedentPatientRepository antecedentPatientRepository;
    private final PatientRepository patientRepository;

    private static final Pattern DP_PATTERN = Pattern.compile("DP-(\\d+)");

    private static final List<DefaultAntecedentDefinition> DEFAULT_ANTECEDENTS = List.of(
            // --- ALLERGIES ---
            new DefaultAntecedentDefinition(GroupeAntecedent.ALLERGIES, "Allergies médicamenteuses (Pénicilline, Sulfamides, AINS...)", 1),
            new DefaultAntecedentDefinition(GroupeAntecedent.ALLERGIES, "Allergies alimentaires (Arachides, Fruits de mer, Lactose...)", 2),
            new DefaultAntecedentDefinition(GroupeAntecedent.ALLERGIES, "Allergies respiratoires (Poussière, Acariens, Pollens)", 3),
            new DefaultAntecedentDefinition(GroupeAntecedent.ALLERGIES, "Allergies cutanées & Contact (Latex, Produits chimiques...)", 4),
            new DefaultAntecedentDefinition(GroupeAntecedent.ALLERGIES, "Autres allergies", 5),

            // --- ANTÉCÉDENTS MÉDICAUX ---
            new DefaultAntecedentDefinition(GroupeAntecedent.MEDICAUX, "Hypertension Artérielle (HTA)", 1),
            new DefaultAntecedentDefinition(GroupeAntecedent.MEDICAUX, "Diabète (Type 1 / Type 2)", 2),
            new DefaultAntecedentDefinition(GroupeAntecedent.MEDICAUX, "Asthme & Bronchopneumopathie chronique", 3),
            new DefaultAntecedentDefinition(GroupeAntecedent.MEDICAUX, "Cardiopathies & Insuffisance cardiaque", 4),
            new DefaultAntecedentDefinition(GroupeAntecedent.MEDICAUX, "Accident Vasculaire Cérébral (AVC) / AIT", 5),
            new DefaultAntecedentDefinition(GroupeAntecedent.MEDICAUX, "Insuffisance Rénale chronique / aiguë", 6),
            new DefaultAntecedentDefinition(GroupeAntecedent.MEDICAUX, "Drépanocytose (AS, SS, SC...)", 7),
            new DefaultAntecedentDefinition(GroupeAntecedent.MEDICAUX, "Ulcère Gastro-duodénal & Gastrite", 8),
            new DefaultAntecedentDefinition(GroupeAntecedent.MEDICAUX, "Épilepsie & Troubles neurologiques", 9),
            new DefaultAntecedentDefinition(GroupeAntecedent.MEDICAUX, "Hépatites virales (B, C) & Cirrhose", 10),
            new DefaultAntecedentDefinition(GroupeAntecedent.MEDICAUX, "Cancers & Pathologies tumorales", 11),
            new DefaultAntecedentDefinition(GroupeAntecedent.MEDICAUX, "VIH / Sérologie rétrovirale", 12),
            new DefaultAntecedentDefinition(GroupeAntecedent.MEDICAUX, "Autres antécédents médicaux", 13),

            // --- ANTÉCÉDENTS CHIRURGICAUX ---
            new DefaultAntecedentDefinition(GroupeAntecedent.CHIRURGICAUX, "Appendicectomie", 1),
            new DefaultAntecedentDefinition(GroupeAntecedent.CHIRURGICAUX, "Césarienne antérieure", 2),
            new DefaultAntecedentDefinition(GroupeAntecedent.CHIRURGICAUX, "Cure de hernie (Inguinale, Ombilicale...)", 3),
            new DefaultAntecedentDefinition(GroupeAntecedent.CHIRURGICAUX, "Chirurgie abdominale / Laparotomie", 4),
            new DefaultAntecedentDefinition(GroupeAntecedent.CHIRURGICAUX, "Chirurgie orthopédique & Traumatologique (Fractures, Prothèses)", 5),
            new DefaultAntecedentDefinition(GroupeAntecedent.CHIRURGICAUX, "Chirurgie gynécologique (Kyste ovarien, Fibrome, Myomectomie)", 6),
            new DefaultAntecedentDefinition(GroupeAntecedent.CHIRURGICAUX, "Chirurgie ORL & Ophtalmologique", 7),
            new DefaultAntecedentDefinition(GroupeAntecedent.CHIRURGICAUX, "Autres interventions chirurgicales", 8),

            // --- GYNÉCO-OBSTÉTRIQUES ---
            new DefaultAntecedentDefinition(GroupeAntecedent.GYNECO_OBSTETRIQUES, "Grossesses & Parité (Enfants nés vivants)", 1),
            new DefaultAntecedentDefinition(GroupeAntecedent.GYNECO_OBSTETRIQUES, "Avortements / Fausses couches antérieures", 2),
            new DefaultAntecedentDefinition(GroupeAntecedent.GYNECO_OBSTETRIQUES, "Césariennes antérieures", 3),
            new DefaultAntecedentDefinition(GroupeAntecedent.GYNECO_OBSTETRIQUES, "Contraception en cours (Pilule, DIU, Implant...)", 4),
            new DefaultAntecedentDefinition(GroupeAntecedent.GYNECO_OBSTETRIQUES, "Troubles du cycle menstruel / Aménorrhée", 5),
            new DefaultAntecedentDefinition(GroupeAntecedent.GYNECO_OBSTETRIQUES, "Hémorragies génitales anormales", 6),
            new DefaultAntecedentDefinition(GroupeAntecedent.GYNECO_OBSTETRIQUES, "Grossesse en cours", 7),
            new DefaultAntecedentDefinition(GroupeAntecedent.GYNECO_OBSTETRIQUES, "Autres antécédents gynéco-obstétriques", 8),

            // --- VACCINATIONS ---
            new DefaultAntecedentDefinition(GroupeAntecedent.VACCINATIONS, "BCG (Tuberculose)", 1),
            new DefaultAntecedentDefinition(GroupeAntecedent.VACCINATIONS, "DTP (Diphtérie, Tétanos, Poliomyélite)", 2),
            new DefaultAntecedentDefinition(GroupeAntecedent.VACCINATIONS, "Hépatite B", 3),
            new DefaultAntecedentDefinition(GroupeAntecedent.VACCINATIONS, "Fièvre Jaune", 4),
            new DefaultAntecedentDefinition(GroupeAntecedent.VACCINATIONS, "Covid-19", 5),
            new DefaultAntecedentDefinition(GroupeAntecedent.VACCINATIONS, "Rougeole - Oreillons - Rubéole (ROR)", 6),
            new DefaultAntecedentDefinition(GroupeAntecedent.VACCINATIONS, "Méningite", 7),
            new DefaultAntecedentDefinition(GroupeAntecedent.VACCINATIONS, "Typhoïde", 8),
            new DefaultAntecedentDefinition(GroupeAntecedent.VACCINATIONS, "Autres vaccinations à jour", 9),

            // --- ANTÉCÉDENTS FAMILIAUX ---
            new DefaultAntecedentDefinition(GroupeAntecedent.FAMILIAUX, "Hypertension Artérielle familiale", 1),
            new DefaultAntecedentDefinition(GroupeAntecedent.FAMILIAUX, "Diabète familial", 2),
            new DefaultAntecedentDefinition(GroupeAntecedent.FAMILIAUX, "Cancers familiaux (Sein, Côlon, Prostate...)", 3),
            new DefaultAntecedentDefinition(GroupeAntecedent.FAMILIAUX, "Drépanocytose familiale", 4),
            new DefaultAntecedentDefinition(GroupeAntecedent.FAMILIAUX, "Cardiopathies & Mort subite précoce", 5),
            new DefaultAntecedentDefinition(GroupeAntecedent.FAMILIAUX, "Autres antécédents familiaux", 6),

            // --- HABITUDES DE VIE & FACTEURS DE RISQUE ---
            new DefaultAntecedentDefinition(GroupeAntecedent.HABITUDES_VIE, "Tabagisme (Actif / Sevré)", 1),
            new DefaultAntecedentDefinition(GroupeAntecedent.HABITUDES_VIE, "Consommation d'alcool", 2),
            new DefaultAntecedentDefinition(GroupeAntecedent.HABITUDES_VIE, "Consommation de substances / Toxiques", 3),
            new DefaultAntecedentDefinition(GroupeAntecedent.HABITUDES_VIE, "Sédentarité / Activité physique", 4),
            new DefaultAntecedentDefinition(GroupeAntecedent.HABITUDES_VIE, "Régime alimentaire particulier", 5),
            new DefaultAntecedentDefinition(GroupeAntecedent.HABITUDES_VIE, "Autres habitudes de vie", 6)
    );

    private record DefaultAntecedentDefinition(GroupeAntecedent groupe, String libelle, int ordre) {}

    public synchronized String generateNextNumeroDossier() {
        List<DossierPatient> allDossiers = dossierPatientRepository.findAll();
        long maxNum = 0;
        for (DossierPatient d : allDossiers) {
            String num = d.getNumeroDossier();
            if (num != null) {
                Matcher matcher = DP_PATTERN.matcher(num.trim());
                if (matcher.matches()) {
                    try {
                        long val = Long.parseLong(matcher.group(1));
                        if (val > maxNum) {
                            maxNum = val;
                        }
                    } catch (NumberFormatException ignored) {
                    }
                }
            }
        }
        long nextNum = maxNum + 1;
        return String.format("DP-%07d", nextNum);
    }

    public DossierPatient createDossierForPatient(Patient patient) {
        Optional<DossierPatient> existing = dossierPatientRepository.findByPatientId(patient.getId());
        if (existing.isPresent()) {
            return existing.get();
        }

        DossierPatient dossier = new DossierPatient();
        dossier.setNumeroDossier(generateNextNumeroDossier());
        dossier.setPatient(patient);

        // Initialiser tous les antécédents par défaut à 'Non' (false)
        for (DefaultAntecedentDefinition def : DEFAULT_ANTECEDENTS) {
            AntecedentPatient a = new AntecedentPatient();
            a.setGroupe(def.groupe());
            a.setLibelle(def.libelle());
            a.setActif(false); // NON par défaut
            a.setDetails(null);
            a.setOrdre(def.ordre());
            dossier.addAntecedent(a);
        }

        DossierPatient saved = dossierPatientRepository.save(dossier);
        patient.setDossierPatient(saved);
        return saved;
    }

    @Transactional(readOnly = true)
    public DossierPatientResponse findByPatientId(Long patientId) {
        DossierPatient dossier = dossierPatientRepository.findByPatientId(patientId)
                .orElseGet(() -> {
                    Patient p = patientRepository.findById(patientId)
                            .orElseThrow(() -> new ResourceNotFoundException("Patient introuvable : " + patientId));
                    return createDossierForPatient(p);
                });
        return DossierPatientResponse.from(dossier);
    }

    @Transactional(readOnly = true)
    public DossierPatientResponse findById(Long id) {
        DossierPatient dossier = dossierPatientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dossier patient introuvable : " + id));
        return DossierPatientResponse.from(dossier);
    }

    @Transactional(readOnly = true)
    public DossierPatientResponse findByNumeroDossier(String numeroDossier) {
        DossierPatient dossier = dossierPatientRepository.findByNumeroDossier(numeroDossier)
                .orElseThrow(() -> new ResourceNotFoundException("Dossier patient introuvable avec le numéro : " + numeroDossier));
        return DossierPatientResponse.from(dossier);
    }

    public DossierPatientResponse updateDossier(Long patientId, DossierPatientUpdateRequest request) {
        DossierPatient dossier = dossierPatientRepository.findByPatientId(patientId)
                .orElseGet(() -> {
                    Patient p = patientRepository.findById(patientId)
                            .orElseThrow(() -> new ResourceNotFoundException("Patient introuvable : " + patientId));
                    return createDossierForPatient(p);
                });

        if (request.groupeSanguin() != null) dossier.setGroupeSanguin(request.groupeSanguin());
        if (request.rhesus() != null) dossier.setRhesus(request.rhesus());
        if (request.poids() != null) dossier.setPoids(request.poids());
        if (request.taille() != null) dossier.setTaille(request.taille());
        if (request.tensionArterielle() != null) dossier.setTensionArterielle(request.tensionArterielle());
        if (request.observationsGenerales() != null) dossier.setObservationsGenerales(request.observationsGenerales());

        if (request.antecedents() != null) {
            Map<Long, AntecedentPatient> existingMap = dossier.getAntecedents().stream()
                    .filter(a -> a.getId() != null)
                    .collect(Collectors.toMap(AntecedentPatient::getId, a -> a));

            for (AntecedentRequest req : request.antecedents()) {
                if (req.id() != null && existingMap.containsKey(req.id())) {
                    AntecedentPatient existing = existingMap.get(req.id());
                    if (req.groupe() != null) existing.setGroupe(req.groupe());
                    if (req.libelle() != null) existing.setLibelle(req.libelle());
                    existing.setActif(req.actif());
                    existing.setDetails(req.details());
                    existing.setAnnee(req.annee());
                    existing.setOrdre(req.ordre());
                } else if (req.libelle() != null && !req.libelle().isBlank()) {
                    AntecedentPatient newAnt = new AntecedentPatient();
                    newAnt.setGroupe(req.groupe() != null ? req.groupe() : GroupeAntecedent.MEDICAUX);
                    newAnt.setLibelle(req.libelle().trim());
                    newAnt.setActif(req.actif());
                    newAnt.setDetails(req.details());
                    newAnt.setAnnee(req.annee());
                    newAnt.setOrdre(req.ordre() > 0 ? req.ordre() : dossier.getAntecedents().size() + 1);
                    dossier.addAntecedent(newAnt);
                }
            }
        }

        DossierPatient saved = dossierPatientRepository.save(dossier);
        return DossierPatientResponse.from(saved);
    }

    public AntecedentResponse updateSingleAntecedent(Long antecedentId, AntecedentRequest request) {
        AntecedentPatient antecedent = antecedentPatientRepository.findById(antecedentId)
                .orElseThrow(() -> new ResourceNotFoundException("Antécédent introuvable : " + antecedentId));

        if (request.groupe() != null) antecedent.setGroupe(request.groupe());
        if (request.libelle() != null) antecedent.setLibelle(request.libelle());
        antecedent.setActif(request.actif());
        antecedent.setDetails(request.details());
        antecedent.setAnnee(request.annee());
        antecedent.setOrdre(request.ordre());

        AntecedentPatient saved = antecedentPatientRepository.save(antecedent);
        return AntecedentResponse.from(saved);
    }

    public AntecedentResponse addAntecedent(Long patientId, AntecedentRequest request) {
        DossierPatient dossier = dossierPatientRepository.findByPatientId(patientId)
                .orElseGet(() -> {
                    Patient p = patientRepository.findById(patientId)
                            .orElseThrow(() -> new ResourceNotFoundException("Patient introuvable : " + patientId));
                    return createDossierForPatient(p);
                });

        AntecedentPatient ant = new AntecedentPatient();
        ant.setGroupe(request.groupe() != null ? request.groupe() : GroupeAntecedent.MEDICAUX);
        ant.setLibelle(request.libelle());
        ant.setActif(request.actif());
        ant.setDetails(request.details());
        ant.setAnnee(request.annee());
        ant.setOrdre(request.ordre() > 0 ? request.ordre() : dossier.getAntecedents().size() + 1);

        dossier.addAntecedent(ant);
        dossierPatientRepository.save(dossier);

        return AntecedentResponse.from(ant);
    }

    public void deleteAntecedent(Long antecedentId) {
        AntecedentPatient antecedent = antecedentPatientRepository.findById(antecedentId)
                .orElseThrow(() -> new ResourceNotFoundException("Antécédent introuvable : " + antecedentId));
        antecedentPatientRepository.delete(antecedent);
    }

    /**
     * Associe un dossier patient à chaque patient existant qui n'en possède pas encore.
     * Les dossiers sont numérotés séquentiellement au format DP-0000001, DP-0000002...
     * et tous les antécédents sont initialisés à 'Non' (false) par défaut.
     */
    public synchronized int associateDossiersForExistingPatients() {
        List<Patient> patients = patientRepository.findAll();
        int createdCount = 0;

        for (Patient patient : patients) {
            Optional<DossierPatient> existing = dossierPatientRepository.findByPatientId(patient.getId());
            if (existing.isEmpty()) {
                createDossierForPatient(patient);
                createdCount++;
            }
        }

        if (createdCount > 0) {
            log.info("Association réussie : {} dossiers patients créés et associés aux patients existants (format DP-0000001+).", createdCount);
        }
        return createdCount;
    }
}
