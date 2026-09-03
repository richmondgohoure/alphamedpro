package com.alphamedpro.backend.medecin;

import com.alphamedpro.backend.common.DuplicateResourceException;
import com.alphamedpro.backend.common.ResourceNotFoundException;
import com.alphamedpro.backend.medecin.dto.MedecinRequest;
import com.alphamedpro.backend.medecin.dto.MedecinResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MedecinService {

    private final MedecinRepository medecinRepository;

    public List<MedecinResponse> findAll(String query, String typeMedecin) {
        List<Medecin> medecins;
        if (query != null && !query.isBlank()) {
            medecins = medecinRepository.search(query.trim());
        } else if (typeMedecin != null && !typeMedecin.isBlank() && !typeMedecin.equalsIgnoreCase("ALL")) {
            medecins = medecinRepository.findByTypeMedecinIgnoreCase(typeMedecin.trim());
        } else {
            medecins = medecinRepository.findAll();
        }

        if (typeMedecin != null && !typeMedecin.isBlank() && !typeMedecin.equalsIgnoreCase("ALL") && query != null && !query.isBlank()) {
            medecins = medecins.stream()
                    .filter(m -> m.getTypeMedecin() != null && m.getTypeMedecin().equalsIgnoreCase(typeMedecin.trim()))
                    .toList();
        }

        return medecins.stream().map(MedecinResponse::from).toList();
    }

    public MedecinResponse findById(Long id) {
        return MedecinResponse.from(getOrThrow(id));
    }

    public MedecinResponse create(MedecinRequest request) {
        checkDuplicate(request.nom(), request.prenom(), request.numeroTelephone(), null);
        Medecin medecin = new Medecin();
        applyRequest(medecin, request);
        return MedecinResponse.from(medecinRepository.save(medecin));
    }

    public MedecinResponse update(Long id, MedecinRequest request) {
        Medecin medecin = getOrThrow(id);
        checkDuplicate(request.nom(), request.prenom(), request.numeroTelephone(), id);
        applyRequest(medecin, request);
        return MedecinResponse.from(medecinRepository.save(medecin));
    }

    public void delete(Long id) {
        Medecin medecin = getOrThrow(id);
        medecinRepository.delete(medecin);
    }

    private void checkDuplicate(String nom, String prenom, String numeroTelephone, Long excludeId) {
        if (nom == null || nom.isBlank() || prenom == null || prenom.isBlank() || numeroTelephone == null || numeroTelephone.isBlank()) {
            return;
        }
        String cleanNom = nom.trim();
        String cleanPrenom = prenom.trim();
        String cleanTel = numeroTelephone.trim();

        boolean exists = (excludeId == null)
                ? medecinRepository.existsByNomIgnoreCaseAndPrenomIgnoreCaseAndNumeroTelephone(cleanNom, cleanPrenom, cleanTel)
                : medecinRepository.existsByNomIgnoreCaseAndPrenomIgnoreCaseAndNumeroTelephoneAndIdNot(cleanNom, cleanPrenom, cleanTel, excludeId);

        if (exists) {
            throw new DuplicateResourceException("Un médecin avec le même nom, prénom et numéro de téléphone existe déjà.");
        }
    }

    Medecin getOrThrow(Long id) {
        return medecinRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Médecin introuvable : " + id));
    }

    private void applyRequest(Medecin medecin, MedecinRequest request) {
        medecin.setNom(request.nom() != null ? request.nom().trim() : null);
        medecin.setPrenom(request.prenom() != null ? request.prenom().trim() : null);
        medecin.setTitre(request.titre() != null && !request.titre().isBlank() ? request.titre().trim() : "Dr.");
        medecin.setSpecialite(request.specialite() != null ? request.specialite().trim() : null);
        
        String type = (request.typeMedecin() != null && !request.typeMedecin().isBlank()) 
                ? request.typeMedecin().trim().toUpperCase() 
                : "INTERNE";
        medecin.setTypeMedecin(type);
        
        medecin.setNumeroTelephone(request.numeroTelephone() != null ? request.numeroTelephone().trim() : null);
        medecin.setEmail(request.email() != null && !request.email().isBlank() ? request.email().trim() : null);
        
        // Centre de santé facultatif, pertinent surtout pour les médecins externes
        medecin.setCentreDeSante(request.centreDeSante() != null && !request.centreDeSante().isBlank() ? request.centreDeSante().trim() : null);
        medecin.setCode(request.code() != null && !request.code().isBlank() ? request.code().trim() : null);
        medecin.setAdresse(request.adresse() != null && !request.adresse().isBlank() ? request.adresse().trim() : null);
        medecin.setActif(request.actif() != null ? request.actif() : true);
    }
}
