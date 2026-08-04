package com.alphamedpro.backend.acte;

import com.alphamedpro.backend.acte.dto.ServiceRequest;
import com.alphamedpro.backend.acte.dto.ServiceResponse;
import com.alphamedpro.backend.common.ResourceNotFoundException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@org.springframework.stereotype.Service
@RequiredArgsConstructor
@Transactional
public class ServiceService {

    private final ServiceRepository serviceRepository;

    @PostConstruct
    void initializeDefaults() {
        if (serviceRepository.count() > 0) {
            return;
        }

        List<com.alphamedpro.backend.acte.Service> defaults = List.of(
                new com.alphamedpro.backend.acte.Service(null, "IMAGERIE"),
                new com.alphamedpro.backend.acte.Service(null, "LABORATOIRE"),
                new com.alphamedpro.backend.acte.Service(null, "GYNECOLOGIE"),
                new com.alphamedpro.backend.acte.Service(null, "PEDIATRIE")
        );
        serviceRepository.saveAll(defaults);
    }

    public List<ServiceResponse> findAll() {
        return serviceRepository.findAll().stream().map(ServiceResponse::from).toList();
    }

    public ServiceResponse findById(Long id) {
        return ServiceResponse.from(getOrThrow(id));
    }

    public ServiceResponse create(ServiceRequest request) {
        com.alphamedpro.backend.acte.Service service = new com.alphamedpro.backend.acte.Service();
        applyRequest(service, request);
        return ServiceResponse.from(serviceRepository.save(service));
    }

    public ServiceResponse update(Long id, ServiceRequest request) {
        com.alphamedpro.backend.acte.Service service = getOrThrow(id);
        applyRequest(service, request);
        return ServiceResponse.from(serviceRepository.save(service));
    }

    public void delete(Long id) {
        serviceRepository.delete(getOrThrow(id));
    }

    com.alphamedpro.backend.acte.Service getOrThrow(Long id) {
        return serviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service introuvable : " + id));
    }

    private void applyRequest(com.alphamedpro.backend.acte.Service service, ServiceRequest request) {
        service.setLibelle(request.libelle().trim());
    }
}
