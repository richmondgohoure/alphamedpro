package com.alphamedpro.backend.acte;

import com.alphamedpro.backend.acte.dto.ActeRequest;
import com.alphamedpro.backend.acte.dto.ActeResponse;
import com.alphamedpro.backend.common.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ActeService {

    private final ActeRepository acteRepository;
    private final ActTypeRepository actTypeRepository;

    public List<ActeResponse> findAll() {
        return acteRepository.findAll().stream()
                .sorted(Comparator.comparing(Acte::getLibelle, String.CASE_INSENSITIVE_ORDER))
                .map(ActeResponse::from)
                .toList();
    }

    public ActeResponse findById(Long id) {
        return ActeResponse.from(getOrThrow(id));
    }

    public ActeResponse create(ActeRequest request) {
        Acte acte = new Acte();
        applyRequest(acte, request);
        Acte saved = acteRepository.save(acte);
        if (saved.getNumeroOrdre() == null) {
            saved.setNumeroOrdre(saved.getId());
            saved = acteRepository.save(saved);
        }
        return ActeResponse.from(saved);
    }

    public ActeResponse update(Long id, ActeRequest request) {
        Acte acte = getOrThrow(id);
        applyRequest(acte, request);
        Acte saved = acteRepository.save(acte);
        if (saved.getNumeroOrdre() == null) {
            saved.setNumeroOrdre(saved.getId());
            saved = acteRepository.save(saved);
        }
        return ActeResponse.from(saved);
    }

    public void delete(Long id) {
        acteRepository.delete(getOrThrow(id));
    }

    Acte getOrThrow(Long id) {
        return acteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Acte introuvable : " + id));
    }

    private void applyRequest(Acte acte, ActeRequest request) {
        ActType actType = actTypeRepository.findById(request.actTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Type d'acte introuvable : " + request.actTypeId()));
        acte.setActType(actType);
        acte.setLibelle(request.libelle().trim());
        acte.setPrixFixe(request.prixFixe());
        acte.setCoefficientB(request.coefficientB());
        acte.setUnitePrincipale(request.unitePrincipale());
        acte.setUniteSecondaire(request.uniteSecondaire());
        acte.setTypeAnalyse(request.typeAnalyse());
        acte.setReferenceHommeAdulte(request.referenceHommeAdulte());
        acte.setReferenceFemmeAdulte(request.referenceFemmeAdulte());
        acte.setReferenceEnfant(request.referenceEnfant());
        acte.setReferenceNourrisson(request.referenceNourrisson());
        acte.setNumeroOrdre(request.numeroOrdre());
        acte.setCoefficientZ(request.coefficientZ());
        acte.setCoefficientK(request.coefficientK());
        acte.setTypeConsultation(request.typeConsultation());
    }
}
