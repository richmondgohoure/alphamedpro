package com.alphamedpro.backend.garant;

import com.alphamedpro.backend.garant.dto.GarantRequest;
import com.alphamedpro.backend.garant.dto.GarantResponse;
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
@RequestMapping("/api/garants")
@RequiredArgsConstructor
public class GarantController {

    private final GarantService garantService;

    @GetMapping
    public List<GarantResponse> findAll() {
        return garantService.findAll();
    }

    @GetMapping("/{id}")
    public GarantResponse findById(@PathVariable Long id) {
        return garantService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GarantResponse create(@Valid @RequestBody GarantRequest request) {
        return garantService.create(request);
    }

    @PutMapping("/{id}")
    public GarantResponse update(@PathVariable Long id, @Valid @RequestBody GarantRequest request) {
        return garantService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        garantService.delete(id);
    }
}
