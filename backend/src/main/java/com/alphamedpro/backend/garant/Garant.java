package com.alphamedpro.backend.garant;

import com.alphamedpro.backend.assurance.Assurance;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "garants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Garant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String libelle;

    private String numeroTelephone;

    private String email;

    @ManyToMany(mappedBy = "garants")
    private Set<Assurance> assurances = new HashSet<>();
}
