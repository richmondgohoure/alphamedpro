package com.alphamedpro.backend.dossierpatient;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DossierPatientInitializer implements ApplicationRunner {

    private final DossierPatientService dossierPatientService;

    @Override
    public void run(ApplicationArguments args) {
        try {
            int count = dossierPatientService.associateDossiersForExistingPatients();
            if (count > 0) {
                log.info("DossierPatientInitializer: {} patient(s) existant(s) initialisé(s) avec leur dossier patient (DP-0000001+).", count);
            } else {
                log.info("DossierPatientInitializer: Tous les patients existants possèdent déjà un dossier patient.");
            }
        } catch (Exception e) {
            log.error("Erreur lors de l'initialisation des dossiers patients existants : {}", e.getMessage(), e);
        }
    }
}
