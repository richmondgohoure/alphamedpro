package com.alphamedpro.backend.acte;

import com.alphamedpro.backend.acte.dto.ActeRequest;
import com.alphamedpro.backend.acte.dto.ActeResponse;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/actes")
@RequiredArgsConstructor
public class ActeController {

    private final ActeService acteService;

    @GetMapping
    public List<ActeResponse> findAll() {
        return acteService.findAll();
    }

    @GetMapping("/{id}")
    public ActeResponse findById(@PathVariable Long id) {
        return acteService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ActeResponse create(@Valid @RequestBody ActeRequest request) {
        return acteService.create(request);
    }

    @PutMapping("/{id}")
    public ActeResponse update(@PathVariable Long id, @Valid @RequestBody ActeRequest request) {
        return acteService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        acteService.delete(id);
    }
}
