package com.alphamedpro.backend.dossierpatient;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DossierPatientRepository extends JpaRepository<DossierPatient, Long> {

    Optional<DossierPatient> findByPatientId(Long patientId);

    Optional<DossierPatient> findByNumeroDossier(String numeroDossier);

    boolean existsByNumeroDossier(String numeroDossier);

    @Query("SELECT MAX(d.id) FROM DossierPatient d")
    Long findMaxId();

    @Query("SELECT COUNT(d) FROM DossierPatient d")
    long countAllDossiers();
}
