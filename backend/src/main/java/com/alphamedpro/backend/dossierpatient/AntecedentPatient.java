package com.alphamedpro.backend.dossierpatient;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "antecedents_patients")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AntecedentPatient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier_patient_id", nullable = false)
    @JsonIgnore
    private DossierPatient dossierPatient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private GroupeAntecedent groupe;

    @Column(nullable = false, length = 255)
    private String libelle;

    @Column(nullable = false)
    private boolean actif = false; // Tous à 'Non' (false) par défaut

    @Column(length = 1000)
    private String details;

    private Integer annee;

    @Column(name = "ordre_affichage")
    private int ordre;
}
