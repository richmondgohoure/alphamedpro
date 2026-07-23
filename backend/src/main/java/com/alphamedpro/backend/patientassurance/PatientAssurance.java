package com.alphamedpro.backend.patientassurance;

import com.alphamedpro.backend.assurance.Assurance;
import com.alphamedpro.backend.patient.Patient;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "patient_assurance")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PatientAssurance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "assurance_id")
    private Assurance assurance;

    private String numeroMatricule;
}
