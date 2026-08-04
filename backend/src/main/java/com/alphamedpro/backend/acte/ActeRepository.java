package com.alphamedpro.backend.acte;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ActeRepository extends JpaRepository<Acte, Long> {
    boolean existsByActTypeId(Long actTypeId);
}
