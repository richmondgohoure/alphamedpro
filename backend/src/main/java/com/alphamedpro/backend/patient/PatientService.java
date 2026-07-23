package com.alphamedpro.backend.patient;

import com.alphamedpro.backend.assurance.Assurance;
import com.alphamedpro.backend.assurance.AssuranceRepository;
import com.alphamedpro.backend.common.ResourceNotFoundException;
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

    public List<PatientResponse> findAll() {
        return patientRepository.findAll().stream().map(PatientResponse::from).toList();
    }

    public PatientResponse findById(Long id) {
        return PatientResponse.from(getOrThrow(id));
    }

    public PatientResponse create(PatientRequest request) {
        Patient patient = new Patient();
        applyRequest(patient, request);
        return PatientResponse.from(patientRepository.save(patient));
    }

    public PatientResponse update(Long id, PatientRequest request) {
        Patient patient = getOrThrow(id);
        applyRequest(patient, request);
        return PatientResponse.from(patientRepository.save(patient));
    }

    public void delete(Long id) {
        Patient patient = getOrThrow(id);
        patientRepository.delete(patient);
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
                patientAssurance.setNumeroMatricule(assuranceRequest.numeroMatricule());
                patient.getAssurances().add(patientAssurance);
            }
        }
    }
}
