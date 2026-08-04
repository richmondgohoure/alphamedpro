package com.alphamedpro.backend.acte;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceRepository extends JpaRepository<Service, Long> {
    boolean existsByLibelleIgnoreCase(String libelle);
}
