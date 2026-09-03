package com.alphamedpro.backend.medecin;

import com.alphamedpro.backend.common.DuplicateResourceException;
import com.alphamedpro.backend.common.ResourceNotFoundException;
import com.alphamedpro.backend.medecin.dto.MedecinRequest;
import com.alphamedpro.backend.medecin.dto.MedecinResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MedecinServiceTest {

    @Mock
    private MedecinRepository medecinRepository;

    @InjectMocks
    private MedecinService medecinService;

    private MedecinRequest sampleRequest;

    @BeforeEach
    void setUp() {
        sampleRequest = new MedecinRequest(
                "KOUASSI",
                "Jean-Baptiste",
                "Dr.",
                "Médecine Générale",
                "INTERNE",
                "+225 07 00 00 00 00",
                "kouassi@alphamed.ci",
                null,
                "MED-001",
                "Bâtiment A, Bureau 101",
                true
        );
    }

    @Test
    void create_shouldSaveMedecin_whenNoDuplicateExists() {
        when(medecinRepository.existsByNomIgnoreCaseAndPrenomIgnoreCaseAndNumeroTelephone("KOUASSI", "Jean-Baptiste", "+225 07 00 00 00 00"))
                .thenReturn(false);

        Medecin savedMedecin = new Medecin();
        savedMedecin.setId(1L);
        savedMedecin.setNom("KOUASSI");
        savedMedecin.setPrenom("Jean-Baptiste");
        savedMedecin.setTitre("Dr.");
        savedMedecin.setSpecialite("Médecine Générale");
        savedMedecin.setTypeMedecin("INTERNE");
        savedMedecin.setNumeroTelephone("+225 07 00 00 00 00");

        when(medecinRepository.save(any(Medecin.class))).thenReturn(savedMedecin);

        MedecinResponse response = medecinService.create(sampleRequest);

        assertThat(response).isNotNull();
        assertThat(response.nom()).isEqualTo("KOUASSI");
        assertThat(response.prenom()).isEqualTo("Jean-Baptiste");
        assertThat(response.typeMedecin()).isEqualTo("INTERNE");
        assertThat(response.nomComplet()).contains("Dr. KOUASSI Jean-Baptiste");
        verify(medecinRepository).save(any(Medecin.class));
    }

    @Test
    void create_shouldThrowDuplicateException_whenSameMedecinExists() {
        when(medecinRepository.existsByNomIgnoreCaseAndPrenomIgnoreCaseAndNumeroTelephone("KOUASSI", "Jean-Baptiste", "+225 07 00 00 00 00"))
                .thenReturn(true);

        assertThatThrownBy(() -> medecinService.create(sampleRequest))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Un médecin avec le même nom, prénom et numéro de téléphone existe déjà.");
    }

    @Test
    void create_externalMedecin_shouldSaveCentreDeSante() {
        MedecinRequest externalReq = new MedecinRequest(
                "TOURE",
                "Aminata",
                "Dr.",
                "Pédiatrie",
                "EXTERNE",
                "+225 05 11 22 33 44",
                "toure@chu-treichville.ci",
                "CHU de Treichville",
                "MED-EXT-02",
                "Service Pédiatrie CHU",
                true
        );

        when(medecinRepository.existsByNomIgnoreCaseAndPrenomIgnoreCaseAndNumeroTelephone("TOURE", "Aminata", "+225 05 11 22 33 44"))
                .thenReturn(false);

        Medecin saved = new Medecin();
        saved.setId(2L);
        saved.setNom("TOURE");
        saved.setPrenom("Aminata");
        saved.setTitre("Dr.");
        saved.setSpecialite("Pédiatrie");
        saved.setTypeMedecin("EXTERNE");
        saved.setCentreDeSante("CHU de Treichville");
        saved.setNumeroTelephone("+225 05 11 22 33 44");

        when(medecinRepository.save(any(Medecin.class))).thenReturn(saved);

        MedecinResponse response = medecinService.create(externalReq);

        assertThat(response).isNotNull();
        assertThat(response.typeMedecin()).isEqualTo("EXTERNE");
        assertThat(response.centreDeSante()).isEqualTo("CHU de Treichville");
    }

    @Test
    void update_shouldSucceed() {
        Medecin existing = new Medecin();
        existing.setId(1L);
        existing.setNom("KOUASSI");
        existing.setPrenom("Jean-Baptiste");
        existing.setNumeroTelephone("+225 07 00 00 00 00");

        when(medecinRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(medecinRepository.existsByNomIgnoreCaseAndPrenomIgnoreCaseAndNumeroTelephoneAndIdNot("KOUASSI", "Jean-Baptiste", "+225 07 00 00 00 00", 1L))
                .thenReturn(false);
        when(medecinRepository.save(any(Medecin.class))).thenReturn(existing);

        MedecinResponse response = medecinService.update(1L, sampleRequest);

        assertThat(response).isNotNull();
        verify(medecinRepository).save(any(Medecin.class));
    }

    @Test
    void findById_shouldThrow_whenNotFound() {
        when(medecinRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> medecinService.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Médecin introuvable");
    }

    @Test
    void findAll_shouldReturnList() {
        Medecin m = new Medecin();
        m.setId(1L);
        m.setNom("KOUASSI");
        m.setPrenom("Jean");
        m.setTypeMedecin("INTERNE");
        m.setSpecialite("Généraliste");

        when(medecinRepository.findAll()).thenReturn(List.of(m));

        List<MedecinResponse> list = medecinService.findAll(null, null);

        assertThat(list).hasSize(1);
        assertThat(list.get(0).nom()).isEqualTo("KOUASSI");
    }
}
