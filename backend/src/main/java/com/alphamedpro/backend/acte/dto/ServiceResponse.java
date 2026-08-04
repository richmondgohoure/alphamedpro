package com.alphamedpro.backend.acte.dto;

import com.alphamedpro.backend.acte.Service;

public record ServiceResponse(Long id, String libelle) {
    public static ServiceResponse from(Service service) {
        return new ServiceResponse(service.getId(), service.getLibelle());
    }
}
