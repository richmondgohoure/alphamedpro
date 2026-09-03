package com.alphamedpro.backend.caisse;

import com.alphamedpro.backend.caisse.dto.VersementRequest;
import com.alphamedpro.backend.caisse.dto.VersementResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class CaisseController {

    private final CaisseService caisseService;

    @PostMapping("/api/visites/{visiteId}/versements")
    @ResponseStatus(HttpStatus.CREATED)
    public VersementResponse enregistrerVersement(@PathVariable Long visiteId,
                                                  @RequestBody VersementRequest request) {
        return caisseService.enregistrerVersement(visiteId, request);
    }

    @GetMapping("/api/visites/{visiteId}/versements")
    public List<VersementResponse> getVersementsByVisite(@PathVariable Long visiteId) {
        return caisseService.getVersementsByVisite(visiteId);
    }

    @GetMapping("/api/versements/{versementId}")
    public VersementResponse getVersementById(@PathVariable Long versementId) {
        return caisseService.getVersementById(versementId);
    }

    @GetMapping("/api/versements")
    public List<VersementResponse> getAllVersements() {
        return caisseService.getAllVersements();
    }

    @GetMapping("/api/patients/{patientId}/versements")
    public List<VersementResponse> getVersementsByPatient(@PathVariable Long patientId) {
        return caisseService.getVersementsByPatient(patientId);
    }
}
