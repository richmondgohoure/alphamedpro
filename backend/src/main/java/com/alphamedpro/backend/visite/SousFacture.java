package com.alphamedpro.backend.visite;

import com.alphamedpro.backend.assurance.Assurance;
import com.alphamedpro.backend.garant.Garant;
import com.alphamedpro.backend.medecin.Medecin;
import com.alphamedpro.backend.patient.Patient;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sous_factures")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SousFacture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 25)
    private String numeroSousFacture;

    /**
     * Code de catégorie : CO, EB, RA, SC, EC, PR, AU
     */
    @Column(nullable = false, length = 5)
    private String codeCategorie;

    /**
     * Libellé de la catégorie (Consultation, Labo, Radiologie, ...)
     */
    @Column(nullable = false)
    private String libelleCategorie;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "visite_id", nullable = false)
    @JsonIgnore
    private Visite visite;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assurance_id")
    private Assurance assurance;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "garant_id")
    private Garant garant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medecin_id")
    private Medecin medecin;

    private BigDecimal montantBrut;
    private BigDecimal partAssurance;
    private BigDecimal partPatient;

    @Column(nullable = false)
    private BigDecimal remise = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal montantPaye = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    private StatutPaiement statutPaiement = StatutPaiement.NON_PAYE;

    @Column(nullable = false)
    private LocalDateTime dateCreation;

    @OneToMany(mappedBy = "sousFacture", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SousFactureDetail> details = new ArrayList<>();
}
