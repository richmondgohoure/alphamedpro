package com.alphamedpro.backend.visite;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VisiteRepository extends JpaRepository<Visite, Long> {

    List<Visite> findByPatientIdOrderByDateVisiteDesc(Long patientId);

    List<Visite> findAllByOrderByDateVisiteDescIdDesc();

    /**
     * Récupère le dernier numéro de séquence pour une année donnée (ex: 26 pour 2026).
     * Cherche dans les numéros de type "V26-XXXXXXX".
     */
    @Query("SELECT MAX(CAST(SUBSTRING(v.numeroVisite, LENGTH(:prefix) + 2) AS integer)) " +
           "FROM Visite v WHERE v.numeroVisite LIKE :prefix%")
    Optional<Integer> findMaxSequenceForYear(@Param("prefix") String prefix);

    Optional<Visite> findByPriseEnChargeId(Long priseEnChargeId);
}
