package com.alphamedpro.backend.medecin;

import com.alphamedpro.backend.medecin.dto.MedecinRequest;
import com.alphamedpro.backend.medecin.dto.MedecinResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/medecins")
@RequiredArgsConstructor
public class MedecinController {

    private final MedecinService medecinService;

    @GetMapping
    public List<MedecinResponse> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String typeMedecin
    ) {
        return medecinService.findAll(search, typeMedecin);
    }

    @GetMapping("/{id}")
    public MedecinResponse findById(@PathVariable Long id) {
        return medecinService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MedecinResponse create(@Valid @RequestBody MedecinRequest request) {
        return medecinService.create(request);
    }

    @PutMapping("/{id}")
    public MedecinResponse update(@PathVariable Long id, @Valid @RequestBody MedecinRequest request) {
        return medecinService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        medecinService.delete(id);
    }
}
