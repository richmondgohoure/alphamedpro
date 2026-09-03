package com.alphamedpro.backend.medecin;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedecinRepository extends JpaRepository<Medecin, Long> {

    @Query("SELECT m FROM Medecin m WHERE " +
            "LOWER(m.nom) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(m.prenom) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(m.specialite) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(COALESCE(m.centreDeSante, '')) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(COALESCE(m.numeroTelephone, '')) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(COALESCE(m.code, '')) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Medecin> search(@Param("query") String query);

    List<Medecin> findByTypeMedecinIgnoreCase(String typeMedecin);

    List<Medecin> findByActifTrue();

    boolean existsByNomIgnoreCaseAndPrenomIgnoreCaseAndNumeroTelephone(String nom, String prenom, String numeroTelephone);

    boolean existsByNomIgnoreCaseAndPrenomIgnoreCaseAndNumeroTelephoneAndIdNot(String nom, String prenom, String numeroTelephone, Long id);
}
