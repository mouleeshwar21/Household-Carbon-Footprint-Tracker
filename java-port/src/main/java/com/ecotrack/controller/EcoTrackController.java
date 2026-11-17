package com.ecotrack.controller;

import com.ecotrack.model.CarbonModels.*;
import com.ecotrack.service.CarbonCalculationService;
import com.ecotrack.service.MapsGroundingService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Controller
public class EcoTrackController {

    private final CarbonCalculationService calcService;
    private final MapsGroundingService mapsService;

    private final Map<String, CarbonAudit> auditStore = new ConcurrentHashMap<>();
    private HouseholdProfile profile;
    private String activeMonth = "2026-11";

    public EcoTrackController(CarbonCalculationService calcService, MapsGroundingService mapsService) {
        this.calcService = calcService;
        this.mapsService = mapsService;
        this.profile = new HouseholdProfile(
                "demo_household",
                "Verdant Canopy Residence",
                3,
                RegionId.IN,
                CurrencyCode.INR,
                UnitSystem.METRIC,
                "botanical-sage",
                35.0,
                500.0
        );
        for (CarbonAudit a : calcService.buildSeedAudits("demo_household", RegionId.IN)) {
            auditStore.put(a.id(), a);
        }
    }

    private List<CarbonAudit> sortedAudits() {
        return auditStore.values().stream()
                .sorted(Comparator.comparing(CarbonAudit::month))
                .toList();
    }

    private CarbonAudit getActiveAudit() {
        return auditStore.values().stream()
                .filter(a -> a.month().equals(activeMonth))
                .findFirst()
                .orElseGet(() -> sortedAudits().get(sortedAudits().size() - 1));
    }

    private void populateShellModel(Model model, String pageTitle, String activeRoute) {
        List<CarbonAudit> audits = sortedAudits();
        CarbonAudit active = getActiveAudit();
        AuditComputationResult breakdown = calcService.compute(
                active.inputs(),
                profile.regionId(),
                profile.members(),
                profile.solarOffsetPct(),
                profile.unitSystem()
        );
        model.addAttribute("pageTitle", pageTitle);
        model.addAttribute("activeRoute", activeRoute);
        model.addAttribute("profile", profile);
        model.addAttribute("audits", audits);
        model.addAttribute("activeAudit", active);
        model.addAttribute("breakdown", breakdown);
        model.addAttribute("themes", ThemeId.values());
        model.addAttribute("regions", RegionId.values());
        model.addAttribute("currencies", CurrencyCode.values());
        model.addAttribute("quickWins", calcService.getQuickWinsCatalog());
    }

    @GetMapping("/")
    public String root() {
        return "redirect:/login";
    }

    @GetMapping({"/login", "/register"})
    public String login(Model model) {
        populateShellModel(model, "Sign In — EcoTrack V22", "/login");
        return "login";
    }

    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        populateShellModel(model, "Dashboard — EcoTrack V22", "/dashboard");
        return "dashboard";
    }

    @GetMapping("/calculator")
    public String calculator(Model model) {
        populateShellModel(model, "Calculator — EcoTrack V22", "/calculator");
        return "calculator";
    }

    @GetMapping("/recommendations")
    public String recommendations(Model model) {
        populateShellModel(model, "Quick Wins — EcoTrack V22", "/recommendations");
        return "recommendations";
    }

    @GetMapping("/history")
    public String history(Model model) {
        populateShellModel(model, "History — EcoTrack V22", "/history");
        return "history";
    }

    @GetMapping("/compare")
    public String compare(Model model) {
        populateShellModel(model, "Compare — EcoTrack V22", "/compare");
        return "compare";
    }

    @GetMapping("/reports")
    public String reports(Model model) {
        populateShellModel(model, "Reports — EcoTrack V22", "/reports");
        return "reports";
    }

    @GetMapping("/about")
    public String about(Model model) {
        populateShellModel(model, "Methodology — EcoTrack V22", "/about");
        return "about";
    }

    @GetMapping("/account")
    public String account(Model model) {
        populateShellModel(model, "Account & Profile — EcoTrack V22", "/account");
        return "account";
    }

    @PostMapping("/api/theme")
    @ResponseBody
    public HouseholdProfile updateTheme(@RequestParam String theme) {
        profile = new HouseholdProfile(
                profile.uid(), profile.householdName(), profile.members(),
                profile.regionId(), profile.currency(), profile.unitSystem(),
                theme, profile.solarOffsetPct(), profile.monthlyTargetKg()
        );
        return profile;
    }

    @PostMapping("/api/active-month")
    @ResponseBody
    public Map<String, String> setActiveMonthApi(@RequestParam String month) {
        this.activeMonth = month;
        return Map.of("activeMonth", month);
    }

    @PostMapping("/api/audits")
    @ResponseBody
    public CarbonAudit saveAudit(@RequestBody CarbonAudit incoming) {
        AuditComputationResult res = calcService.compute(
                incoming.inputs(),
                incoming.regionId(),
                incoming.members(),
                incoming.solarOffsetPct(),
                profile.unitSystem()
        );
        String id = (incoming.id() == null || incoming.id().isBlank())
                ? "audit_" + incoming.month().replace("-", "_")
                : incoming.id();
        CarbonAudit saved = new CarbonAudit(
                id,
                profile.uid(),
                incoming.month(),
                incoming.label(),
                incoming.regionId(),
                incoming.members(),
                incoming.solarOffsetPct(),
                incoming.inputs(),
                res.totalKgCo2e(),
                incoming.notes()
        );
        auditStore.put(id, saved);
        this.activeMonth = saved.month();
        return saved;
    }

    @DeleteMapping("/api/audits/{id}")
    @ResponseBody
    public Map<String, Object> deleteAudit(@PathVariable String id) {
        CarbonAudit removed = auditStore.remove(id);
        return Map.of("deleted", removed != null, "id", id);
    }

    @PostMapping("/api/local-eco-hubs")
    @ResponseBody
    public Map<String, Object> localEcoHubs(@RequestBody Map<String, Object> body) {
        String category = Objects.toString(body.get("category"), "ev_charging");
        String locationQuery = body.get("locationQuery") != null ? body.get("locationQuery").toString() : null;
        Double lat = body.get("lat") instanceof Number n ? n.doubleValue() : null;
        Double lng = body.get("lng") instanceof Number n ? n.doubleValue() : null;
        return mapsService.findLocalEcoHubs(category, locationQuery, lat, lng);
    }

    @GetMapping("/api/export.csv")
    public ResponseEntity<String> exportCsv() {
        StringBuilder sb = new StringBuilder("Month,Label,Region,Members,SolarPct,TotalKgCO2e\n");
        for (CarbonAudit a : sortedAudits()) {
            sb.append(a.month()).append(",")
              .append("\"").append(a.label().replace("\"", "\"\"")).append("\",")
              .append(a.regionId().name()).append(",")
              .append(a.members()).append(",")
              .append(a.solarOffsetPct()).append(",")
              .append(a.totalKgCo2e()).append("\n");
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=ecotrack-v22-audits.csv")
                .contentType(MediaType.TEXT_PLAIN)
                .body(sb.toString());
    }
}
