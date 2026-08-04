package com.alphamedpro.backend.priseencharge;

import com.alphamedpro.backend.priseencharge.dto.PriseEnChargeRequest;
import com.alphamedpro.backend.priseencharge.dto.PriseEnChargeResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class PriseEnChargeController {

    private final PriseEnChargeService priseEnChargeService;

    @GetMapping("/api/patients/{patientId}/prises-en-charge")
    public List<PriseEnChargeResponse> findByPatient(@PathVariable Long patientId) {
        return priseEnChargeService.findByPatient(patientId);
    }

    @PostMapping("/api/patients/{patientId}/prises-en-charge")
    @ResponseStatus(HttpStatus.CREATED)
    public PriseEnChargeResponse create(@PathVariable Long patientId, @Valid @RequestBody PriseEnChargeRequest request) {
        return priseEnChargeService.create(patientId, request);
    }

    @PutMapping("/api/prises-en-charge/{id}")
    public PriseEnChargeResponse update(@PathVariable Long id, @Valid @RequestBody PriseEnChargeRequest request) {
        return priseEnChargeService.update(id, request);
    }

    @DeleteMapping("/api/prises-en-charge/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        priseEnChargeService.delete(id);
    }
}
