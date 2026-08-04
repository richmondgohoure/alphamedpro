package com.alphamedpro.backend.acte;

import com.alphamedpro.backend.acte.dto.ActTypeRequest;
import com.alphamedpro.backend.acte.dto.ActTypeResponse;
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
@RequestMapping("/api/act-types")
@RequiredArgsConstructor
public class ActTypeController {

    private final ActTypeService actTypeService;

    @GetMapping
    public List<ActTypeResponse> findAll() {
        return actTypeService.findAll();
    }

    @GetMapping("/{id}")
    public ActTypeResponse findById(@PathVariable Long id) {
        return actTypeService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ActTypeResponse create(@Valid @RequestBody ActTypeRequest request) {
        return actTypeService.create(request);
    }

    @PutMapping("/{id}")
    public ActTypeResponse update(@PathVariable Long id, @Valid @RequestBody ActTypeRequest request) {
        return actTypeService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        actTypeService.delete(id);
    }
}
