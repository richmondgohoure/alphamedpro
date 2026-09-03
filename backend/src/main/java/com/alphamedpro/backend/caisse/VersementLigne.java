package com.alphamedpro.backend.caisse;

import com.alphamedpro.backend.visite.SousFacture;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "versement_lignes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VersementLigne {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "versement_id", nullable = false)
    @JsonIgnore
    private Versement versement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sous_facture_id", nullable = false)
    private SousFacture sousFacture;

    @Column(nullable = false)
    private BigDecimal montantImpute = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal remiseImputee = BigDecimal.ZERO;
}
