package com.alphamedpro.backend.acte;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ActTypeRepository extends JpaRepository<ActType, Long> {
    boolean existsByCode(String code);
}
