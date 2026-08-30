# Luma Clinician Workspace

Interactive clinician-side demo for reviewing synthetic behavioral-health records, patient-reported routine data, risk signals, medication adherence, and personalized care tasks.

The interface currently uses synthetic demonstration data. Epic FHIR synchronization, clinical alerts, and transfers to the patient app are simulated and require production backend services, SMART on FHIR authorization, audit logging, and appropriate clinical validation before real-world use.

## Development

Requires Node.js 22.13 or newer and pnpm.

```bash
pnpm install
pnpm dev
```

Create a production build with:

```bash
pnpm build
```

Private hosted demo: <https://luma-clinician-workstation.noisy-fig-2085.chatgpt.site>
