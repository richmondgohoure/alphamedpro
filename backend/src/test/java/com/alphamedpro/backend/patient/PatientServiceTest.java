package com.alphamedpro.backend.patient;

import com.alphamedpro.backend.assurance.Assurance;
import com.alphamedpro.backend.assurance.AssuranceRepository;
import com.alphamedpro.backend.common.DuplicateResourceException;
import com.alphamedpro.backend.dossierpatient.DossierPatientService;
import com.alphamedpro.backend.garant.Garant;
import com.alphamedpro.backend.garant.GarantRepository;
import com.alphamedpro.backend.patient.dto.PatientAssuranceRequest;
import com.alphamedpro.backend.patient.dto.PatientRequest;
import com.alphamedpro.backend.patient.dto.PatientResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PatientServiceTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private AssuranceRepository assuranceRepository;

    @Mock
    private GarantRepository garantRepository;

    @Mock
    private DossierPatientService dossierPatientService;

    @InjectMocks
    private PatientService patientService;

    private PatientRequest sampleRequest;

    @BeforeEach
    void setUp() {
        sampleRequest = new PatientRequest(
                "Kouame",
                "Jean",
                LocalDate.of(1990, 1, 1),
                "0701020304",
                "Cocody",
                "Ingénieur",
                "CARD-001",
                null
        );
    }

    @Test
    void create_shouldSavePatient_whenNoDuplicateExists() {
        when(patientRepository.existsByNomAndNumeroTelephoneIgnoreCase("Kouame", "0701020304"))
                .thenReturn(false);

        Patient savedPatient = new Patient();
        savedPatient.setId(1L);
        savedPatient.setNom("Kouame");
        savedPatient.setPrenom("Jean");
        savedPatient.setDateNaissance(LocalDate.of(1990, 1, 1));
        savedPatient.setNumeroTelephone("0701020304");

        when(patientRepository.save(any(Patient.class))).thenReturn(savedPatient);

        PatientResponse response = patientService.create(sampleRequest);

        assertThat(response).isNotNull();
        assertThat(response.nom()).isEqualTo("Kouame");
        verify(patientRepository).save(any(Patient.class));
    }

    @Test
    void create_shouldThrowDuplicateException_whenSameNomAndTelephoneExists() {
        when(patientRepository.existsByNomAndNumeroTelephoneIgnoreCase("Kouame", "0701020304"))
                .thenReturn(true);

        assertThatThrownBy(() -> patientService.create(sampleRequest))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Un patient avec le même nom et le même numéro de téléphone existe déjà.");
    }

    @Test
    void update_shouldThrowDuplicateException_whenAnotherPatientHasSameNomAndTelephone() {
        Patient existingPatient = new Patient();
        existingPatient.setId(1L);
        existingPatient.setNom("Kouame");
        existingPatient.setNumeroTelephone("0700000000");

        when(patientRepository.findById(1L)).thenReturn(Optional.of(existingPatient));
        when(patientRepository.existsByNomAndNumeroTelephoneIgnoreCaseAndIdNot("Kouame", "0701020304", 1L))
                .thenReturn(true);

        assertThatThrownBy(() -> patientService.update(1L, sampleRequest))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Un patient avec le même nom et le même numéro de téléphone existe déjà.");
    }

    @Test
    void update_shouldSucceed_whenNoOtherPatientHasSameNomAndTelephone() {
        Patient existingPatient = new Patient();
        existingPatient.setId(1L);
        existingPatient.setNom("Kouame");
        existingPatient.setNumeroTelephone("0700000000");

        when(patientRepository.findById(1L)).thenReturn(Optional.of(existingPatient));
        when(patientRepository.existsByNomAndNumeroTelephoneIgnoreCaseAndIdNot("Kouame", "0701020304", 1L))
                .thenReturn(false);
        when(patientRepository.save(any(Patient.class))).thenReturn(existingPatient);

        PatientResponse response = patientService.update(1L, sampleRequest);

        assertThat(response).isNotNull();
        verify(patientRepository).save(any(Patient.class));
    }

    @Test
    void create_shouldSavePatientWithAssuranceAndGarant() {
        PatientRequest requestWithAssurance = new PatientRequest(
                "Kouame",
                "Jean",
                LocalDate.of(1990, 1, 1),
                "0701020304",
                "Cocody",
                "Ingénieur",
                "CARD-001",
                List.of(new PatientAssuranceRequest(10L, 20L, "MAT-999"))
        );

        when(patientRepository.existsByNomAndNumeroTelephoneIgnoreCase("Kouame", "0701020304"))
                .thenReturn(false);

        Assurance mockAssurance = new Assurance();
        mockAssurance.setId(10L);
        mockAssurance.setLibelle("MUGEF-CI");

        Garant mockGarant = new Garant();
        mockGarant.setId(20L);
        mockGarant.setLibelle("GARANT SANTE");

        when(assuranceRepository.findById(10L)).thenReturn(Optional.of(mockAssurance));
        when(garantRepository.findById(20L)).thenReturn(Optional.of(mockGarant));

        Patient savedPatient = new Patient();
        savedPatient.setId(1L);
        savedPatient.setNom("Kouame");
        savedPatient.setPrenom("Jean");

        when(patientRepository.save(any(Patient.class))).thenAnswer(invocation -> {
            Patient p = invocation.getArgument(0);
            p.setId(1L);
            return p;
        });

        PatientResponse response = patientService.create(requestWithAssurance);

        assertThat(response).isNotNull();
        assertThat(response.assurances()).hasSize(1);
        assertThat(response.assurances().get(0).libelle()).isEqualTo("MUGEF-CI");
        assertThat(response.assurances().get(0).garantId()).isEqualTo(20L);
        assertThat(response.assurances().get(0).garantLibelle()).isEqualTo("GARANT SANTE");
        assertThat(response.assurances().get(0).numeroMatricule()).isEqualTo("MAT-999");
    }
}
