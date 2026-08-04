package com.alphamedpro.backend.priseencharge;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PriseEnChargeRepository extends JpaRepository<PriseEnCharge, Long> {

    List<PriseEnCharge> findByPatientIdOrderByDateDemandeDesc(Long patientId);
}
