package com.alphamedpro.backend.caisse;

import com.alphamedpro.backend.patient.Patient;
import com.alphamedpro.backend.visite.Visite;
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
@Table(name = "versements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Versement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 30)
    private String numeroVersement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "visite_id", nullable = false)
    @JsonIgnore
    private Visite visite;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(nullable = false)
    private LocalDateTime dateVersement;

    private BigDecimal montantTotal;

    @Column(nullable = false)
    private BigDecimal remise = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal montantVerse = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal monnaieRendue = BigDecimal.ZERO;

    private BigDecimal resteAPayer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ModePaiement modePaiement = ModePaiement.ESPECES;

    private String referencePaiement;

    private String caissier;

    @Column(length = 1000)
    private String observations;

    @OneToMany(mappedBy = "versement", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VersementLigne> lignes = new ArrayList<>();
}
