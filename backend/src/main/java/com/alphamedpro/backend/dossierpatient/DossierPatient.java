package com.alphamedpro.backend.dossierpatient;

import com.alphamedpro.backend.patient.Patient;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "dossiers_patients")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DossierPatient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_dossier", unique = true, nullable = false, length = 30)
    private String numeroDossier; // Format: DP-0000001

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", unique = true, nullable = false)
    @JsonIgnore
    private Patient patient;

    private LocalDateTime dateCreation;

    private LocalDateTime dateDerniereModification;

    @Column(length = 10)
    private String groupeSanguin; // A+, A-, B+, B-, AB+, AB-, O+, O-

    @Column(length = 20)
    private String rhesus; // Positif, Négatif

    private Double poids; // en kg

    private Double taille; // en cm

    @Column(length = 20)
    private String tensionArterielle; // ex: 12/8

    @Column(length = 2000)
    private String observationsGenerales;

    @OneToMany(mappedBy = "dossierPatient", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("groupe ASC, ordre ASC, id ASC")
    private List<AntecedentPatient> antecedents = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (dateCreation == null) {
            dateCreation = LocalDateTime.now();
        }
        dateDerniereModification = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        dateDerniereModification = LocalDateTime.now();
    }

    public void addAntecedent(AntecedentPatient antecedent) {
        antecedents.add(antecedent);
        antecedent.setDossierPatient(this);
    }
}
