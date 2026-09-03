package com.alphamedpro.backend.visite;

import com.alphamedpro.backend.caisse.Versement;
import com.alphamedpro.backend.patient.Patient;
import com.alphamedpro.backend.priseencharge.PriseEnCharge;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "visites")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Visite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 20)
    private String numeroVisite;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prise_en_charge_id")
    private PriseEnCharge priseEnCharge;

    @Column(nullable = false)
    private LocalDateTime dateVisite;

    @Column(nullable = false)
    private LocalDateTime dateCreation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    private StatutPaiement statutPaiement = StatutPaiement.NON_PAYE;

    @OneToMany(mappedBy = "visite", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SousFacture> sousFactures = new ArrayList<>();

    @OneToMany(mappedBy = "visite", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("dateVersement DESC")
    private List<Versement> versements = new ArrayList<>();
}
