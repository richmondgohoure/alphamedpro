package com.alphamedpro.backend.visite;

import com.alphamedpro.backend.acte.Acte;
import com.alphamedpro.backend.medecin.Medecin;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "sous_facture_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SousFactureDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sous_facture_id", nullable = false)
    @JsonIgnore
    private SousFacture sousFacture;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "acte_id")
    private Acte acte;

    @Column(nullable = false, length = 255)
    private String libelleActe;

    @Column(length = 100)
    private String category;

    private BigDecimal prixUnitaire;

    @Column(nullable = false)
    private Integer quantite = 1;

    private BigDecimal montantBrut;
    private BigDecimal partAssurance;
    private BigDecimal partPatient;

    private BigDecimal tauxCouverture;

    @Column(length = 20)
    private String typeCouverture;

    private BigDecimal montantForfait;

    @Column(length = 50)
    private String coefficientInfo;

    @Column(length = 255)
    private String tarifFormula;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medecin_id")
    private Medecin medecin;
}
