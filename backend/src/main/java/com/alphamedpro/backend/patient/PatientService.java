package com.alphamedpro.backend.patient;

import com.alphamedpro.backend.assurance.Assurance;
import com.alphamedpro.backend.assurance.AssuranceRepository;
import com.alphamedpro.backend.common.DuplicateResourceException;
import com.alphamedpro.backend.common.ResourceNotFoundException;
import com.alphamedpro.backend.dossierpatient.DossierPatientService;
import com.alphamedpro.backend.garant.Garant;
import com.alphamedpro.backend.garant.GarantRepository;
import com.alphamedpro.backend.patient.dto.PatientAssuranceRequest;
import com.alphamedpro.backend.patient.dto.PatientRequest;
import com.alphamedpro.backend.patient.dto.PatientResponse;
import com.alphamedpro.backend.patientassurance.PatientAssurance;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PatientService {

    private final PatientRepository patientRepository;
    private final AssuranceRepository assuranceRepository;
    private final GarantRepository garantRepository;
    private final DossierPatientService dossierPatientService;

    public List<PatientResponse> findAll(String query) {
        List<Patient> patients;
        if (query != null && !query.isBlank()) {
            patients = patientRepository.search(query);
        } else {
            patients = patientRepository.findAll();
        }
        return patients.stream().map(PatientResponse::from).toList();
    }

    public PatientResponse findById(Long id) {
        return PatientResponse.from(getOrThrow(id));
    }

    public PatientResponse create(PatientRequest request) {
        checkDuplicate(request.nom(), request.numeroTelephone(), null);
        Patient patient = new Patient();
        applyRequest(patient, request);
        Patient savedPatient = patientRepository.save(patient);
        // Créer automatiquement le dossier patient avec ses antécédents par défaut à 'Non'
        dossierPatientService.createDossierForPatient(savedPatient);
        return PatientResponse.from(savedPatient);
    }

    public PatientResponse update(Long id, PatientRequest request) {
        Patient patient = getOrThrow(id);
        checkDuplicate(request.nom(), request.numeroTelephone(), id);
        applyRequest(patient, request);
        return PatientResponse.from(patientRepository.save(patient));
    }

    public void delete(Long id) {
        Patient patient = getOrThrow(id);
        patientRepository.delete(patient);
    }

    private void checkDuplicate(String nom, String numeroTelephone, Long excludeId) {
        if (nom == null || nom.isBlank() || numeroTelephone == null || numeroTelephone.isBlank()) {
            return;
        }
        String cleanNom = nom.trim();
        String cleanTel = numeroTelephone.trim();
        boolean exists = (excludeId == null)
                ? patientRepository.existsByNomAndNumeroTelephoneIgnoreCase(cleanNom, cleanTel)
                : patientRepository.existsByNomAndNumeroTelephoneIgnoreCaseAndIdNot(cleanNom, cleanTel, excludeId);

        if (exists) {
            throw new DuplicateResourceException("Un patient avec le même nom et le même numéro de téléphone existe déjà.");
        }
    }

    Patient getOrThrow(Long id) {
        return patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient introuvable : " + id));
    }

    private void applyRequest(Patient patient, PatientRequest request) {
        patient.setNom(request.nom());
        patient.setPrenom(request.prenom());
        patient.setDateNaissance(request.dateNaissance());
        patient.setNumeroTelephone(request.numeroTelephone());
        patient.setQuartier(request.quartier());
        patient.setProfession(request.profession());
        patient.setCode(request.code());

        patient.getAssurances().clear();
        List<PatientAssuranceRequest> assuranceRequests = request.assurances();
        if (assuranceRequests != null) {
            for (PatientAssuranceRequest assuranceRequest : assuranceRequests) {
                Assurance assurance = assuranceRepository.findById(assuranceRequest.assuranceId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Assurance introuvable : " + assuranceRequest.assuranceId()));
                PatientAssurance patientAssurance = new PatientAssurance();
                patientAssurance.setPatient(patient);
                patientAssurance.setAssurance(assurance);
                if (assuranceRequest.garantId() != null) {
                    Garant garant = garantRepository.findById(assuranceRequest.garantId()).orElse(null);
                    patientAssurance.setGarant(garant);
                } else {
                    patientAssurance.setGarant(null);
                }
                patientAssurance.setNumeroMatricule(assuranceRequest.numeroMatricule());
                patient.getAssurances().add(patientAssurance);
            }
        }
    }
}
