package com.alphamedpro.backend.medecin;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "medecins")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Medecin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(nullable = false, length = 100)
    private String prenom;

    @Column(length = 50)
    private String titre = "Dr.";

    @Column(nullable = false, length = 150)
    private String specialite;

    /**
     * Type de médecin : "INTERNE" (praticien interne de la clinique) ou "EXTERNE" (praticien externe / prescripteur)
     */
    @Column(nullable = false, length = 30)
    private String typeMedecin = "INTERNE";

    @Column(nullable = false, length = 50)
    private String numeroTelephone;

    @Column(length = 150)
    private String email;

    /**
     * Centre de santé de provenance (facultatif, pertinent notamment pour les médecins externes)
     */
    @Column(length = 200)
    private String centreDeSante;

    @Column(length = 50)
    private String code;

    @Column(length = 255)
    private String adresse;

    @Column(nullable = false)
    private Boolean actif = true;
}
