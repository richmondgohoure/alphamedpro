package com.alphamedpro.backend.caisse;

import com.alphamedpro.backend.caisse.dto.VersementRequest;
import com.alphamedpro.backend.caisse.dto.VersementResponse;
import com.alphamedpro.backend.patient.Patient;
import com.alphamedpro.backend.visite.SousFacture;
import com.alphamedpro.backend.visite.SousFactureRepository;
import com.alphamedpro.backend.visite.StatutPaiement;
import com.alphamedpro.backend.visite.Visite;
import com.alphamedpro.backend.visite.VisiteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CaisseServiceTest {

    @Mock
    private VisiteRepository visiteRepository;

    @Mock
    private SousFactureRepository sousFactureRepository;

    @Mock
    private VersementRepository versementRepository;

    @Mock
    private VersementLigneRepository versementLigneRepository;

    @InjectMocks
    private CaisseService caisseService;

    private Patient patient;
    private Visite visite;
    private SousFacture sf1;
    private SousFacture sf2;

    @BeforeEach
    void setUp() {
        patient = new Patient();
        patient.setId(1L);
        patient.setNom("Kouassi");
        patient.setPrenom("Aya");

        visite = new Visite();
        visite.setId(10L);
        visite.setNumeroVisite("V26-0000001");
        visite.setPatient(patient);
        visite.setDateVisite(LocalDateTime.of(2026, 9, 10, 10, 0));
        visite.setDateCreation(LocalDateTime.of(2026, 9, 10, 10, 0));
        visite.setStatutPaiement(StatutPaiement.NON_PAYE);
        visite.setSousFactures(new ArrayList<>());
        visite.setVersements(new ArrayList<>());

        sf1 = new SousFacture();
        sf1.setId(101L);
        sf1.setNumeroSousFacture("CO26-00000001");
        sf1.setCodeCategorie("CO");
        sf1.setLibelleCategorie("Consultation");
        sf1.setVisite(visite);
        sf1.setPatient(patient);
        sf1.setMontantBrut(BigDecimal.valueOf(10000));
        sf1.setPartAssurance(BigDecimal.valueOf(8000));
        sf1.setPartPatient(BigDecimal.valueOf(2000));
        sf1.setRemise(BigDecimal.ZERO);
        sf1.setMontantPaye(BigDecimal.ZERO);
        sf1.setStatutPaiement(StatutPaiement.NON_PAYE);
        sf1.setDateCreation(LocalDateTime.of(2026, 9, 10, 10, 0));

        sf2 = new SousFacture();
        sf2.setId(102L);
        sf2.setNumeroSousFacture("EB26-00000001");
        sf2.setCodeCategorie("EB");
        sf2.setLibelleCategorie("Examens Biologiques");
        sf2.setVisite(visite);
        sf2.setPatient(patient);
        sf2.setMontantBrut(BigDecimal.valueOf(25000));
        sf2.setPartAssurance(BigDecimal.valueOf(20000));
        sf2.setPartPatient(BigDecimal.valueOf(5000));
        sf2.setRemise(BigDecimal.ZERO);
        sf2.setMontantPaye(BigDecimal.ZERO);
        sf2.setStatutPaiement(StatutPaiement.NON_PAYE);
        sf2.setDateCreation(LocalDateTime.of(2026, 9, 10, 10, 0));

        visite.getSousFactures().add(sf1);
        visite.getSousFactures().add(sf2);
    }

    @Test
    void enregistrerVersement_paiementTotal_solded() {
        when(visiteRepository.findById(10L)).thenReturn(Optional.of(visite));
        when(versementRepository.findMaxSequenceForYear(eq("REC26"))).thenReturn(Optional.of(0));
        when(versementRepository.save(any(Versement.class))).thenAnswer(inv -> inv.getArgument(0));

        VersementRequest request = new VersementRequest(
                LocalDateTime.of(2026, 9, 10, 11, 30),
                BigDecimal.valueOf(7000), // Total part patient = 2000 + 5000 = 7000
                BigDecimal.ZERO,
                ModePaiement.ESPECES,
                null,
                "Caissier 1",
                "Règlement total",
                List.of(101L, 102L),
                null
        );

        VersementResponse res = caisseService.enregistrerVersement(10L, request);

        assertThat(res).isNotNull();
        assertThat(res.numeroVersement()).isEqualTo("REC26-0000001");
        assertThat(res.montantVerse()).isEqualByComparingTo(BigDecimal.valueOf(7000));
        assertThat(res.resteAPayer()).isEqualByComparingTo(BigDecimal.ZERO);

        assertThat(sf1.getStatutPaiement()).isEqualTo(StatutPaiement.PAYE);
        assertThat(sf2.getStatutPaiement()).isEqualTo(StatutPaiement.PAYE);
        assertThat(visite.getStatutPaiement()).isEqualTo(StatutPaiement.PAYE);
    }

    @Test
    void enregistrerVersement_paiementPartiel_tranche_withRemise() {
        when(visiteRepository.findById(10L)).thenReturn(Optional.of(visite));
        when(versementRepository.findMaxSequenceForYear(eq("REC26"))).thenReturn(Optional.of(5));
        when(versementRepository.save(any(Versement.class))).thenAnswer(inv -> inv.getArgument(0));

        // Part patient SF1 (2000) + SF2 (5000) = 7000.
        // Remise = 1000. Net à payer = 6000.
        // Versement partiel 1ère tranche = 4000.
        // Reste dû = 2000.
        VersementRequest request = new VersementRequest(
                LocalDateTime.of(2026, 9, 10, 11, 45),
                BigDecimal.valueOf(4000),
                BigDecimal.valueOf(1000),
                ModePaiement.WAVE,
                "WAVE-TX-9988",
                "Mme Diallo",
                "Paiement 1ère tranche Wave",
                List.of(101L, 102L),
                null
        );

        VersementResponse res = caisseService.enregistrerVersement(10L, request);

        assertThat(res).isNotNull();
        assertThat(res.numeroVersement()).isEqualTo("REC26-0000006");
        assertThat(res.montantVerse()).isEqualByComparingTo(BigDecimal.valueOf(4000));
        assertThat(res.remise()).isEqualByComparingTo(BigDecimal.valueOf(1000));
        assertThat(res.resteAPayer()).isEqualByComparingTo(BigDecimal.valueOf(2000));

        assertThat(visite.getStatutPaiement()).isEqualTo(StatutPaiement.PARTIELLEMENT_PAYE);
    }
}
