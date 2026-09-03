package com.alphamedpro.backend.dossierpatient;

import com.alphamedpro.backend.dossierpatient.dto.AntecedentRequest;
import com.alphamedpro.backend.dossierpatient.dto.AntecedentResponse;
import com.alphamedpro.backend.dossierpatient.dto.DossierPatientResponse;
import com.alphamedpro.backend.dossierpatient.dto.DossierPatientUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DossierPatientController {

    private final DossierPatientService dossierPatientService;

    @GetMapping("/patients/{patientId}/dossier")
    public DossierPatientResponse getByPatientId(@PathVariable Long patientId) {
        return dossierPatientService.findByPatientId(patientId);
    }

    @PutMapping("/patients/{patientId}/dossier")
    public DossierPatientResponse updateDossier(
            @PathVariable Long patientId,
            @RequestBody DossierPatientUpdateRequest request
    ) {
        return dossierPatientService.updateDossier(patientId, request);
    }

    @PostMapping("/patients/{patientId}/dossier/antecedents")
    @ResponseStatus(HttpStatus.CREATED)
    public AntecedentResponse addAntecedent(
            @PathVariable Long patientId,
            @Valid @RequestBody AntecedentRequest request
    ) {
        return dossierPatientService.addAntecedent(patientId, request);
    }

    @GetMapping("/dossiers/{id}")
    public DossierPatientResponse getById(@PathVariable Long id) {
        return dossierPatientService.findById(id);
    }

    @GetMapping("/dossiers/numero/{numeroDossier}")
    public DossierPatientResponse getByNumeroDossier(@PathVariable String numeroDossier) {
        return dossierPatientService.findByNumeroDossier(numeroDossier);
    }

    @PutMapping("/dossiers/antecedents/{antecedentId}")
    public AntecedentResponse updateSingleAntecedent(
            @PathVariable Long antecedentId,
            @Valid @RequestBody AntecedentRequest request
    ) {
        return dossierPatientService.updateSingleAntecedent(antecedentId, request);
    }

    @DeleteMapping("/dossiers/antecedents/{antecedentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAntecedent(@PathVariable Long antecedentId) {
        dossierPatientService.deleteAntecedent(antecedentId);
    }

    @PostMapping("/dossiers/associer-existants")
    public Map<String, Object> associerDossiersExistants() {
        int count = dossierPatientService.associateDossiersForExistingPatients();
        return Map.of(
                "success", true,
                "dossiersCrees", count,
                "message", count > 0
                        ? count + " dossiers patients ont été créés et associés aux patients existants."
                        : "Tous les patients existants possèdent déjà un dossier patient."
        );
    }
}
