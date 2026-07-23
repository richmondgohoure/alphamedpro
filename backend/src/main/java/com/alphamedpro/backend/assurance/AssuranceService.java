package com.alphamedpro.backend.assurance;

import com.alphamedpro.backend.assurance.dto.AssuranceRequest;
import com.alphamedpro.backend.assurance.dto.AssuranceResponse;
import com.alphamedpro.backend.common.ResourceNotFoundException;
import com.alphamedpro.backend.garant.Garant;
import com.alphamedpro.backend.garant.GarantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class AssuranceService {

    private final AssuranceRepository assuranceRepository;
    private final GarantRepository garantRepository;

    public List<AssuranceResponse> findAll() {
        return assuranceRepository.findAll().stream().map(AssuranceResponse::from).toList();
    }

    public AssuranceResponse findById(Long id) {
        return AssuranceResponse.from(getOrThrow(id));
    }

    public AssuranceResponse create(AssuranceRequest request) {
        Assurance assurance = new Assurance();
        applyRequest(assurance, request);
        return AssuranceResponse.from(assuranceRepository.save(assurance));
    }

    public AssuranceResponse update(Long id, AssuranceRequest request) {
        Assurance assurance = getOrThrow(id);
        applyRequest(assurance, request);
        return AssuranceResponse.from(assuranceRepository.save(assurance));
    }

    public void delete(Long id) {
        Assurance assurance = getOrThrow(id);
        assuranceRepository.delete(assurance);
    }

    Assurance getOrThrow(Long id) {
        return assuranceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assurance introuvable : " + id));
    }

    private void applyRequest(Assurance assurance, AssuranceRequest request) {
        assurance.setLibelle(request.libelle());
        assurance.setNcc(request.ncc());
        assurance.setNumeroTelephone(request.numeroTelephone());
        assurance.setEmail(request.email());
        assurance.setPrixConsultationGeneraliste(request.prixConsultationGeneraliste());
        assurance.setPrixConsultationSpecialiste(request.prixConsultationSpecialiste());
        assurance.setCoutB(request.coutB());
        assurance.setCoutZ(request.coutZ());
        assurance.setCoutK(request.coutK());
        assurance.setPrixChambreTriple(request.prixChambreTriple());
        assurance.setPrixChambreDouble(request.prixChambreDouble());
        assurance.setPrixChambreIndividuelleSimple(request.prixChambreIndividuelleSimple());
        assurance.setPrixChambreVip(request.prixChambreVip());
        assurance.setPrixChambreVvip(request.prixChambreVvip());

        List<Long> garantIds = request.garantIds();
        if (garantIds == null || garantIds.isEmpty()) {
            assurance.setGarants(new HashSet<>());
        } else {
            Set<Garant> garants = new HashSet<>(garantRepository.findAllById(garantIds));
            assurance.setGarants(garants);
        }
    }
}
