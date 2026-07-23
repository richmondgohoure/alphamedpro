package com.alphamedpro.backend.garant;

import com.alphamedpro.backend.common.ResourceNotFoundException;
import com.alphamedpro.backend.garant.dto.GarantRequest;
import com.alphamedpro.backend.garant.dto.GarantResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class GarantService {

    private final GarantRepository garantRepository;

    public List<GarantResponse> findAll() {
        return garantRepository.findAll().stream().map(GarantResponse::from).toList();
    }

    public GarantResponse findById(Long id) {
        return GarantResponse.from(getOrThrow(id));
    }

    public GarantResponse create(GarantRequest request) {
        Garant garant = new Garant();
        applyRequest(garant, request);
        return GarantResponse.from(garantRepository.save(garant));
    }

    public GarantResponse update(Long id, GarantRequest request) {
        Garant garant = getOrThrow(id);
        applyRequest(garant, request);
        return GarantResponse.from(garantRepository.save(garant));
    }

    public void delete(Long id) {
        Garant garant = getOrThrow(id);
        garantRepository.delete(garant);
    }

    Garant getOrThrow(Long id) {
        return garantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Garant introuvable : " + id));
    }

    private void applyRequest(Garant garant, GarantRequest request) {
        garant.setLibelle(request.libelle());
        garant.setNumeroTelephone(request.numeroTelephone());
        garant.setEmail(request.email());
    }
}
