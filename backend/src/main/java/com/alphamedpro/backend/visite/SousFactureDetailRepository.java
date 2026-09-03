package com.alphamedpro.backend.visite;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SousFactureDetailRepository extends JpaRepository<SousFactureDetail, Long> {

    List<SousFactureDetail> findBySousFactureId(Long sousFactureId);
}
