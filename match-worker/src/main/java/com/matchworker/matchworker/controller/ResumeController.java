package com.matchworker.matchworker.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.matchworker.matchworker.service.ResumeProcessor;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Map;

@RestController
@RequestMapping("/process")
public class ResumeController {

    @Autowired
    private ResumeProcessor processor;

    @Autowired
    private ObjectMapper objectMapper;

    @PostMapping
    public String process(@RequestBody Map<String, Object> data) {
        try {
            String json = objectMapper.writeValueAsString(data);
            processor.processMatch(json);
            return "Processing started";
        } catch (Exception e) {
            e.printStackTrace();
            return "Error";
        }
    }
}