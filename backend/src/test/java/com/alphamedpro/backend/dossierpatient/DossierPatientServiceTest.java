package com.alphamedpro.backend.dossierpatient;

import com.alphamedpro.backend.dossierpatient.dto.AntecedentRequest;
import com.alphamedpro.backend.dossierpatient.dto.DossierPatientResponse;
import com.alphamedpro.backend.dossierpatient.dto.DossierPatientUpdateRequest;
import com.alphamedpro.backend.patient.Patient;
import com.alphamedpro.backend.patient.PatientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DossierPatientServiceTest {

    @Mock
    private DossierPatientRepository dossierPatientRepository;

    @Mock
    private AntecedentPatientRepository antecedentPatientRepository;

    @Mock
    private PatientRepository patientRepository;

    @InjectMocks
    private DossierPatientService dossierPatientService;

    private Patient patient;

    @BeforeEach
    void setUp() {
        patient = new Patient();
        patient.setId(10L);
        patient.setNom("Traore");
        patient.setPrenom("Fatou");
        patient.setDateNaissance(LocalDate.of(1995, 5, 20));
        patient.setNumeroTelephone("0505050505");
    }

    @Test
    void createDossierForPatient_shouldFormatNumeroAsDPAndInitializeAntecedentsToFalse() {
        when(dossierPatientRepository.findByPatientId(10L)).thenReturn(Optional.empty());
        when(dossierPatientRepository.findAll()).thenReturn(List.of());

        when(dossierPatientRepository.save(any(DossierPatient.class))).thenAnswer(invocation -> {
            DossierPatient dp = invocation.getArgument(0);
            dp.setId(1L);
            return dp;
        });

        DossierPatient result = dossierPatientService.createDossierForPatient(patient);

        assertThat(result).isNotNull();
        assertThat(result.getNumeroDossier()).isEqualTo("DP-0000001");
        assertThat(result.getAntecedents()).isNotEmpty();
        // Vérifier que tous les antécédents sont à false (Non par défaut)
        assertThat(result.getAntecedents()).allMatch(a -> !a.isActif());
        // Vérifier qu'il y a des antécédents dans tous les groupes clés
        assertThat(result.getAntecedents()).anyMatch(a -> a.getGroupe() == GroupeAntecedent.ALLERGIES);
        assertThat(result.getAntecedents()).anyMatch(a -> a.getGroupe() == GroupeAntecedent.MEDICAUX);
        assertThat(result.getAntecedents()).anyMatch(a -> a.getGroupe() == GroupeAntecedent.CHIRURGICAUX);
        assertThat(result.getAntecedents()).anyMatch(a -> a.getGroupe() == GroupeAntecedent.GYNECO_OBSTETRIQUES);
        assertThat(result.getAntecedents()).anyMatch(a -> a.getGroupe() == GroupeAntecedent.VACCINATIONS);
        assertThat(result.getAntecedents()).anyMatch(a -> a.getGroupe() == GroupeAntecedent.FAMILIAUX);
        assertThat(result.getAntecedents()).anyMatch(a -> a.getGroupe() == GroupeAntecedent.HABITUDES_VIE);
    }

    @Test
    void generateNextNumeroDossier_shouldIncrementSequentially() {
        DossierPatient dp1 = new DossierPatient();
        dp1.setNumeroDossier("DP-0000001");
        DossierPatient dp2 = new DossierPatient();
        dp2.setNumeroDossier("DP-0000042");

        when(dossierPatientRepository.findAll()).thenReturn(List.of(dp1, dp2));

        String nextNum = dossierPatientService.generateNextNumeroDossier();
        assertThat(nextNum).isEqualTo("DP-0000043");
    }

    @Test
    void updateDossier_shouldUpdateClinicalInfoAndAntecedents() {
        DossierPatient dossier = new DossierPatient();
        dossier.setId(1L);
        dossier.setNumeroDossier("DP-0000001");
        dossier.setPatient(patient);

        AntecedentPatient ant = new AntecedentPatient();
        ant.setId(100L);
        ant.setDossierPatient(dossier);
        ant.setGroupe(GroupeAntecedent.MEDICAUX);
        ant.setLibelle("Hypertension Artérielle (HTA)");
        ant.setActif(false);
        dossier.getAntecedents().add(ant);

        when(dossierPatientRepository.findByPatientId(10L)).thenReturn(Optional.of(dossier));
        when(dossierPatientRepository.save(any(DossierPatient.class))).thenAnswer(i -> i.getArgument(0));

        DossierPatientUpdateRequest updateReq = new DossierPatientUpdateRequest(
                "O+",
                "Positif",
                72.5,
                175.0,
                "12/8",
                "Patient en bonne forme générale",
                List.of(new AntecedentRequest(
                        100L,
                        GroupeAntecedent.MEDICAUX,
                        "Hypertension Artérielle (HTA)",
                        true, // Médecin met à jour vers Oui
                        "Sous Amlodipine 5mg",
                        2019,
                        1
                ))
        );

        DossierPatientResponse response = dossierPatientService.updateDossier(10L, updateReq);

        assertThat(response).isNotNull();
        assertThat(response.groupeSanguin()).isEqualTo("O+");
        assertThat(response.rhesus()).isEqualTo("Positif");
        assertThat(response.poids()).isEqualTo(72.5);
        assertThat(response.taille()).isEqualTo(175.0);
        assertThat(response.tensionArterielle()).isEqualTo("12/8");
        assertThat(response.antecedents()).hasSize(1);
        assertThat(response.antecedents().get(0).actif()).isTrue();
        assertThat(response.antecedents().get(0).details()).isEqualTo("Sous Amlodipine 5mg");
    }

    @Test
    void associateDossiersForExistingPatients_shouldCreateDossiersForPatientsWithoutOne() {
        Patient p1 = new Patient();
        p1.setId(1L);
        Patient p2 = new Patient();
        p2.setId(2L);

        when(patientRepository.findAll()).thenReturn(List.of(p1, p2));
        when(dossierPatientRepository.findByPatientId(1L)).thenReturn(Optional.empty());
        when(dossierPatientRepository.findByPatientId(2L)).thenReturn(Optional.empty());
        when(dossierPatientRepository.findAll()).thenReturn(List.of());

        int count = dossierPatientService.associateDossiersForExistingPatients();

        assertThat(count).isEqualTo(2);
        verify(dossierPatientRepository, org.mockito.Mockito.times(2)).save(any(DossierPatient.class));
    }
}
