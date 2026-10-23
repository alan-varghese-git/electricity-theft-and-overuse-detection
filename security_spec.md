# Security Specification: VoltWatch Multi-Source Theft & Overuse Detection

## 1. Data Invariants
- **Meters (/meters/{meterId})**:
  - `id` must match `{meterId}` and comply with safe alphanumeric identifiers (`^[a-zA-Z0-9_\-]+$`).
  - `consumerName` must be a valid string <= 100 characters.
  - `sanctionedLoadKw`, `currentPowerKw`, and `currentWaterLph` must be numeric and non-negative.
  - `classification` must be strictly one of `["normal", "theft", "overuse"]`.
  - `tamperState` must be one of `["none", "meter_bypass", "line_tap", "vacation", "crypto_mining"]`.

- **Incidents (/incidents/{incidentId})**:
  - `id` must match `{incidentId}`.
  - `type` must be strictly `theft`, `overuse`, or `tamper_flag`.
  - `status` transitions must follow valid operational workflow (`investigating` -> `confirmed`/`dismissed`/`resolved`).
  - Terminal status records cannot have arbitrary fields injected.

- **Transformers (/transformers/{transformerId})**:
  - `id` must match `{transformerId}`.
  - `capacityKva` and `currentLoadKw` must be non-negative numbers.
  - Status must be `normal`, `warning`, or `overloaded`.

## 2. The "Dirty Dozen" Threat Payloads
1. **Payload 1 (ID Mismatch / Poisoning)**: Write to `/meters/MTR-101` with `id: "MTR-999"`.
2. **Payload 2 (Extreme String Injection)**: Attempt to inject a 50KB string into `consumerName`.
3. **Payload 3 (Negative Power Values)**: Attempt to inject `currentPowerKw: -150.0`.
4. **Payload 4 (Invalid Classification Enum)**: Attempt to set `classification: "superuser_bypass"`.
5. **Payload 5 (Ghost Field Attack)**: Inject `{ isVerifiedAdmin: true, bypassThreshold: 9999 }` into a Meter.
6. **Payload 6 (Incident Status Spoofing)**: Inject fake status `status: "system_admin_override"`.
7. **Payload 7 (Unsanctioned Load Override)**: Inject non-numeric NaN/string into `sanctionedLoadKw`.
8. **Payload 8 (Transformer Overload Tamper)**: Inject negative `capacityKva: -500`.
9. **Payload 9 (Cross-Path Injection)**: Document ID containing illegal URI/path characters `/meters/../../etc/passwd`.
10. **Payload 10 (Null Meter Reference in Incident)**: Attempt to file incident with missing required `meterId`.
11. **Payload 11 (Invalid Severity Injection)**: Incident with `severity: "apocalyptic"`.
12. **Payload 12 (Direct DB Drop / Unauthenticated Wipe)**: Deletion of root collections without administrative token.
