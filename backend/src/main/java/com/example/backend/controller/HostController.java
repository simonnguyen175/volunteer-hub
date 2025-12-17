package com.example.backend.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/host")
public class HostController {

    @GetMapping("/dashboard")
    public String hostDashboard() {
        return "Welcome HOST 👋";
    }
}
