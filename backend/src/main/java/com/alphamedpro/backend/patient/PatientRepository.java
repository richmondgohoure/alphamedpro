package com.alphamedpro.backend.patient;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PatientRepository extends JpaRepository<Patient, Long> {

    @Query("SELECT p FROM Patient p WHERE " +
            "LOWER(p.nom) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(p.prenom) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(p.numeroTelephone) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(p.code) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "CAST(p.id AS string) LIKE CONCAT('%', :query, '%')")
    List<Patient> search(@Param("query") String query);

    @Query("SELECT COUNT(p) > 0 FROM Patient p WHERE " +
            "LOWER(TRIM(p.nom)) = LOWER(TRIM(:nom)) AND " +
            "p.numeroTelephone IS NOT NULL AND TRIM(p.numeroTelephone) <> '' AND " +
            "LOWER(TRIM(p.numeroTelephone)) = LOWER(TRIM(:numeroTelephone))")
    boolean existsByNomAndNumeroTelephoneIgnoreCase(
            @Param("nom") String nom,
            @Param("numeroTelephone") String numeroTelephone
    );

    @Query("SELECT COUNT(p) > 0 FROM Patient p WHERE " +
            "p.id <> :id AND " +
            "LOWER(TRIM(p.nom)) = LOWER(TRIM(:nom)) AND " +
            "p.numeroTelephone IS NOT NULL AND TRIM(p.numeroTelephone) <> '' AND " +
            "LOWER(TRIM(p.numeroTelephone)) = LOWER(TRIM(:numeroTelephone))")
    boolean existsByNomAndNumeroTelephoneIgnoreCaseAndIdNot(
            @Param("nom") String nom,
            @Param("numeroTelephone") String numeroTelephone,
            @Param("id") Long id
    );
}
