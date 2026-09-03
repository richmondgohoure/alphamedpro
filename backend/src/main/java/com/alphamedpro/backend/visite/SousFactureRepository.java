package com.alphamedpro.backend.visite;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SousFactureRepository extends JpaRepository<SousFacture, Long> {

    List<SousFacture> findByVisiteId(Long visiteId);

    List<SousFacture> findByPatientIdOrderByDateCreationDesc(Long patientId);

    /**
     * Récupère le dernier numéro de séquence pour un préfixe donné (ex: "CO26-").
     * Les numéros sont de type "CO26-00000001".
     */
    @Query("SELECT MAX(CAST(SUBSTRING(sf.numeroSousFacture, LENGTH(:prefix) + 2) AS integer)) " +
           "FROM SousFacture sf WHERE sf.numeroSousFacture LIKE :prefix%")
    Optional<Integer> findMaxSequenceForPrefix(@Param("prefix") String prefix);
}
