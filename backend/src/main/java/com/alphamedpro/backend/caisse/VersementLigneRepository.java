package com.alphamedpro.backend.caisse;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VersementLigneRepository extends JpaRepository<VersementLigne, Long> {
    List<VersementLigne> findByVersementId(Long versementId);
    List<VersementLigne> findBySousFactureId(Long sousFactureId);
}
