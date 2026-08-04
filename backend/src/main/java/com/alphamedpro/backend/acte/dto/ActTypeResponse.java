package com.alphamedpro.backend.acte.dto;

import com.alphamedpro.backend.acte.ActType;

public record ActTypeResponse(Long id, String code, String libelle) {
    public static ActTypeResponse from(ActType actType) {
        return new ActTypeResponse(actType.getId(), actType.getCode(), actType.getLibelle());
    }
}
