package com.alphamedpro.backend.visite;

import com.alphamedpro.backend.visite.dto.SousFactureRequest;
import com.alphamedpro.backend.visite.dto.SousFactureResponse;
import com.alphamedpro.backend.visite.dto.VisiteRequest;
import com.alphamedpro.backend.visite.dto.VisiteResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class VisiteController {

    private final VisiteService visiteService;

    @GetMapping("/api/visites")
    public List<VisiteResponse> findAllVisites(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) StatutPaiement statut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return visiteService.findAllVisites(search, statut, date);
    }

    @PostMapping("/api/patients/{patientId}/visites")
    @ResponseStatus(HttpStatus.CREATED)
    public VisiteResponse creerVisite(@PathVariable Long patientId,
                                      @RequestBody VisiteRequest request) {
        return visiteService.creerVisite(patientId, request);
    }

    @GetMapping("/api/patients/{patientId}/visites")
    public List<VisiteResponse> findByPatient(@PathVariable Long patientId) {
        return visiteService.findByPatient(patientId);
    }

    @GetMapping("/api/visites/{visiteId}")
    public VisiteResponse findById(@PathVariable Long visiteId) {
        return visiteService.findById(visiteId);
    }

    @PutMapping("/api/visites/{visiteId}")
    public VisiteResponse modifierVisite(@PathVariable Long visiteId,
                                         @RequestBody VisiteRequest request) {
        return visiteService.modifierVisite(visiteId, request);
    }

    @GetMapping("/api/prises-en-charge/{priseEnChargeId}/visite")
    public VisiteResponse findByPriseEnCharge(@PathVariable Long priseEnChargeId) {
        return visiteService.findByPriseEnCharge(priseEnChargeId);
    }

    @GetMapping("/api/sous-factures/{sousFactureId}")
    public SousFactureResponse findSousFactureById(@PathVariable Long sousFactureId) {
        return visiteService.findSousFactureById(sousFactureId);
    }

    @PutMapping("/api/sous-factures/{sousFactureId}")
    public SousFactureResponse modifierSousFacture(@PathVariable Long sousFactureId,
                                                  @RequestBody SousFactureRequest request) {
        return visiteService.modifierSousFacture(sousFactureId, request);
    }

    @DeleteMapping("/api/sous-factures/{sousFactureId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimerSousFacture(@PathVariable Long sousFactureId) {
        visiteService.supprimerSousFacture(sousFactureId);
    }

    @GetMapping("/api/patients/{patientId}/sous-factures")
    public List<SousFactureResponse> findSousFacturesByPatient(@PathVariable Long patientId) {
        return visiteService.findSousFacturesByPatient(patientId);
    }
}
