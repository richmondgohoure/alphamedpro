package com.alphamedpro.backend.assurance;

import com.alphamedpro.backend.garant.Garant;
import com.alphamedpro.backend.patientassurance.PatientAssurance;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "assurances")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Assurance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String libelle;

    private String ncc;

    private String numeroTelephone;

    private String email;

    private BigDecimal prixConsultationGeneraliste;

    private BigDecimal prixConsultationSpecialiste;

    private BigDecimal coutB;

    private BigDecimal coutZ;

    private BigDecimal coutK;

    private BigDecimal prixChambreTriple;

    private BigDecimal prixChambreDouble;

    private BigDecimal prixChambreIndividuelleSimple;

    private BigDecimal prixChambreVip;

    private BigDecimal prixChambreVvip;

    @OneToMany(mappedBy = "assurance")
    private Set<PatientAssurance> patientAssurances = new HashSet<>();

    @ManyToMany
    @JoinTable(
            name = "assurance_garant",
            joinColumns = @JoinColumn(name = "assurance_id"),
            inverseJoinColumns = @JoinColumn(name = "garant_id")
    )
    private Set<Garant> garants = new HashSet<>();
}
