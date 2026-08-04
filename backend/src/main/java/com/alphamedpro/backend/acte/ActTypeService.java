package com.alphamedpro.backend.acte;

import com.alphamedpro.backend.acte.dto.ActTypeRequest;
import com.alphamedpro.backend.acte.dto.ActTypeResponse;
import com.alphamedpro.backend.common.ResourceNotFoundException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ActTypeService {

    private final ActTypeRepository actTypeRepository;
    private final ActeRepository acteRepository;

    @PostConstruct
    void initializeDefaults() {
        if (actTypeRepository.count() > 0) {
            return;
        }

        List<ActType> defaults = List.of(
                new ActType(null, "ANALYSE_MEDICAL", "ANALYSE MEDICAL"),
                new ActType(null, "RADIOLOGIE", "RADIOLOGIE"),
                new ActType(null, "SCANNER", "SCANNER"),
                new ActType(null, "CONSULTATION", "CONSULTATION"),
                new ActType(null, "ECHOGRAPHIE", "ECHOGRAPHIE"),
                new ActType(null, "CHIRURGIE", "CHIRURGIE"),
                new ActType(null, "PRELEVEMENT", "PRELEVEMENT"),
                new ActType(null, "SOINS", "SOINS"),
                new ActType(null, "AUTRES", "AUTRES")
        );
        actTypeRepository.saveAll(defaults);
    }

    public List<ActTypeResponse> findAll() {
        return actTypeRepository.findAll().stream().map(ActTypeResponse::from).toList();
    }

    public ActTypeResponse findById(Long id) {
        return ActTypeResponse.from(getOrThrow(id));
    }

    public ActTypeResponse create(ActTypeRequest request) {
        ActType actType = new ActType();
        applyRequest(actType, request);
        return ActTypeResponse.from(actTypeRepository.save(actType));
    }

    public ActTypeResponse update(Long id, ActTypeRequest request) {
        ActType actType = getOrThrow(id);
        applyRequest(actType, request);
        return ActTypeResponse.from(actTypeRepository.save(actType));
    }

    public void delete(Long id) {
        ActType actType = getOrThrow(id);
        if (acteRepository.existsByActTypeId(id)) {
            throw new IllegalStateException("Impossible de supprimer un type d'acte utilisé par des actes");
        }
        actTypeRepository.delete(actType);
    }

    ActType getOrThrow(Long id) {
        return actTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Type d'acte introuvable : " + id));
    }

    private void applyRequest(ActType actType, ActTypeRequest request) {
        actType.setCode(request.code().trim().toUpperCase());
        actType.setLibelle(request.libelle().trim());
    }
}
