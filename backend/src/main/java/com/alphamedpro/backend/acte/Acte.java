package com.alphamedpro.backend.acte;

import jakarta.persistence.Entity;
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

import java.math.BigDecimal;

@Entity
@Table(name = "actes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Acte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "act_type_id", nullable = false)
    private ActType actType;

    private String libelle;

    private BigDecimal prixFixe;

    // LABORATOIRE fields
    private BigDecimal coefficientB;
    private String unitePrincipale;
    private String uniteSecondaire;
    private String typeAnalyse;
    private String referenceHommeAdulte;
    private String referenceFemmeAdulte;
    private String referenceEnfant;
    private String referenceNourrisson;
    private Long numeroOrdre;

    // RADIOLOGIE fields
    private BigDecimal coefficientZ;

    // CHIRURGIE fields
    private BigDecimal coefficientK;

    // CONSULTATION fields
    private String typeConsultation;
}
