package com.alphamedpro.backend.visite;

import com.alphamedpro.backend.acte.Acte;
import com.alphamedpro.backend.acte.ActeRepository;
import com.alphamedpro.backend.assurance.Assurance;
import com.alphamedpro.backend.assurance.AssuranceRepository;
import com.alphamedpro.backend.caisse.VersementLigne;
import com.alphamedpro.backend.caisse.VersementLigneRepository;
import com.alphamedpro.backend.garant.Garant;
import com.alphamedpro.backend.garant.GarantRepository;
import com.alphamedpro.backend.medecin.Medecin;
import com.alphamedpro.backend.medecin.MedecinRepository;
import com.alphamedpro.backend.patient.Patient;
import com.alphamedpro.backend.patient.PatientRepository;
import com.alphamedpro.backend.priseencharge.PriseEnChargeRepository;
import com.alphamedpro.backend.visite.dto.SousFactureDetailRequest;
import com.alphamedpro.backend.visite.dto.SousFactureRequest;
import com.alphamedpro.backend.visite.dto.VisiteRequest;
import com.alphamedpro.backend.visite.dto.VisiteResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VisiteServiceTest {

    @Mock
    private VisiteRepository visiteRepository;

    @Mock
    private SousFactureRepository sousFactureRepository;

    @Mock
    private SousFactureDetailRepository sousFactureDetailRepository;

    @Mock
    private VersementLigneRepository versementLigneRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private PriseEnChargeRepository priseEnChargeRepository;

    @Mock
    private AssuranceRepository assuranceRepository;

    @Mock
    private GarantRepository garantRepository;

    @Mock
    private MedecinRepository medecinRepository;

    @Mock
    private ActeRepository acteRepository;

    @InjectMocks
    private VisiteService visiteService;

    private Patient samplePatient;
    private Assurance sampleAssurance;
    private Garant sampleGarant;
    private Medecin sampleMedecin;

    @BeforeEach
    void setUp() {
        samplePatient = new Patient();
        samplePatient.setId(1L);
        samplePatient.setNom("Kouassi");
        samplePatient.setPrenom("Aya");

        sampleAssurance = new Assurance();
        sampleAssurance.setId(10L);
        sampleAssurance.setLibelle("ASCOMA");

        sampleGarant = new Garant();
        sampleGarant.setId(20L);
        sampleGarant.setLibelle("GARANT ASSUR");

        sampleMedecin = new Medecin();
        sampleMedecin.setId(5L);
        sampleMedecin.setNom("Kone");
        sampleMedecin.setPrenom("Mamadou");
        sampleMedecin.setTitre("Dr.");
    }

    @Test
    void creerVisite_shouldSaveVisiteWithSousFacturesAndDetails() {
        when(patientRepository.findById(1L)).thenReturn(Optional.of(samplePatient));
        when(assuranceRepository.findById(10L)).thenReturn(Optional.of(sampleAssurance));
        when(garantRepository.findById(20L)).thenReturn(Optional.of(sampleGarant));
        when(medecinRepository.findById(5L)).thenReturn(Optional.of(sampleMedecin));

        when(visiteRepository.findMaxSequenceForYear(any())).thenReturn(Optional.of(3));
        when(sousFactureRepository.findMaxSequenceForPrefix(eq("CO26"))).thenReturn(Optional.of(5));

        when(visiteRepository.save(any(Visite.class))).thenAnswer(inv -> {
            Visite v = inv.getArgument(0);
            v.setId(100L);
            return v;
        });

        when(sousFactureRepository.save(any(SousFacture.class))).thenAnswer(inv -> {
            SousFacture sf = inv.getArgument(0);
            sf.setId(200L);
            return sf;
        });

        SousFactureDetailRequest detailReq = new SousFactureDetailRequest(
                null,
                "Consultation Généraliste",
                "Consultation",
                BigDecimal.valueOf(10000),
                1,
                BigDecimal.valueOf(10000),
                BigDecimal.valueOf(8000),
                BigDecimal.valueOf(2000),
                BigDecimal.valueOf(80),
                "POURCENTAGE",
                null,
                null,
                "10,000 FCFA",
                5L
        );

        SousFactureRequest sfReq = new SousFactureRequest(
                "CO",
                "Consultation",
                10L,
                20L,
                5L,
                BigDecimal.valueOf(10000),
                BigDecimal.valueOf(8000),
                BigDecimal.valueOf(2000),
                LocalDateTime.of(2026, 9, 10, 14, 30),
                List.of(detailReq)
        );

        VisiteRequest visiteReq = new VisiteRequest(
                null,
                10L,
                20L,
                LocalDateTime.of(2026, 9, 10, 14, 30),
                List.of(sfReq)
        );

        VisiteResponse res = visiteService.creerVisite(1L, visiteReq);

        assertThat(res).isNotNull();
        assertThat(res.numeroVisite()).isEqualTo("V26-0000004");
        assertThat(res.patientId()).isEqualTo(1L);
        assertThat(res.sousFactures()).hasSize(1);

        var sfRes = res.sousFactures().get(0);
        assertThat(sfRes.numeroSousFacture()).isEqualTo("CO26-00000006");
        assertThat(sfRes.codeCategorie()).isEqualTo("CO");
        assertThat(sfRes.libelleCategorie()).isEqualTo("Consultation");
        assertThat(sfRes.assuranceId()).isEqualTo(10L);
        assertThat(sfRes.assuranceLibelle()).isEqualTo("ASCOMA");
        assertThat(sfRes.garantId()).isEqualTo(20L);
        assertThat(sfRes.garantLibelle()).isEqualTo("GARANT ASSUR");
        assertThat(sfRes.medecinId()).isEqualTo(5L);
        assertThat(sfRes.medecinNomComplet()).isEqualTo("Dr. Kone Mamadou");
        assertThat(sfRes.montantBrut()).isEqualByComparingTo(BigDecimal.valueOf(10000));
        assertThat(sfRes.partAssurance()).isEqualByComparingTo(BigDecimal.valueOf(8000));
        assertThat(sfRes.partPatient()).isEqualByComparingTo(BigDecimal.valueOf(2000));
        assertThat(sfRes.details()).hasSize(1);
        assertThat(sfRes.details().get(0).libelleActe()).isEqualTo("Consultation Généraliste");
    }

    @Test
    void modifierSousFacture_shouldUpdateWhenNoPayment() {
        SousFacture existingSf = new SousFacture();
        existingSf.setId(200L);
        existingSf.setNumeroSousFacture("CO26-00000001");
        existingSf.setCodeCategorie("CO");
        existingSf.setLibelleCategorie("Consultation");
        existingSf.setMontantBrut(BigDecimal.valueOf(10000));
        existingSf.setPartAssurance(BigDecimal.valueOf(8000));
        existingSf.setPartPatient(BigDecimal.valueOf(2000));
        existingSf.setMontantPaye(BigDecimal.ZERO);
        existingSf.setStatutPaiement(StatutPaiement.NON_PAYE);
        existingSf.setDateCreation(LocalDateTime.now());
        existingSf.setDetails(new ArrayList<>());

        when(sousFactureRepository.findById(200L)).thenReturn(Optional.of(existingSf));
        when(versementLigneRepository.findBySousFactureId(200L)).thenReturn(List.of());
        when(medecinRepository.findById(5L)).thenReturn(Optional.of(sampleMedecin));
        when(sousFactureRepository.save(any(SousFacture.class))).thenAnswer(inv -> inv.getArgument(0));

        SousFactureDetailRequest updatedDetail = new SousFactureDetailRequest(
                null,
                "Consultation Spécialiste",
                "Consultation",
                BigDecimal.valueOf(15000),
                1,
                BigDecimal.valueOf(15000),
                BigDecimal.valueOf(12000),
                BigDecimal.valueOf(3000),
                BigDecimal.valueOf(80),
                "POURCENTAGE",
                null,
                null,
                "15,000 FCFA",
                5L
        );

        SousFactureRequest updateReq = new SousFactureRequest(
                "CO",
                "Consultation Spécialisée",
                null,
                null,
                5L,
                BigDecimal.valueOf(15000),
                BigDecimal.valueOf(12000),
                BigDecimal.valueOf(3000),
                null,
                List.of(updatedDetail)
        );

        var res = visiteService.modifierSousFacture(200L, updateReq);

        assertThat(res).isNotNull();
        assertThat(res.libelleCategorie()).isEqualTo("Consultation Spécialisée");
        assertThat(res.montantBrut()).isEqualByComparingTo(BigDecimal.valueOf(15000));
        assertThat(res.partAssurance()).isEqualByComparingTo(BigDecimal.valueOf(12000));
        assertThat(res.partPatient()).isEqualByComparingTo(BigDecimal.valueOf(3000));
        assertThat(res.medecinNomComplet()).isEqualTo("Dr. Kone Mamadou");
        assertThat(res.details()).hasSize(1);
    }

    @Test
    void modifierSousFacture_shouldThrowIfPaymentExists() {
        SousFacture paidSf = new SousFacture();
        paidSf.setId(201L);
        paidSf.setMontantPaye(BigDecimal.valueOf(5000));
        paidSf.setStatutPaiement(StatutPaiement.PARTIELLEMENT_PAYE);

        when(sousFactureRepository.findById(201L)).thenReturn(Optional.of(paidSf));

        SousFactureRequest updateReq = new SousFactureRequest(
                "CO", "Consultation", null, null, null,
                BigDecimal.valueOf(10000), BigDecimal.ZERO, BigDecimal.valueOf(10000),
                null, List.of()
        );

        assertThatThrownBy(() -> visiteService.modifierSousFacture(201L, updateReq))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Impossible de modifier une sous-facture ayant déjà fait l'objet d'un versement.");
    }

    @Test
    void supprimerSousFacture_shouldDeleteWhenNoPayment() {
        Visite v = new Visite();
        v.setId(50L);
        v.setSousFactures(new ArrayList<>());

        SousFacture unpaidSf = new SousFacture();
        unpaidSf.setId(202L);
        unpaidSf.setMontantPaye(BigDecimal.ZERO);
        unpaidSf.setStatutPaiement(StatutPaiement.NON_PAYE);
        unpaidSf.setVisite(v);
        v.getSousFactures().add(unpaidSf);

        when(sousFactureRepository.findById(202L)).thenReturn(Optional.of(unpaidSf));
        when(versementLigneRepository.findBySousFactureId(202L)).thenReturn(List.of());

        visiteService.supprimerSousFacture(202L);

        verify(sousFactureRepository).delete(unpaidSf);
        assertThat(v.getSousFactures()).doesNotContain(unpaidSf);
    }

    @Test
    void supprimerSousFacture_shouldThrowIfPaymentExists() {
        SousFacture paidSf = new SousFacture();
        paidSf.setId(203L);
        paidSf.setMontantPaye(BigDecimal.valueOf(2000));
        paidSf.setStatutPaiement(StatutPaiement.PAYE);

        when(sousFactureRepository.findById(203L)).thenReturn(Optional.of(paidSf));

        assertThatThrownBy(() -> visiteService.supprimerSousFacture(203L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Impossible de supprimer une sous-facture ayant déjà fait l'objet d'un versement.");
    }
    @Test
    void modifierVisite_shouldUpdateWhenNoPayment() {
        Visite v = new Visite();
        v.setId(300L);
        v.setNumeroVisite("V26-0000001");
        v.setDateVisite(LocalDateTime.of(2026, 1, 15, 10, 0));
        v.setPatient(samplePatient);
        v.setSousFactures(new ArrayList<>());

        SousFacture existingSf = new SousFacture();
        existingSf.setId(301L);
        existingSf.setVisite(v);
        existingSf.setMontantPaye(BigDecimal.ZERO);
        existingSf.setStatutPaiement(StatutPaiement.NON_PAYE);
        v.getSousFactures().add(existingSf);

        when(visiteRepository.findById(300L)).thenReturn(Optional.of(v));
        when(versementLigneRepository.findBySousFactureId(301L)).thenReturn(List.of());
        when(sousFactureRepository.findMaxSequenceForPrefix("CO26")).thenReturn(Optional.of(0));
        when(sousFactureRepository.save(any(SousFacture.class))).thenAnswer(inv -> inv.getArgument(0));
        when(visiteRepository.save(any(Visite.class))).thenAnswer(inv -> inv.getArgument(0));

        SousFactureDetailRequest detailReq = new SousFactureDetailRequest(
                null,
                "Consultation Générale",
                "Consultation",
                BigDecimal.valueOf(10000),
                1,
                BigDecimal.valueOf(10000),
                BigDecimal.valueOf(8000),
                BigDecimal.valueOf(2000),
                BigDecimal.valueOf(80),
                "POURCENTAGE",
                null,
                null,
                "Tarif Généraliste",
                null
        );

        SousFactureRequest sfReq = new SousFactureRequest(
                "CO",
                "Consultation",
                null,
                null,
                null,
                BigDecimal.valueOf(10000),
                BigDecimal.valueOf(8000),
                BigDecimal.valueOf(2000),
                LocalDateTime.of(2026, 1, 15, 10, 0),
                List.of(detailReq)
        );

        VisiteRequest vReq = new VisiteRequest(
                null,
                null,
                null,
                LocalDateTime.of(2026, 1, 15, 10, 30),
                List.of(sfReq)
        );

        var res = visiteService.modifierVisite(300L, vReq);

        assertThat(res).isNotNull();
        assertThat(res.id()).isEqualTo(300L);
        assertThat(res.numeroVisite()).isEqualTo("V26-0000001");
        assertThat(res.sousFactures()).hasSize(1);
    }

    @Test
    void modifierVisite_shouldThrowIfPaymentExists() {
        Visite v = new Visite();
        v.setId(310L);
        v.setSousFactures(new ArrayList<>());

        SousFacture paidSf = new SousFacture();
        paidSf.setId(311L);
        paidSf.setMontantPaye(BigDecimal.valueOf(5000));
        paidSf.setStatutPaiement(StatutPaiement.PARTIELLEMENT_PAYE);
        v.getSousFactures().add(paidSf);

        when(visiteRepository.findById(310L)).thenReturn(Optional.of(v));

        VisiteRequest vReq = new VisiteRequest(
                null, null, null, LocalDateTime.now(), List.of()
        );

        assertThatThrownBy(() -> visiteService.modifierVisite(310L, vReq))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Impossible de modifier une visite ayant déjà fait l'objet d'un versement.");
    }
}
