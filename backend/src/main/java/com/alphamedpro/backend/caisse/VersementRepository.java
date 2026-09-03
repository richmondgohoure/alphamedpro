package com.alphamedpro.backend.caisse;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VersementRepository extends JpaRepository<Versement, Long> {

    List<Versement> findByVisiteIdOrderByDateVersementDesc(Long visiteId);

    List<Versement> findByPatientIdOrderByDateVersementDesc(Long patientId);

    List<Versement> findAllByOrderByDateVersementDesc();

    /**
     * Récupère le dernier numéro de séquence pour une année donnée (ex: REC26-0000001).
     */
    @Query("SELECT MAX(CAST(SUBSTRING(v.numeroVersement, LENGTH(:prefix) + 2) AS integer)) " +
           "FROM Versement v WHERE v.numeroVersement LIKE :prefix%")
    Optional<Integer> findMaxSequenceForYear(@Param("prefix") String prefix);
}
