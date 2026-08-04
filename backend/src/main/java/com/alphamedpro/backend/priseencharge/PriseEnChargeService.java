package com.alphamedpro.backend.priseencharge;

import com.alphamedpro.backend.assurance.Assurance;
import com.alphamedpro.backend.assurance.AssuranceRepository;
import com.alphamedpro.backend.common.ResourceNotFoundException;
import com.alphamedpro.backend.patient.Patient;
import com.alphamedpro.backend.patient.PatientRepository;
import com.alphamedpro.backend.priseencharge.dto.PriseEnChargeRequest;
import com.alphamedpro.backend.priseencharge.dto.PriseEnChargeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PriseEnChargeService {

    private final PriseEnChargeRepository priseEnChargeRepository;
    private final PatientRepository patientRepository;
    private final AssuranceRepository assuranceRepository;

    public List<PriseEnChargeResponse> findByPatient(Long patientId) {
        getPatientOrThrow(patientId);
        return priseEnChargeRepository.findByPatientIdOrderByDateDemandeDesc(patientId).stream()
                .map(PriseEnChargeResponse::from)
                .toList();
    }

    public PriseEnChargeResponse create(Long patientId, PriseEnChargeRequest request) {
        Patient patient = getPatientOrThrow(patientId);
        PriseEnCharge priseEnCharge = new PriseEnCharge();
        priseEnCharge.setPatient(patient);
        applyRequest(priseEnCharge, request);
        return PriseEnChargeResponse.from(priseEnChargeRepository.save(priseEnCharge));
    }

    public PriseEnChargeResponse update(Long id, PriseEnChargeRequest request) {
        PriseEnCharge priseEnCharge = getOrThrow(id);
        applyRequest(priseEnCharge, request);
        return PriseEnChargeResponse.from(priseEnChargeRepository.save(priseEnCharge));
    }

    public void delete(Long id) {
        PriseEnCharge priseEnCharge = getOrThrow(id);
        priseEnChargeRepository.delete(priseEnCharge);
    }

    private PriseEnCharge getOrThrow(Long id) {
        return priseEnChargeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prise en charge introuvable : " + id));
    }

    private Patient getPatientOrThrow(Long patientId) {
        return patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient introuvable : " + patientId));
    }

    private void applyRequest(PriseEnCharge priseEnCharge, PriseEnChargeRequest request) {
        Assurance assurance = null;
        if (request.assuranceId() != null) {
            assurance = assuranceRepository.findById(request.assuranceId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Assurance introuvable : " + request.assuranceId()));
        }
        priseEnCharge.setAssurance(assurance);
        priseEnCharge.setDateDemande(request.dateDemande());
        priseEnCharge.setMotif(request.motif());
        priseEnCharge.setMontant(request.montant());
        priseEnCharge.setStatut(request.statut() != null ? request.statut() : StatutPriseEnCharge.EN_ATTENTE);
        priseEnCharge.setObservation(request.observation());
    }
}
