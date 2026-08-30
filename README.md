# Nest C Patient App

Interactive patient-facing mobile prototype for a healthcare hackathon.

## Run locally

```bash
npm install
npm run dev
```

## What is implemented

- Four-tab mobile navigation: Home, My Care, History, Profile
- Positive progress carousel and supportive demo chat
- Medical record upload demonstration, medication checkoff, sleep/movement/note rows
- Personalized recipe card, daily reflections, profile and safety areas
- Responsive mobile-first layout

## Production requirements

The chat is intentionally a local scripted demo. A production OpenAI integration needs a server endpoint, authentication, encrypted health data storage, moderation and crisis escalation, consent, audit logs, and clinician-confirmed medication and dietary workflows. Never place an OpenAI API key in this frontend.
