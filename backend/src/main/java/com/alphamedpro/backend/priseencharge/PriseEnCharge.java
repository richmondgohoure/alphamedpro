package com.alphamedpro.backend.priseencharge;

import com.alphamedpro.backend.assurance.Assurance;
import com.alphamedpro.backend.patient.Patient;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "prises_en_charge")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PriseEnCharge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "assurance_id")
    private Assurance assurance;

    private LocalDateTime dateDemande;

    private String motif;

    private BigDecimal montant;

    private String typeCouverture; // POURCENTAGE ou FORFAIT

    private BigDecimal tauxCouverture;

    private BigDecimal montantForfait;

    private BigDecimal montantTotal;

    private BigDecimal partAssurance;

    private BigDecimal partPatient;

    @jakarta.persistence.Column(columnDefinition = "TEXT")
    private String detailsActes;

    @Enumerated(EnumType.STRING)
    private StatutPriseEnCharge statut;

    private String observation;
}
