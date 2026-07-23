package com.alphamedpro.backend.assurance;

import com.alphamedpro.backend.assurance.dto.AssuranceRequest;
import com.alphamedpro.backend.assurance.dto.AssuranceResponse;
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
@RequestMapping("/api/assurances")
@RequiredArgsConstructor
public class AssuranceController {

    private final AssuranceService assuranceService;

    @GetMapping
    public List<AssuranceResponse> findAll() {
        return assuranceService.findAll();
    }

    @GetMapping("/{id}")
    public AssuranceResponse findById(@PathVariable Long id) {
        return assuranceService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AssuranceResponse create(@Valid @RequestBody AssuranceRequest request) {
        return assuranceService.create(request);
    }

    @PutMapping("/{id}")
    public AssuranceResponse update(@PathVariable Long id, @Valid @RequestBody AssuranceRequest request) {
        return assuranceService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        assuranceService.delete(id);
    }
}
