package com.alphamedpro.backend.dossierpatient;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AntecedentPatientRepository extends JpaRepository<AntecedentPatient, Long> {

    List<AntecedentPatient> findByDossierPatientIdOrderByGroupeAscOrdreAscIdAsc(Long dossierPatientId);

    List<AntecedentPatient> findByDossierPatientIdAndGroupeOrderByOrdreAscIdAsc(Long dossierPatientId, GroupeAntecedent groupe);
}
