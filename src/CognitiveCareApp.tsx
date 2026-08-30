import { useEffect, useMemo, useRef, useState } from "react";

type Tab = "today" | "changes" | "professional" | "community" | "profile";
type MedicationStatus = "pending" | "taken" | "missed";
type TimelineKind = "observation" | "check-in" | "medication" | "change";
type StructuredObservation = {
  category: string;
  domain: string;
  event: string;
  date: string;
  original: string;
};
type Severity = "red" | "orange" | "green";
type TimelineEvent = {
  id: number;
  kind: TimelineKind;
  day: number;
  clock: string;
  title: string;
  detail: string;
  severity: Severity;
};
const severityLabel: Record<Severity, string> = {
  red: "Needs review",
  orange: "Worsening",
  green: "Stable",
};
type CommunityReply = {
  id: number;
  name: string;
  role: string;
  verified?: boolean;
  text: string;
  time: string;
};
type CommunityPost = {
  id: number;
  author: string;
  role: string;
  time: string;
  question: string;
  topic: string;
  likes: number;
  replies: CommunityReply[];
};
type IconName =
  | "home"
  | "chart"
  | "timeline"
  | "community"
  | "profile"
  | "care"
  | "bell"
  | "pill"
  | "check"
  | "close"
  | "brain"
  | "note"
  | "file"
  | "sparkle"
  | "send"
  | "share"
  | "doctor"
  | "shield"
  | "mic"
  | "clock"
  | "chevron"
  | "heart"
  | "reply"
  | "search";
const paths: Record<IconName, React.ReactNode> = {
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v11h14V10M9 21v-7h6v7" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  timeline: (
    <>
      <path d="M5 3v18M5 7h12M5 13h9M5 19h12" />
      <circle cx="5" cy="7" r="2" />
      <circle cx="5" cy="13" r="2" />
      <circle cx="5" cy="19" r="2" />
    </>
  ),
  community: (
    <>
      <circle cx="8" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M2 20a6 6 0 0 1 12 0M14 15a5 5 0 0 1 8 4" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  care: (
    <>
      <path d="M12 21s-7-4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 6-7 10-7 10Z" />
      <path d="M8 13h2l1-3 2 6 1-3h2" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
  pill: (
    <>
      <path d="m10 21 11-11a4 4 0 0 0-6-6L4 15a4 4 0 0 0 6 6Z" />
      <path d="m9 10 5 5" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  brain: (
    <>
      <path d="M9 4a3 3 0 0 0-5 2.2A3.5 3.5 0 0 0 4 13a3 3 0 0 0 5 3v4M15 4a3 3 0 0 1 5 2.2A3.5 3.5 0 0 1 20 13a3 3 0 0 1-5 3v4M9 8h2M13 12h2M9 16h2M15 7v13" />
    </>
  ),
  note: (
    <>
      <path d="M5 3h14v18H5z" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
  file: (
    <>
      <path d="M6 2h8l4 4v16H6Z" />
      <path d="M14 2v5h5M9 13h6M9 17h6" />
    </>
  ),
  sparkle: (
    <>
      <path d="m12 3 1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4Z" />
      <path d="m19 16 .6 1.9 1.9.6-1.9.6L19 21l-.6-1.9-1.9-.6 1.9-.6Z" />
    </>
  ),
  send: (
    <>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="m22 2-11 11" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m9 11 6-4M9 13l6 4" />
    </>
  ),
  doctor: (
    <>
      <circle cx="12" cy="7" r="4" />
      <path d="M5 21a7 7 0 0 1 14 0M18 3v4M16 5h4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
  heart: <path d="M21 8c0 6-9 13-9 13S3 14 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3Z" />,
  reply: <path d="M9 17 4 12l5-5M5 12h9a6 6 0 0 1 6 6v1" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 5 5" />
    </>
  ),
};
function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
const alzheimersDomains = [
  {
    name: "Comfort and response",
    items: [
      "Responded less than usual to voice or touch",
      "Grimaced, moaned, became stiff, or pushed care away",
      "Could not settle down",
      "Looked newly afraid or upset",
    ],
  },
  {
    name: "Breathing and illness",
    items: [
      "New cough, wet voice, or more mucus",
      "Breathing was faster, harder, or noisy",
      "Fever, chills, or very hot or cold skin",
      "Much sleepier or less alert than usual",
    ],
  },
  {
    name: "Food and drinks",
    items: [
      "Ate or drank less than usual",
      "Held food in the mouth",
      "Coughed or choked while eating or drinking",
      "Was not awake or upright enough to eat safely",
      "Dry mouth or much less urine",
    ],
  },
  {
    name: "Skin and turning",
    items: [
      "New dark redness, blister, or open skin",
      "Pain or upset during turning",
      "Concern on heel, tailbone, hip, elbow, or ear",
      "Could not finish the turning plan",
    ],
  },
  {
    name: "Toilet and cleaning",
    items: [
      "Less urine, dark urine, bad smell, or pain",
      "No bowel movement for longer than usual",
      "Diarrhea, vomiting, or wet-skin damage",
      "Mouth sore, bleeding gums, or food left in mouth",
    ],
  },
  {
    name: "Movement and nerves",
    items: [
      "New stiffness, swelling, or one-sided change",
      "Fall, near fall, or unsafe move",
      "New shaking, seizure-like event, or face droop",
    ],
  },
  {
    name: "Medicine and caregiver",
    items: [
      "Missed medicine or could not swallow it",
      "Possible side effect or too sleepy after medicine",
      "Caregiver could not safely turn, move, or feed",
      "Care felt unsafe or too hard today",
    ],
  },
];
const autismDomains = [
  {
    name: "Talking and connecting",
    items: [
      "Used the talk tablet, signs, or words less than usual",
      "Had trouble with a familiar one-step task",
      "Responded less than usual",
      "Could not ask for pain help, stop, break, or toilet",
    ],
  },
  {
    name: "Calm and behavior",
    items: [
      "Stayed upset longer than usual",
      "Bit hand, hit head, or hurt self",
      "Hit, broke things, or acted unsafely",
      "New freezing, slowing, or not starting tasks",
    ],
  },
  {
    name: "Changes and senses",
    items: [
      "Had more trouble changing activities",
      "Strong upset from noise, light, touch, taste, or crowds",
      "Needed more help with clothes, teeth, or washing",
      "Repeated movements changed a lot",
    ],
  },
  {
    name: "Daily skills",
    items: [
      "Eating or drinking changed",
      "Toilet use changed",
      "Needed more help with washing or clothes",
      "Lost a skill used before",
    ],
  },
  {
    name: "Body and sleep",
    items: [
      "May be in pain",
      "Bowel movement or stomach concern",
      "Fever, vomiting, less drinking or urine, tooth or skin concern",
      "Much worse sleep or very sleepy in daytime",
      "Possible seizure, staring, weakness, or walking change",
    ],
  },
  {
    name: "Movement, medicine, and safety",
    items: [
      "Walked or moved differently",
      "New stiffness, shaking, restlessness, slowing, or face movement",
      "Medicine was missed or may have caused a side effect",
      "Caregiver could not finish care safely",
      "Ran away or had a traffic, water, or other safety risk",
    ],
  },
];
export type PatientId = "margaret" | "noah";
export type Patient = {
  id: PatientId;
  name: string;
  initial: string;
  bannerCondition: string;
  caregiverLine: string;
  ageLine: string;
  primaryCaregiver: string;
  primaryPhysician: string;
  pharmacy: string;
  allergies: string;
  mobility: string;
  communication: string;
  feeding: string;
  sleep: string;
  behavior: string;
  safety: string;
  emergencyContact: string;
  goalsOfCare: string;
  recordDescription: string;
  personalDetails?: { label: string; value: string }[];
  physicalPlan: { title: string; detail: string }[];
  nutritionPlan: { title: string; detail: string }[];
  careRestrictions: string[];
};
export const patients: Record<PatientId, Patient> = {
  margaret: {
    id: "margaret",
    name: "Margaret Lewis",
    initial: "M",
    bannerCondition: "Severe Alzheimer’s • Needs full-time care",
    caregiverLine: "Caregiver: Maya (Daughter)",
    ageLine: "Age 84 • Severe Alzheimer’s",
    primaryCaregiver: "Maya (Daughter and health decision-maker)",
    primaryPhysician: "Not listed",
    pharmacy: "Not listed",
    allergies: "Not confirmed",
    mobility: "Almost always in bed; needs two people or a lift to move",
    communication: "Rare words or sounds; may respond to a familiar voice",
    feeding: "Needs full help with eating; food and drink type must be confirmed",
    sleep: "Broken sleep; sometimes wakes at night",
    behavior: "May make a pain face, moan, become stiff, or push care away",
    safety: "Needs full-time watching and safe help with skin, moving, and eating",
    emergencyContact: "Not listed",
    goalsOfCare: "Keep her comfortable, at home, and near familiar people",
    recordDescription: "Alzheimer’s record, daily checklist, and home care guide",
    physicalPlan: [
      {
        title: "Turn and support her body",
        detail:
          "Use the pillows and supports in her care plan. Follow her turning and heel-support plan. Stop if she looks hurt or upset.",
      },
      {
        title: "Only do approved movements",
        detail:
          "Slow arm and leg movements may help stiffness. A physical or occupational therapist must say which movements to do and how often.",
      },
      {
        title: "Use two helpers or the lift",
        detail:
          "Use two trained people or the fitted lift to move her. Only sit her out of bed when she is safe and comfortable.",
      },
    ],
    nutritionPlan: [
      {
        title: "Help with every bite and sip",
        detail:
          "Feed only when she is awake enough. Sit her up as her care plan says. Give small amounts, go slowly, and wait for each swallow.",
      },
      {
        title: "Offer small foods she likes",
        detail:
          "Offer favorite foods, small meals, or approved drinks and supplements. Write down food, drinks, urine, and weight changes.",
      },
      {
        title: "Watch while she swallows",
        detail:
          "Stop and check the care plan if she coughs, sounds wet, swallows many times, holds food in her mouth, gets tired, or becomes sleepy.",
      },
    ],
    careRestrictions: [
      "Never move her alone when two helpers are needed. Use only approved lift equipment.",
      "Do not force her arms or legs. Do not start exercises until PT or OT approves them.",
      "Do not change food thickness, drink thickness, straws, head position, or feeding position on your own.",
      "Do not force food or drinks. Do not crush or mix medicine into food unless the pharmacist or doctor says it is safe.",
    ],
  },
  noah: {
    id: "noah",
    name: "Noah Bennett",
    initial: "N",
    bannerCondition: "Autism • Needs a lot of daily support",
    caregiverLine: "Guardian and support worker",
    ageLine: "Age 20 • Autism",
    primaryCaregiver: "Mother or legal guardian; name not listed",
    primaryPhysician: "Not listed",
    pharmacy: "Not listed",
    allergies: "Not confirmed",
    mobility: "Walks by himself; walks on toes and needs help planning movements",
    communication: "Uses a talk tablet and picture board; speaks a few words; give him extra time",
    feeding: "Eats a small range of foods; constipation may lower his appetite",
    sleep: "Usually sleeps 7–8 hours; now wakes 2–3 nights each week",
    behavior: "Usually calms within about 15 minutes with a quiet room, timer, and familiar helper",
    safety: "Needs close watching near roads and water; keep his talk tablet and ID with him",
    emergencyContact: "Not listed",
    goalsOfCare: "Help him communicate, follow clear routines, stay safe, and make choices",
    recordDescription: "Autism record, daily checklist, and home care guide",
    physicalPlan: [
      {
        title: "Use movement he knows and likes",
        detail:
          "After the care team approves it, use familiar walks or other favorite activities. Show each step, keep it short, and show when it will end.",
      },
      {
        title: "Ask PT or OT what he needs",
        detail:
          "PT or OT can check walking, toe-walking, balance, strength, pain, and movement skills. Use only the home plan they teach.",
      },
      {
        title: "Watch closely outside and near water",
        detail:
          "Stay with him near roads and water. Swimming and biking need one-to-one help and the right safety gear.",
      },
    ],
    nutritionPlan: [
      {
        title: "Keep a simple food and toilet log",
        detail:
          "Write down foods, drinks, bowel movements, vomiting, choking, weight changes, and behavior near meals.",
      },
      {
        title: "Keep safe foods he accepts",
        detail:
          "Do not take away foods he safely eats. A dietitian or feeding team can help add foods slowly.",
      },
      {
        title: "Check for body pain or illness",
        detail:
          "Constipation, heartburn, tooth pain, allergies, or swallowing trouble may change behavior. Tell the care team about these signs.",
      },
    ],
    careRestrictions: [
      "Do not force food, suddenly remove safe foods, or hide medicine in food without a care-team plan.",
      "Do not start a special gluten-free, dairy-free, keto, detox, or supplement diet unless a doctor or dietitian says it is needed.",
      "Do not force stretches or stop safe repeated movements just because they look different.",
      "Do not start exercises or use holds unless the care team approved the plan and trained the caregiver.",
    ],
  },
};
const patientExtraDetails: Record<PatientId, { label: string; value: string }[]> = {
  margaret: [
    { label: "Gender", value: "Woman" },
    { label: "Age", value: "84" },
    { label: "Home", value: "Gets care at home" },
    { label: "Main condition", value: "Severe Alzheimer’s disease" },
    { label: "Stage", value: "Late stage / FAST 7" },
    { label: "Daily help", value: "Needs full help with all daily care" },
    { label: "Toilet care", value: "Needs full help with urine, bowel, and cleaning care" },
    {
      label: "Pain",
      value: "Cannot clearly explain pain; watch her face, body, sounds, and breathing",
    },
    { label: "Other health problems", value: "Not listed" },
    {
      label: "Decision support",
      value: "Daughter is health-care proxy; legal papers must be checked",
    },
    {
      label: "Care team",
      value: "Doctor, pharmacy, hospice, and home-health contacts are not listed",
    },
  ],
  noah: [
    { label: "Gender", value: "Man" },
    { label: "Age", value: "20" },
    { label: "Home", value: "Home and community support" },
    { label: "Main condition", value: "Autism with very high support needs" },
    { label: "Speech", value: "Fewer than about 10 useful spoken words" },
    {
      label: "Daily help",
      value: "Needs help with washing, clothes, medicine, meals, money, travel, and appointments",
    },
    { label: "Learning needs", value: "Possible intellectual disability; not confirmed" },
    {
      label: "Toilet care",
      value: "Usual toilet needs not fully listed; constipation is a concern",
    },
    { label: "Walking", value: "Walks alone; toe-walking and movement planning concerns" },
    {
      label: "Decision support",
      value: "Guardian role and legal limits are not listed; ask Noah and use his talk tablet",
    },
    {
      label: "School and services",
      value: "Day program, work support, speech, OT, PT, and respite services are not listed",
    },
  ],
};
type SeriesMetric = { values: number[]; color: string; note: string };
type TrendRow = { title: string; metric: string; values: string; tone: string; label: string };
type PatientClinicalContent = {
  medications: {
    id: string;
    name: string;
    detail: string;
    time: string;
    status: MedicationStatus;
  }[];
  timeline: TimelineEvent[];
  series: Record<string, SeriesMetric>;
  defaultMetric: string;
  notableChanges: number;
  trendRows: TrendRow[];
  insight: string;
  summaryMajorTrends: string;
  summaryObservationsNote: string;
  summaryNotableChanges: string;
};
const patientClinicalContent: Record<PatientId, PatientClinicalContent> = {
  margaret: {
    medications: [],
    timeline: [
      {
        id: 101,
        kind: "observation",
        day: 29,
        clock: "7:10 PM",
        title: "Coughing noted during evening hand feeding",
        detail:
          "Two coughs with small sips; feeding was paused and Margaret settled with upright positioning. Synthetic caregiver entry.",
        severity: "red",
      },
      {
        id: 102,
        kind: "observation",
        day: 28,
        clock: "1:35 PM",
        title: "Lower midday intake",
        detail:
          "About half of the offered meal was taken; mouth care and slow hand feeding were completed. Synthetic caregiver entry.",
        severity: "orange",
      },
      {
        id: 103,
        kind: "observation",
        day: 27,
        clock: "8:20 PM",
        title: "Comfort improved after repositioning",
        detail:
          "Moaning during evening care eased after repositioning and familiar music. Synthetic caregiver entry.",
        severity: "green",
      },
      {
        id: 104,
        kind: "observation",
        day: 26,
        clock: "9:05 AM",
        title: "Sacral redness remained blanching",
        detail:
          "Skin remained intact during the daily check; ordered positioning routine was completed. Synthetic caregiver entry.",
        severity: "green",
      },
      {
        id: 105,
        kind: "observation",
        day: 25,
        clock: "12:50 PM",
        title: "Food pocketing required extra cues",
        detail:
          "Food was pocketed once at lunch and cleared using the established care routine. Synthetic caregiver entry.",
        severity: "orange",
      },
      {
        id: 106,
        kind: "observation",
        day: 24,
        clock: "7:40 PM",
        title: "More resistance during evening care",
        detail:
          "Brief stiffness and moaning occurred during continence care, then settled with a slower approach. Synthetic caregiver entry.",
        severity: "orange",
      },
      {
        id: 107,
        kind: "observation",
        day: 23,
        clock: "2:15 PM",
        title: "Usual response to familiar voice",
        detail:
          "Opened eyes and vocalized briefly when her daughter spoke; no new breathing concern observed. Synthetic caregiver entry.",
        severity: "green",
      },
      {
        id: 108,
        kind: "observation",
        day: 22,
        clock: "6:55 PM",
        title: "Reduced evening intake",
        detail:
          "About three quarters of the usual evening amount was accepted with prolonged hand feeding. Synthetic caregiver entry.",
        severity: "orange",
      },
      {
        id: 109,
        kind: "observation",
        day: 21,
        clock: "10:10 AM",
        title: "Skin and positioning check stable",
        detail:
          "Heels intact and sacral redness still blanching; support and repositioning plan completed. Synthetic caregiver entry.",
        severity: "green",
      },
      {
        id: 110,
        kind: "observation",
        day: 20,
        clock: "1:25 PM",
        title: "Single cough with lunch",
        detail:
          "One cough occurred with a sip; feeding was paused and resumed slowly after settling. Synthetic caregiver entry.",
        severity: "orange",
      },
      {
        id: 111,
        kind: "observation",
        day: 19,
        clock: "8:05 PM",
        title: "Fragmented sleep after evening care",
        detail:
          "Awake several times overnight but calm with voice and touch; no new distress behavior observed. Synthetic caregiver entry.",
        severity: "green",
      },
      {
        id: 112,
        kind: "observation",
        day: 18,
        clock: "9:30 AM",
        title: "Morning care near usual baseline",
        detail:
          "Usual limited response, quiet breathing, and full assistance with care. Synthetic caregiver entry.",
        severity: "green",
      },
      {
        id: 113,
        kind: "observation",
        day: 17,
        clock: "12:40 PM",
        title: "Occasional pocketing at lunch",
        detail:
          "One pocketing episode required an extra clearing cue; no choking event occurred. Synthetic caregiver entry.",
        severity: "orange",
      },
      {
        id: 114,
        kind: "observation",
        day: 16,
        clock: "7:15 PM",
        title: "Baseline comfort check completed",
        detail:
          "Relaxed at rest with brief stiffness during turning; skin remained intact. Synthetic caregiver entry.",
        severity: "green",
      },
    ],
    series: {
      Swallowing: {
        values: [1, 1, 2, 2, 3, 3, 4],
        color: "#9a625b",
        note: "Coughing or pocketing observations",
      },
      Intake: {
        values: [1, 1, 1, 2, 2, 3, 3],
        color: "#8b6b35",
        note: "Lower-than-usual intake observations",
      },
      Comfort: {
        values: [2, 1, 2, 2, 3, 2, 2],
        color: "#6c6981",
        note: "Moaning, stiffness, or resistance observations",
      },
      Skin: { values: [1, 1, 1, 1, 1, 1, 1], color: "#58776c", note: "Skin concerns recorded" },
    },
    defaultMetric: "Swallowing",
    notableChanges: 2,
    trendRows: [
      {
        title: "Eating & swallowing",
        metric: "Coughing or pocketing during intake",
        values: "1 → 2 → 4 observations",
        tone: "up",
        label: "Increasing",
      },
      {
        title: "Hydration & nutrition",
        metric: "Lower-than-usual intake",
        values: "1 → 2 → 3 observations",
        tone: "up",
        label: "Increasing",
      },
      {
        title: "Responsiveness & comfort",
        metric: "Moaning, stiffness, or care resistance",
        values: "2 → 3 → 2 observations",
        tone: "down",
        label: "Variable",
      },
      {
        title: "Skin & positioning",
        metric: "Blanching sacral redness; skin intact",
        values: "No new skin breakdown recorded",
        tone: "down",
        label: "Stable",
      },
    ],
    insight:
      "Swallowing-related observations and lower intake became more frequent during the second week. Skin remained intact, and comfort cues varied by day. Review the exact feeding observations with the care team.",
    summaryMajorTrends:
      "Swallowing-related observations increased from 1 to 4 across the two-week view, and lower-than-usual intake increased from 1 to 3. Comfort cues varied, while recorded skin status remained stable.",
    summaryObservationsNote:
      "The newest event involved two coughs during hand feeding; feeding was paused and upright positioning was used.",
    summaryNotableChanges:
      "The generalized demo record shows a gradual increase in coughing or pocketing with intake and more frequent lower-intake days. These synthetic patterns require replacement with actual observations.",
  },
  noah: {
    medications: [],
    timeline: [
      {
        id: 201,
        kind: "observation",
        day: 29,
        clock: "8:10 PM",
        title: "Longer distress episode after schedule change",
        detail:
          "Unexpected evening schedule change preceded 24 minutes of pacing and hand-biting. Quiet space, AAC, and a visual timer helped. Synthetic caregiver entry.",
        severity: "red",
      },
      {
        id: 202,
        kind: "observation",
        day: 28,
        clock: "7:25 AM",
        title: "AAC requesting below usual baseline",
        detail:
          "Used the tablet to request food and music but needed extra prompting for break and toilet. Synthetic caregiver entry.",
        severity: "orange",
      },
      {
        id: 203,
        kind: "observation",
        day: 27,
        clock: "9:15 PM",
        title: "Night waking recorded",
        detail:
          "Awake twice overnight and returned to bed with the familiar visual routine. Synthetic caregiver entry.",
        severity: "orange",
      },
      {
        id: 204,
        kind: "observation",
        day: 26,
        clock: "4:20 PM",
        title: "Planned transition completed with support",
        detail:
          "Used the first-then board and timer for a planned community transition without unsafe behavior. Synthetic caregiver entry.",
        severity: "green",
      },
      {
        id: 205,
        kind: "observation",
        day: 25,
        clock: "8:35 PM",
        title: "No bowel movement with mild distress",
        detail:
          "No bowel movement was recorded; food intake was lower and pacing increased before dinner. Synthetic caregiver entry.",
        severity: "orange",
      },
      {
        id: 206,
        kind: "observation",
        day: 24,
        clock: "7:50 AM",
        title: "Toothbrushing refusal increased",
        detail:
          "Pulled away and pressed his cheek during toothbrushing; care was paused and the guardian documented a possible dental concern. Synthetic caregiver entry.",
        severity: "red",
      },
      {
        id: 207,
        kind: "observation",
        day: 23,
        clock: "3:05 PM",
        title: "Usual walking and movement",
        detail:
          "Completed the familiar walking route with direct supervision; toe-walking remained at baseline. Synthetic caregiver entry.",
        severity: "green",
      },
      {
        id: 208,
        kind: "observation",
        day: 22,
        clock: "6:40 PM",
        title: "Reduced spontaneous AAC use",
        detail:
          "Made two spontaneous requests compared with the usual four to five; responded when choices were shown. Synthetic caregiver entry.",
        severity: "orange",
      },
      {
        id: 209,
        kind: "observation",
        day: 21,
        clock: "9:20 PM",
        title: "Sleep near baseline",
        detail:
          "Slept about seven and a half hours with one brief waking. Synthetic caregiver entry.",
        severity: "green",
      },
      {
        id: 210,
        kind: "observation",
        day: 20,
        clock: "5:15 PM",
        title: "Noise-related distress resolved with usual plan",
        detail:
          "Covered ears and paced during loud household noise; settled within 13 minutes in the quiet space. Synthetic caregiver entry.",
        severity: "green",
      },
      {
        id: 211,
        kind: "observation",
        day: 19,
        clock: "8:00 AM",
        title: "Morning communication at baseline",
        detail:
          "Used AAC for food, toilet, and music and followed familiar one-step directions with processing time. Synthetic caregiver entry.",
        severity: "green",
      },
      {
        id: 212,
        kind: "observation",
        day: 18,
        clock: "7:30 PM",
        title: "Brief hand-biting during waiting",
        detail:
          "One brief hand-biting episode occurred while waiting; a timer and break request helped within 12 minutes. Synthetic caregiver entry.",
        severity: "orange",
      },
      {
        id: 213,
        kind: "observation",
        day: 17,
        clock: "1:10 PM",
        title: "Eating and bowel routine stable",
        detail:
          "Accepted usual preferred foods after setup and a bowel movement was recorded without distress. Synthetic caregiver entry.",
        severity: "green",
      },
      {
        id: 214,
        kind: "observation",
        day: 16,
        clock: "4:45 PM",
        title: "Baseline community routine completed",
        detail:
          "Used picture schedule and direct supervision during the familiar route; no elopement or traffic event occurred. Synthetic caregiver entry.",
        severity: "green",
      },
    ],
    series: {
      Regulation: {
        values: [1, 2, 1, 2, 2, 3, 4],
        color: "#9a625b",
        note: "Longer or more intense distress observations",
      },
      Communication: {
        values: [1, 1, 2, 2, 2, 3, 3],
        color: "#6c6981",
        note: "Reduced AAC requesting observations",
      },
      Sleep: { values: [1, 1, 2, 1, 2, 2, 3], color: "#8b6b35", note: "Night-waking observations" },
      Adaptive: {
        values: [1, 1, 1, 2, 2, 2, 2],
        color: "#58776c",
        note: "Self-care, eating, or bowel-routine changes",
      },
    },
    defaultMetric: "Regulation",
    notableChanges: 3,
    trendRows: [
      {
        title: "Regulation & behavior",
        metric: "Distress longer or more intense than baseline",
        values: "1 → 2 → 4 observations",
        tone: "up",
        label: "Increasing",
      },
      {
        title: "Communication",
        metric: "Reduced spontaneous AAC requesting",
        values: "1 → 2 → 3 observations",
        tone: "up",
        label: "Increasing",
      },
      {
        title: "Physical health & sleep",
        metric: "Night waking",
        values: "1 → 2 → 3 observations",
        tone: "up",
        label: "Increasing",
      },
      {
        title: "Movement & safety",
        metric: "Walking and supervised community access",
        values: "No functional loss or elopement recorded",
        tone: "down",
        label: "Stable",
      },
    ],
    insight:
      "Longer distress episodes, reduced spontaneous AAC use, and night waking became more frequent in the second week. A toothbrushing refusal with cheek pressing and constipation-linked behavior are specific observations to review rather than attributing them to autism itself.",
    summaryMajorTrends:
      "Longer distress episodes increased from 1 to 4 observations, reduced AAC requesting increased from 1 to 3, and night waking increased from 1 to 3. Walking remained at baseline with no recorded elopement.",
    summaryObservationsNote:
      "The newest event followed an unexpected schedule change and settled with Noah’s established quiet-space, AAC, and visual-timer supports.",
    summaryNotableChanges:
      "The generalized demo record shows more frequent regulation, communication, and sleep changes. It also flags a possible dental-pain observation and bowel-pattern association for clinical review; it does not represent autism progression.",
  },
};
const CARE_HISTORY_MONTH = 7,
  CARE_HISTORY_YEAR = 2026,
  CARE_HISTORY_TODAY = 29;
const careHistoryDays: (number | null)[] = (() => {
  const firstWeekday = new Date(CARE_HISTORY_YEAR, CARE_HISTORY_MONTH, 1).getDay(),
    daysInMonth = new Date(CARE_HISTORY_YEAR, CARE_HISTORY_MONTH + 1, 0).getDate();
  return [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
})();
const deliverySlots = [
  "Aug 29 • 5:00–7:00 PM",
  "Aug 30 • 9:00–11:00 AM",
  "Aug 30 • 1:00–3:00 PM",
  "Sep 3 • 10:00 AM–12:00 PM",
];
type Clinician = { id: number; name: string; role: string; slots: string[] };
const clinicians: Clinician[] = [
  {
    id: 1,
    name: "Dr. Sarah Lin",
    role: "Primary physician",
    slots: ["Aug 29 • 2:30 PM", "Aug 29 • 4:15 PM", "Aug 30 • 9:00 AM"],
  },
  {
    id: 2,
    name: "Dr. Elena Morris",
    role: "Memory-care physician",
    slots: ["Aug 30 • 10:00 AM", "Aug 30 • 1:30 PM", "Sep 3 • 11:00 AM"],
  },
  {
    id: 3,
    name: "Dana Brooks, OTR/L",
    role: "Occupational therapist",
    slots: ["Aug 29 • 3:00 PM", "Sep 3 • 9:30 AM", "Sep 4 • 2:00 PM"],
  },
  {
    id: 4,
    name: "Priya Shah, PharmD",
    role: "Pharmacist",
    slots: ["Aug 29 • 1:00 PM", "Aug 30 • 4:00 PM", "Sep 4 • 10:30 AM"],
  },
];
const coreCommunityPosts: CommunityPost[] = [
  {
    id: 1,
    author: "Jordan R.",
    role: "Family caregiver",
    time: "18 min ago",
    topic: "Daily care",
    question:
      "My mom becomes anxious before her evening shower. What routines have helped make this feel safer?",
    likes: 14,
    replies: [
      {
        id: 11,
        name: "Avery L.",
        role: "Caregiver",
        time: "12 min ago",
        text: "We use the same warm towel, playlist, and two-step explanation each evening. The predictable order has helped us.",
      },
      {
        id: 12,
        name: "Dana Brooks, OTR/L",
        role: "Occupational therapist",
        verified: true,
        time: "7 min ago",
        text: "A consistent cue and fewer choices may reduce stress. Consider checking water temperature, lighting, and fall risks with her care team.",
      },
    ],
  },
  {
    id: 2,
    author: "Sam K.",
    role: "Family caregiver",
    time: "1 hr ago",
    topic: "Medication",
    question: "What should I do if a Donepezil dose is missed?",
    likes: 9,
    replies: [
      {
        id: 21,
        name: "Priya Shah, PharmD",
        role: "Pharmacist",
        verified: true,
        time: "42 min ago",
        text: "Do not double a dose unless the prescriber specifically directs it. Follow the prescription label and contact the patient’s pharmacist or prescriber for guidance.",
      },
    ],
  },
  {
    id: 3,
    author: "Lee W.",
    role: "Family caregiver",
    time: "3 hr ago",
    topic: "Symptoms",
    question:
      "Dad seemed much more confused right after waking today. When should a sudden change be treated as urgent?",
    likes: 18,
    replies: [
      {
        id: 31,
        name: "Dr. Elena Morris",
        role: "Memory-care physician",
        verified: true,
        time: "2 hr ago",
        text: "A sudden or marked change deserves prompt medical attention, especially with fever, weakness, speech changes, a fall, or altered alertness. Contact the care team; use emergency services for severe or stroke-like symptoms.",
      },
    ],
  },
];
const generatedNames = [
  "Alex P.",
  "Jamie T.",
  "Morgan S.",
  "Taylor B.",
  "Casey R.",
  "Riley N.",
  "Jordan K.",
  "Avery M.",
  "Drew H.",
  "Reese C.",
  "Quinn D.",
  "Skyler F.",
  "Rowan G.",
  "Emerson J.",
  "Peyton L.",
  "Finley W.",
  "Hayden V.",
  "Sage O.",
  "Blair Y.",
  "Kendall Z.",
];
const topicQuestionPool: Record<string, string[]> = {
  "Daily care": [
    "What helps ease morning confusion?",
    "How do you encourage safe bathing routines?",
    "Any tips for reducing wandering in the evening?",
    "What worked for reducing mealtime resistance?",
    "How do you handle repeated questions calmly?",
    "What visual cues help with getting dressed?",
    "How do you manage sundowning behavior?",
    "What helps with nighttime restlessness?",
    "Any tricks for encouraging hydration?",
    "How do you simplify daily routines?",
  ],
  Medication: [
    "What should I do about a missed dose?",
    "How do you manage medication refusal?",
    "Any tips for organizing multiple prescriptions?",
    "What are signs of a medication side effect?",
    "How do you talk to the pharmacist about interactions?",
    "What helps with swallowing pills safely?",
    "How often should a medication review happen?",
    "What should I track for the next doctor visit?",
    "How do you handle medication during travel?",
    "What helps with remembering evening doses?",
  ],
  Symptoms: [
    "When should a sudden change be treated as urgent?",
    "What counts as a notable behavior change?",
    "How do you document new symptoms clearly?",
    "What helps distinguish normal aging from a real concern?",
    "How do you track mood changes over time?",
    "What questions should I ask at the next appointment?",
    "How do you handle sudden agitation?",
    "What helps with sleep pattern changes?",
    "How do you note changes in appetite?",
    "What are signs I should call the care team?",
  ],
};
const helperReplyPool = [
  "This really helped us too.",
  "We found a similar approach worked well for our family.",
  "Following this thread — thank you for asking.",
  "Our care team suggested something very similar.",
];
const verifiedRepliers = [
  { name: "Dr. Elena Morris", role: "Memory-care physician" },
  { name: "Dana Brooks, OTR/L", role: "Occupational therapist" },
  { name: "Priya Shah, PharmD", role: "Pharmacist" },
];
const generatedTopics = ["Daily care", "Medication", "Symptoms"];
const generatedCommunityPosts: CommunityPost[] = Array.from({ length: 97 }, (_, index) => {
  const topic = generatedTopics[index % generatedTopics.length],
    pool = topicQuestionPool[topic],
    question = pool[index % pool.length],
    author = generatedNames[index % generatedNames.length],
    likes = (index * 7) % 23,
    hoursAgo = (index % 48) + 1;
  const replies: CommunityReply[] = [];
  if (index % 4 === 0)
    replies.push({
      id: 20000 + index,
      name: generatedNames[(index + 3) % generatedNames.length],
      role: "Family caregiver",
      time: `${Math.max(1, hoursAgo - 1)} hr ago`,
      text: helperReplyPool[index % helperReplyPool.length],
    });
  if (index % 8 === 0) {
    const pro = verifiedRepliers[(index / 8) % verifiedRepliers.length];
    replies.push({
      id: 30000 + index,
      name: pro.name,
      role: pro.role,
      verified: true,
      time: `${hoursAgo} hr ago`,
      text: "Consider discussing this pattern with the care team at the next visit.",
    });
  }
  return {
    id: 2000 + index,
    author,
    role: "Family caregiver",
    time: `${hoursAgo} hr ago`,
    topic,
    question,
    likes,
    replies,
  };
});
const seedCommunityPosts: CommunityPost[] = [...coreCommunityPosts, ...generatedCommunityPosts];
interface SpeechResult {
  0: { transcript: string };
  isFinal: boolean;
}
interface SpeechEvent {
  results: SpeechResult[];
  resultIndex: number;
}
interface Recognizer {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechEvent) => void) | null;
}
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognizer;
  webkitSpeechRecognition?: new () => Recognizer;
};

export default function CognitiveCareApp({ patientId }: { patientId: PatientId }) {
  const patient = patients[patientId],
    content = patientClinicalContent[patientId];
  const [tab, setTab] = useState<Tab>("today");
  const [medications, setMedications] = useState(content.medications);
  const [symptoms, setSymptoms] = useState<Record<string, boolean>>({}),
    [observation, setObservation] = useState(""),
    [structured, setStructured] = useState<StructuredObservation | null>(null),
    [checkInSaved, setCheckInSaved] = useState(false);
  const [timeline, setTimeline] = useState<TimelineEvent[]>(content.timeline),
    [summaryReady, setSummaryReady] = useState(false),
    [shared, setShared] = useState(false);
  useEffect(() => {
    const record = (event: Event) => {
      const detail = (
        event as CustomEvent<{ patientId: PatientId; title: string; status: "done" | "missed" }>
      ).detail;
      if (!detail || detail.patientId !== patient.id) return;
      setTimeline((items) => [
        {
          id: Date.now(),
          kind: "check-in",
          day: CARE_HISTORY_TODAY,
          clock: "Just now",
          title: `Movement task ${detail.status}`,
          detail: `${detail.title} was marked ${detail.status}.`,
          severity: detail.status === "missed" ? "orange" : "green",
        },
        ...items,
      ]);
    };
    window.addEventListener("luma-movement-reminder", record);
    return () => window.removeEventListener("luma-movement-reminder", record);
  }, [patient.id]);
  const observationCount = timeline.filter((item) => item.kind === "observation").length;
  const adherence = useMemo(() => {
    const recorded = medications.filter((item) => item.status !== "pending"),
      taken = medications.filter((item) => item.status === "taken").length;
    return recorded.length ? Math.round((taken / recorded.length) * 100) : null;
  }, [medications, patient.id]);
  function setMedication(id: string, status: MedicationStatus) {
    setMedications((items) => items.map((item) => (item.id === id ? { ...item, status } : item)));
    const med = medications.find((item) => item.id === id);
    setTimeline((items) => [
      {
        id: Date.now(),
        kind: "medication",
        day: CARE_HISTORY_TODAY,
        clock: "Just now",
        title: `${med?.name} marked ${status}`,
        detail: `Caregiver recorded this dose as ${status}.`,
        severity: status === "missed" ? "red" : "green",
      },
      ...items,
    ]);
  }
  function structureObservation() {
    if (!observation.trim()) return;
    const lower = observation.toLowerCase();
    if (patient.id === "margaret") {
      const swallowing = /cough|chok|swallow|pocket|food|drink|feed/.test(lower),
        skin = /skin|red|blister|wound|sacrum|heel/.test(lower),
        breathing = /breath|secretion|fever|gurg/.test(lower),
        comfort = /grimac|moan|pain|distress|resist/.test(lower);
      setStructured({
        category: swallowing
          ? "Eating, swallowing & hydration"
          : skin
            ? "Skin & positioning"
            : breathing
              ? "Breathing & infection signs"
              : comfort
                ? "Responsiveness & comfort"
                : "Caregiver observation",
        domain: swallowing
          ? "Swallowing safety"
          : skin
            ? "Skin integrity"
            : breathing
              ? "Respiratory observation"
              : comfort
                ? "Observed comfort"
                : "General care",
        event: swallowing
          ? "Feeding or swallowing change"
          : skin
            ? "Skin change"
            : breathing
              ? "Breathing or infection concern"
              : comfort
                ? "Comfort or responsiveness change"
                : "New caregiver-recorded event",
        date: "Today",
        original: observation.trim(),
      });
      return;
    }
    if (patient.id === "noah") {
      const communication = /aac|request|gesture|word|communicat/.test(lower),
        regulation = /distress|bite|hit|aggress|pace|shutdown/.test(lower),
        sleep = /sleep|wake|waking|tired|sedat/.test(lower),
        physical = /tooth|dental|pain|stool|constipat|fever|vomit/.test(lower),
        transition = /transition|schedule|noise|sensory|groom|brush/.test(lower);
      setStructured({
        category: communication
          ? "Communication & connection"
          : regulation
            ? "Regulation & behavior"
            : sleep || physical
              ? "Physical health & sleep"
              : transition
                ? "Flexibility & sensory"
                : "Caregiver observation",
        domain: communication
          ? "Functional communication"
          : regulation
            ? "Observed regulation"
            : sleep
              ? "Sleep"
              : physical
                ? "Possible physical trigger"
                : transition
                  ? "Routine and sensory support"
                  : "General support",
        event: communication
          ? "Change in AAC or functional communication"
          : regulation
            ? "Change in distress or unsafe behavior"
            : sleep
              ? "Sleep change"
              : physical
                ? "Possible pain or physical-health change"
                : transition
                  ? "Transition, sensory, or self-care change"
                  : "New caregiver-recorded event",
        date: "Today",
        original: observation.trim(),
      });
      return;
    }
    const daily = /microwave|cook|breakfast|dress|appliance|task/.test(lower),
      orientation = /lost|room|where|place/.test(lower),
      behavior = /agitat|angry|withdraw|quiet/.test(lower);
    setStructured({
      category: daily
        ? "Daily functioning"
        : orientation
          ? "Orientation"
          : behavior
            ? "Behavior & mood"
            : "Memory",
      domain: daily
        ? "Memory / executive function"
        : orientation
          ? "Spatial orientation"
          : behavior
            ? "Behavioral change"
            : "Memory",
      event:
        daily && /microwave/.test(lower)
          ? "Difficulty using a familiar appliance"
          : daily
            ? "Difficulty completing a familiar task"
            : orientation
              ? "Confusion in a familiar environment"
              : behavior
                ? "Change from usual behavior"
                : "Caregiver-reported cognitive change",
      date: "Today",
      original: observation.trim(),
    });
  }
  function confirmObservation() {
    if (!structured) return;
    setTimeline((items) => [
      {
        id: Date.now(),
        kind: "observation",
        day: CARE_HISTORY_TODAY,
        clock: "Just now",
        title: structured.event,
        detail: `${structured.category} • ${structured.original}`,
        severity: "red",
      },
      ...items,
    ]);
    setStructured(null);
    setObservation("");
  }
  function saveCheckIn() {
    const selected = Object.entries(symptoms)
      .filter(([, checked]) => checked === true)
      .map(([label]) => label);
    setTimeline((items) => [
      {
        id: Date.now(),
        kind: "check-in",
        day: CARE_HISTORY_TODAY,
        clock: "Just now",
        title: "Daily symptom check-in completed",
        detail: selected.length
          ? `${selected.length} changes recorded: ${selected.join(", ")}.`
          : "No changes from the usual baseline were selected.",
        severity: selected.length === 0 ? "green" : selected.length <= 2 ? "orange" : "red",
      },
      ...items,
    ]);
    setCheckInSaved(true);
  }
  return (
    <div className="mvp-stage">
      <main className="mvp-phone">
        <header className="mvp-header">
          <button className="mvp-brand">
            <i>
              <Icon name="care" size={18} />
            </i>
            Luma Care
          </button>
          <div className={`active-patient-chip ${patient.id}`}>
            <span>{patient.initial}</span>
            <div>
              <small>ACTIVE PATIENT</small>
              <b>{patient.name}</b>
            </div>
          </div>
        </header>
        <div className="mvp-page">
          {tab === "today" && (
            <Today
              patient={patient}
              medications={medications}
              setMedication={setMedication}
              symptoms={symptoms}
              setSymptoms={setSymptoms}
              observation={observation}
              setObservation={setObservation}
              structured={structured}
              structureObservation={structureObservation}
              confirmObservation={confirmObservation}
              cancelStructure={() => setStructured(null)}
              saveCheckIn={saveCheckIn}
              checkInSaved={checkInSaved}
              adherence={adherence}
            />
          )}{" "}
          {tab === "changes" && (
            <Changes
              patientName={patient.name}
              content={content}
              adherence={adherence}
              observationCount={observationCount}
              summaryReady={summaryReady}
              setSummaryReady={setSummaryReady}
              shared={shared}
              setShared={setShared}
              events={timeline}
            />
          )}{" "}
          {tab === "professional" && <Professional patient={patient} />}{" "}
          {tab === "community" && <Community />}{" "}
          {tab === "profile" && <Profile patient={patient} />}
        </div>
        <nav className="mvp-nav">
          {(
            [
              ["today", "home", "Today"],
              ["changes", "chart", "Changes"],
              ["professional", "doctor", "Professional"],
              ["community", "community", "Community"],
              ["profile", "profile", "Profile"],
            ] as [Tab, IconName, string][]
          ).map(([id, icon, label]) => (
            <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
              <i>
                <Icon name={icon} />
              </i>
              {label}
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
}
function Heading({ over, title, sub }: { over: string; title: string; sub: string }) {
  return (
    <section className="mvp-title">
      <small>{over}</small>
      <h1>{title}</h1>
      <p>{sub}</p>
    </section>
  );
}

type TodayProps = {
  patient: Patient;
  medications: {
    id: string;
    name: string;
    detail: string;
    time: string;
    status: MedicationStatus;
  }[];
  setMedication: (id: string, status: MedicationStatus) => void;
  symptoms: Record<string, boolean>;
  setSymptoms: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  observation: string;
  setObservation: (v: string) => void;
  structured: StructuredObservation | null;
  structureObservation: () => void;
  confirmObservation: () => void;
  cancelStructure: () => void;
  saveCheckIn: () => void;
  checkInSaved: boolean;
  adherence: number | null;
};

function Today(props: TodayProps) {
  const {
    patient,
    symptoms,
    setSymptoms,
    observation,
    setObservation,
    structured,
    structureObservation,
    confirmObservation,
    cancelStructure,
    saveCheckIn,
    checkInSaved,
  } = props;
  const [listening, setListening] = useState(false),
    [voiceError, setVoiceError] = useState("");
  const voiceRef = useRef<Recognizer | null>(null),
    textRef = useRef(observation);
  textRef.current = observation;
  function toggleVoice() {
    if (listening) {
      voiceRef.current?.stop();
      setListening(false);
      return;
    }
    const W = window as SpeechWindow,
      R = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!R) {
      setVoiceError("Voice typing is not available in this browser.");
      return;
    }
    const before = textRef.current,
      r = new R();
    let final = "";
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-US";
    r.onstart = () => {
      setListening(true);
      setVoiceError("");
    };
    r.onend = () => setListening(false);
    r.onerror = () => {
      setListening(false);
      setVoiceError("Check the microphone and try again.");
    };
    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const words = e.results[i]?.[0]?.transcript || "";
        if (e.results[i]?.isFinal) final += `${words} `;
        else interim += words;
      }
      setObservation(`${before}${before ? " " : ""}${final}${interim}`.trim());
    };
    voiceRef.current = r;
    r.start();
  }
  const careProfile = true,
    domains = patient.id === "noah" ? autismDomains : alzheimersDomains,
    prompt =
      patient.id === "margaret"
        ? "“Mom coughed twice while eating.”"
        : patient.id === "noah"
          ? "“Noah used his talk tablet less today.”"
          : "“Mom forgot how to use the microwave.”";
  return (
    <>
      <Heading
        over="TODAY"
        title="What needs care today?"
        sub={`Daily care for ${patient.name.split(" ")[0]}.`}
      />
      <article className="patient-banner">
        <div>{patient.initial}</div>
        <span>
          <b>{patient.name}</b>
          <small>{patient.bannerCondition}</small>
        </span>
        <em>{patient.caregiverLine}</em>
      </article>
      {careProfile && (
        <article className="source-status">
          <Icon name="check" size={16} />
          <span>
            <b>Records are ready</b>
            <small>These records belong only to {patient.name}.</small>
          </span>
        </article>
      )}
      <Reminders
        patient={patient}
        medications={props.medications}
        setMedication={props.setMedication}
        adherence={props.adherence}
      />
      <RecipeHelper patient={patient} />
      <section className="today-card">
        <div className="card-head">
          <span>
            <small>DAILY CHECK</small>
            <h2>What changed today?</h2>
          </span>
          <Icon name="note" />
        </div>
        {domains.map((domain) => (
          <div className="domain" key={domain.name}>
            <h3>{domain.name}</h3>
            {domain.items.map((item) => (
              <label key={item}>
                <input
                  type="checkbox"
                  checked={Boolean(symptoms[item])}
                  onChange={() => setSymptoms((values) => ({ ...values, [item]: !values[item] }))}
                />
                <i>{symptoms[item] && <Icon name="check" size={12} />}</i>
                <span>{item}</span>
              </label>
            ))}
          </div>
        ))}
        <button className="primary-action" onClick={saveCheckIn}>
          {checkInSaved ? (
            <>
              <Icon name="check" size={15} />
              Saved
            </>
          ) : (
            "Save today’s check"
          )}
        </button>
      </section>
      <section className="today-card observation-card">
        <div className="card-head">
          <span>
            <small>ADD A NOTE</small>
            <h2>What did you see?</h2>
          </span>
          <Icon name="note" />
        </div>
        <p className="prompt-example">Example: {prompt}</p>
        <button className={`voice-capture ${listening ? "listening" : ""}`} onClick={toggleVoice}>
          <Icon name="mic" size={16} />
          {listening ? "Stop voice typing" : "Use voice typing"}
        </button>
        {voiceError && <small className="form-error">{voiceError}</small>}
        <textarea
          value={observation}
          onChange={(e) => {
            setObservation(e.target.value);
            if (structured) cancelStructure();
          }}
          placeholder="Write what happened…"
        />
        <button
          className="structure-button"
          disabled={!observation.trim()}
          onClick={structureObservation}
        >
          <Icon name="sparkle" size={16} />
          Make this note clear
        </button>
        {structured && (
          <article className="structured-preview">
            <div>
              <Icon name="sparkle" size={18} />
              <span>
                <small>AI DRAFT</small>
                <h3>Check before saving</h3>
              </span>
            </div>
            <dl>
              <dt>Group</dt>
              <dd>{structured.category}</dd>
              <dt>Type</dt>
              <dd>{structured.domain}</dd>
              <dt>Change</dt>
              <dd>{structured.event}</dd>
              <dt>Date</dt>
              <dd>{structured.date}</dd>
            </dl>
            <p>Your words: “{structured.original}”</p>
            <div className="confirm-actions">
              <button onClick={cancelStructure}>Edit</button>
              <button onClick={confirmObservation}>
                <Icon name="check" size={14} />
                Save
              </button>
            </div>
            <small>
              <Icon name="shield" size={12} />
              AI only cleans up the note. It does not give a diagnosis.
            </small>
          </article>
        )}
      </section>
    </>
  );
}

function Reminders({
  patient,
  medications,
  setMedication,
  adherence,
}: {
  patient: Patient;
  medications: TodayProps["medications"];
  setMedication: TodayProps["setMedication"];
  adherence: number | null;
}) {
  const [status, setStatus] = useState<Record<string, "done" | "missed">>({});
  function mark(title: string, next: "done" | "missed") {
    setStatus((items) => ({ ...items, [title]: next }));
    window.dispatchEvent(
      new CustomEvent("luma-movement-reminder", {
        detail: { patientId: patient.id, title, status: next },
      }),
    );
  }
  return (
    <section className="today-card reminders-card">
      <div className="card-head">
        <span>
          <small>TODAY’S TASKS</small>
          <h2>Reminders</h2>
        </span>
        <em>{adherence === null ? "Daily list" : `${adherence}% medicine`}</em>
      </div>
      {medications.length === 0 ? (
        <div className="missing-data">
          <Icon name="pill" size={20} />
          <span>
            <b>No medicine list yet</b>
            <p>Add a confirmed medicine list before medicine reminders are shown.</p>
          </span>
        </div>
      ) : (
        medications.map((med) => (
          <article className={`med-dose ${med.status}`} key={med.id}>
            <i>
              <Icon name="pill" size={18} />
            </i>
            <span>
              <small>{med.time}</small>
              <b>{med.name}</b>
              <p>{med.detail}</p>
            </span>
            <div>
              <button
                className="taken"
                onClick={() => setMedication(med.id, med.status === "taken" ? "pending" : "taken")}
              >
                <Icon name="check" size={13} />
                {med.status === "taken" ? "Done" : "Check"}
              </button>
              <button className="missed" onClick={() => setMedication(med.id, "missed")}>
                <Icon name="close" size={13} />
                Missed
              </button>
            </div>
          </article>
        ))
      )}
      {patient.physicalPlan.map((item) => (
        <article className={`movement-reminder ${status[item.title] || ""}`} key={item.title}>
          <i>
            <Icon name="care" size={18} />
          </i>
          <span>
            <b>{item.title}</b>
            <small>{item.detail}</small>
          </span>
          <div>
            <button className="done-button" onClick={() => mark(item.title, "done")}>
              <Icon name="check" size={13} />
              Done
            </button>
            <button className="missed-button" onClick={() => mark(item.title, "missed")}>
              <Icon name="close" size={13} />
              Missed
            </button>
          </div>
        </article>
      ))}
      {patient.physicalPlan.length > 0 && (
        <small className="care-plan-boundary">
          <Icon name="shield" size={12} />
          Done and missed tasks are saved in Changes.
        </small>
      )}
    </section>
  );
}

function RecipeHelper({ patient }: { patient: Patient }) {
  type MealPlan = { name: string; morning: string; afternoon: string; evening: string };
  const recordPlans: Record<PatientId, MealPlan[]> = {
    margaret: [
      {
        name: "Comfort-feeding day",
        morning:
          "Care-team-approved warm cereal with an approved smooth side. Use only the ordered food texture and drink thickness.",
        afternoon:
          "Care-team-approved soft or blended chicken, potato, and vegetable meal. Give small bites slowly.",
        evening:
          "Care-team-approved soft or blended soup with a fortified side. Stop if she coughs, sounds wet, or becomes sleepy.",
      },
      {
        name: "Small-meal comfort day",
        morning:
          "Approved-texture yogurt or cereal with an approved drink. Feed only while she is awake and upright.",
        afternoon:
          "Approved-texture fish or another familiar protein with soft vegetables and a small fortified side.",
        evening:
          "A small approved-texture meal she enjoys, followed by mouth care and the ordered upright time.",
      },
    ],
    noah: [
      {
        name: "Calm familiar-food day",
        morning:
          "Oatmeal or another familiar cereal, banana, and his usual drink. Keep foods separate if he prefers.",
        afternoon:
          "Plain chicken, rice, and soft cooked carrots, using only foods he already accepts.",
        evening:
          "Pasta with a familiar sauce served separately if needed, plus an accepted fruit or vegetable.",
      },
      {
        name: "Simple choice day",
        morning: "Eggs or a familiar breakfast food, toast, and an accepted fruit.",
        afternoon: "Turkey or another accepted protein, crackers or rice, and an accepted drink.",
        evening:
          "A familiar baked protein, potato or rice, and one accepted vegetable. Keep the routine calm.",
      },
    ],
  };
  const [planIndex, setPlanIndex] = useState(0),
    [aiIdea, setAiIdea] = useState<MealPlan | null>(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    plans = recordPlans[patient.id],
    shown = aiIdea ?? plans[planIndex % plans.length];
  async function askAi() {
    const endpoint = import.meta.env.VITE_RECIPE_AI_ENDPOINT;
    if (!endpoint) {
      setAiIdea(null);
      setPlanIndex((index) => (index + 1) % plans.length);
      setError("Using the patient record. Add a secure AI endpoint for more plans.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          request: "a simple daily meal plan with specific morning, afternoon, and evening foods",
          patientRecord: {
            age: patient.ageLine,
            condition: patient.bannerCondition,
            allergies: patient.allergies,
            foodAndEating: patient.feeding,
            movement: patient.mobility,
            careGoals: patient.goalsOfCare,
          },
          foodRules: patient.careRestrictions,
        }),
      });
      if (!response.ok) throw new Error("Recipe service error");
      const data = (await response.json()) as Partial<MealPlan>;
      if (!data.name || !data.morning || !data.afternoon || !data.evening)
        throw new Error("Incomplete meal plan");
      setAiIdea({
        name: data.name,
        morning: data.morning,
        afternoon: data.afternoon,
        evening: data.evening,
      });
    } catch {
      setError("AI could not make a plan. Showing a record-based plan.");
      setAiIdea(null);
      setPlanIndex((index) => (index + 1) % plans.length);
    } finally {
      setLoading(false);
    }
  }
  return (
    <section className="today-card recipe-helper">
      <div className="card-head">
        <span>
          <small>AI MEAL HELPER</small>
          <h2>Meals from the patient record</h2>
        </span>
        <Icon name="sparkle" />
      </div>
      <article className="recipe-idea">
        <small>{aiIdea ? "AI MEAL PLAN" : "RECORD-BASED PLAN"}</small>
        <h3>{shown.name}</h3>
        <div className="daily-meals">
          <section>
            <b>Morning</b>
            <p>{shown.morning}</p>
          </section>
          <section>
            <b>Afternoon</b>
            <p>{shown.afternoon}</p>
          </section>
          <section>
            <b>Evening</b>
            <p>{shown.evening}</p>
          </section>
        </div>
      </article>
      <button className="primary-action" disabled={loading} onClick={askAi}>
        <Icon name="sparkle" size={15} />
        {loading ? "Making the meal plan…" : "Show another meal plan"}
      </button>
      {error && <small className="recipe-error">{error}</small>}
      <small className="care-plan-boundary">
        <Icon name="shield" size={12} />
        {patient.id === "margaret"
          ? "Margaret’s exact food texture, drink thickness, and allergies are not confirmed. Use only the care team’s orders."
          : patient.allergies === "Not confirmed"
            ? "Allergies are not confirmed. Check before serving any food."
            : "Check the care plan before serving food."}
      </small>
    </section>
  );
}

function LegacyToday({
  patient,
  medications,
  setMedication,
  symptoms,
  setSymptoms,
  observation,
  setObservation,
  structured,
  structureObservation,
  confirmObservation,
  cancelStructure,
  saveCheckIn,
  checkInSaved,
  adherence,
}: TodayProps) {
  const [listening, setListening] = useState(false),
    [voiceError, setVoiceError] = useState("");
  const voiceRef = useRef<Recognizer | null>(null),
    textRef = useRef(observation);
  textRef.current = observation;
  function toggleVoice() {
    if (listening) {
      voiceRef.current?.stop();
      setListening(false);
      return;
    }
    const W = window as SpeechWindow,
      R = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!R) {
      setVoiceError("Live transcription is not supported in this browser.");
      return;
    }
    const before = textRef.current,
      r = new R();
    let final = "";
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-US";
    r.onstart = () => {
      setListening(true);
      setVoiceError("");
    };
    r.onend = () => setListening(false);
    r.onerror = () => {
      setListening(false);
      setVoiceError("Check microphone permission and try again.");
    };
    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const words = e.results[i]?.[0]?.transcript || "";
        if (e.results[i]?.isFinal) final += `${words} `;
        else interim += words;
      }
      setObservation(`${before}${before ? " " : ""}${final}${interim}`.trim());
    };
    voiceRef.current = r;
    r.start();
  }
  const careProfile = true,
    domains = patient.id === "noah" ? autismDomains : alzheimersDomains,
    prompt =
      patient.id === "margaret"
        ? "“Mom coughed twice during hand feeding and seemed sleepier than usual.”"
        : patient.id === "noah"
          ? "“Noah used his AAC less today and became distressed when the schedule changed.”"
          : "“Mom couldn’t remember how to use the microwave today.”";
  return (
    <>
      <Heading
        over="TODAY • CAREGIVER DASHBOARD"
        title="What needs attention today?"
        sub={`Daily care for ${patient.name.split(" ")[0]}, organized in one place.`}
      />
      <article className="patient-banner">
        <div>{patient.initial}</div>
        <span>
          <b>{patient.name}</b>
          <small>{patient.bannerCondition}</small>
        </span>
        <em>{patient.caregiverLine}</em>
      </article>
      {careProfile && (
        <article className="source-status">
          <Icon name="check" size={16} />
          <span>
            <b>Clinical profile loaded</b>
            <small>
              3 synthetic documents linked only to {patient.name}’s demo account. Missing items
              remain clearly marked.
            </small>
          </span>
        </article>
      )}
      <section className="today-card">
        <div className="card-head">
          <span>
            <small>TODAY’S MEDICATIONS</small>
            <h2>Medication record</h2>
          </span>
          <em>{adherence === null ? "No data" : `${adherence}% recorded`}</em>
        </div>
        {medications.length === 0 ? (
          <div className="missing-data">
            <Icon name="pill" size={20} />
            <span>
              <b>Medication list not supplied</b>
              <p>
                The clinical record says medication reconciliation is required. No reminders or
                adherence percentage will be created until an actual medication list is uploaded and
                confirmed.
              </p>
            </span>
          </div>
        ) : (
          medications.map((med) => (
            <article className={`med-dose ${med.status}`} key={med.id}>
              <i>
                <Icon name="pill" size={18} />
              </i>
              <span>
                <small>{med.time}</small>
                <b>{med.name}</b>
                <p>{med.detail}</p>
              </span>
              <div>
                <button className="taken" onClick={() => setMedication(med.id, "taken")}>
                  <Icon name="check" size={13} />
                  Taken
                </button>
                <button className="missed" onClick={() => setMedication(med.id, "missed")}>
                  <Icon name="close" size={13} />
                  Missed
                </button>
              </div>
            </article>
          ))
        )}
      </section>
      {careProfile && <CarePlan patient={patient} />}
      <section className="today-card">
        <div className="card-head">
          <span>
            <small>{careProfile ? "DAILY OBSERVATION CHECK-IN" : "DAILY COGNITIVE CHECK-IN"}</small>
            <h2>Changes from the usual baseline</h2>
          </span>
          <Icon name={careProfile ? "note" : "brain"} />
        </div>
        {domains.map((domain) => (
          <div className="domain" key={domain.name}>
            <h3>{domain.name}</h3>
            {domain.items.map((item) => (
              <label key={item}>
                <input
                  type="checkbox"
                  checked={Boolean(symptoms[item])}
                  onChange={() => setSymptoms((values) => ({ ...values, [item]: !values[item] }))}
                />
                <i>{symptoms[item] && <Icon name="check" size={12} />}</i>
                <span>{item}</span>
              </label>
            ))}
          </div>
        ))}
        <button className="primary-action" onClick={saveCheckIn}>
          {checkInSaved ? (
            <>
              <Icon name="check" size={15} />
              Check-in saved
            </>
          ) : (
            "Save daily check-in"
          )}
        </button>
      </section>
      <section className="today-card observation-card">
        <div className="card-head">
          <span>
            <small>RECORD OBSERVATION</small>
            <h2>What did you notice?</h2>
          </span>
          <Icon name="note" />
        </div>
        <p className="prompt-example">Try: {prompt}</p>
        <button className={`voice-capture ${listening ? "listening" : ""}`} onClick={toggleVoice}>
          <Icon name="mic" size={16} />
          {listening ? "Stop live transcription" : "Capture the patient’s words"}
        </button>
        {voiceError && <small className="form-error">{voiceError}</small>}
        <textarea
          value={observation}
          onChange={(e) => {
            setObservation(e.target.value);
            if (structured) cancelStructure();
          }}
          placeholder="Describe the exact event in your own words…"
        />
        <button
          className="structure-button"
          disabled={!observation.trim()}
          onClick={structureObservation}
        >
          <Icon name="sparkle" size={16} />
          Structure observation
        </button>
        {structured && (
          <article className="structured-preview">
            <div>
              <Icon name="sparkle" size={18} />
              <span>
                <small>AI-STRUCTURED DRAFT</small>
                <h3>Confirm before saving</h3>
              </span>
            </div>
            <dl>
              <dt>Category</dt>
              <dd>{structured.category}</dd>
              <dt>Observation domain</dt>
              <dd>{structured.domain}</dd>
              <dt>Event</dt>
              <dd>{structured.event}</dd>
              <dt>Date</dt>
              <dd>{structured.date}</dd>
            </dl>
            <p>Original: “{structured.original}”</p>
            <div className="confirm-actions">
              <button onClick={cancelStructure}>Edit</button>
              <button onClick={confirmObservation}>
                <Icon name="check" size={14} />
                Confirm & save
              </button>
            </div>
            <small>
              <Icon name="shield" size={12} />
              AI organizes the observation; it does not diagnose a condition.
            </small>
          </article>
        )}
      </section>
    </>
  );
}

function CarePlan({ patient }: { patient: Patient }) {
  const [open, setOpen] = useState<"physical" | "nutrition" | "restrictions" | null>("physical");
  const groups = [
    {
      id: "physical" as const,
      label: "Movement and exercise",
      icon: "care" as IconName,
      items: patient.physicalPlan,
    },
    {
      id: "nutrition" as const,
      label: "Food and drinks",
      icon: "heart" as IconName,
      items: patient.nutritionPlan,
    },
  ];
  return (
    <section className="today-card care-plan-card">
      <div className="card-head">
        <span>
          <small>CARE PLAN FROM RECORDS</small>
          <h2>Movement, food, and safety</h2>
        </span>
        <Icon name="file" />
      </div>
      <p className="prompt-example">
        Simple notes from {patient.name}’s records. Ask the care team about anything marked as not
        confirmed.
      </p>
      {groups.map((group) => (
        <article className="care-plan-group" key={group.id}>
          <button onClick={() => setOpen(open === group.id ? null : group.id)}>
            <i>
              <Icon name={group.icon} size={17} />
            </i>
            <span>
              <b>{group.label}</b>
              <small>{group.items.length} care tasks</small>
            </span>
            <Icon name="chevron" size={16} />
          </button>
          {open === group.id && (
            <div>
              {group.items.map((item) => (
                <section key={item.title}>
                  <b>{item.title}</b>
                  <p>{item.detail}</p>
                </section>
              ))}
            </div>
          )}
        </article>
      ))}
      <article className="care-plan-group restrictions">
        <button onClick={() => setOpen(open === "restrictions" ? null : "restrictions")}>
          <i>
            <Icon name="shield" size={17} />
          </i>
          <span>
            <b>What not to do</b>
            <small>Important safety rules</small>
          </span>
          <Icon name="chevron" size={16} />
        </button>
        {open === "restrictions" && (
          <div>
            {patient.careRestrictions.map((item) => (
              <section key={item}>
                <p>{item}</p>
              </section>
            ))}
          </div>
        )}
      </article>
      <small className="care-plan-boundary">
        <Icon name="shield" size={12} />
        These are general notes from the records, not medical orders. Ask the care team to confirm
        exercises, food, drinks, swallowing steps, and equipment.
      </small>
    </section>
  );
}

function Changes({
  patientName,
  content,
  adherence,
  observationCount,
  summaryReady,
  setSummaryReady,
  shared,
  setShared,
  events,
}: {
  patientName: string;
  content: PatientClinicalContent;
  adherence: number | null;
  observationCount: number;
  summaryReady: boolean;
  setSummaryReady: (v: boolean) => void;
  shared: boolean;
  setShared: (v: boolean) => void;
  events: TimelineEvent[];
}) {
  const missedReminders = events.filter((event) =>
    /marked missed|task missed/i.test(`${event.title} ${event.detail}`),
  );
  if (events.length === 0)
    return (
      <>
        <Heading
          over="14-DAY LONGITUDINAL VIEW"
          title="No trend data yet"
          sub={`${patientName}’s clinical profile is available, but no dated caregiver observations were supplied.`}
        />
        <section className="longitudinal-empty">
          <i>
            <Icon name="chart" size={25} />
          </i>
          <h2>Charts will appear after data is recorded</h2>
          <p>
            Use the daily checklist and observation note on the Today page. Luma needs records from
            multiple dates before it can compare changes or create an AI trend summary.
          </p>
          <div>
            <span>
              <Icon name="check" size={13} />
              Clinical profile linked
            </span>
            <span>
              <Icon name="clock" size={13} />0 of 14 days recorded
            </span>
            <span>
              <Icon name="pill" size={13} />
              Medication list missing
            </span>
          </div>
        </section>
        <article className="data-boundary">
          <Icon name="shield" size={15} />
          <p>
            <b>Why this page is empty</b>The uploaded clinical record contains baseline care needs,
            but it does not contain dated longitudinal observations, medication administration
            history, or adherence data.
          </p>
        </article>
      </>
    );
  if (Object.keys(content.series).length === 0)
    return (
      <>
        <Heading
          over="14-DAY LONGITUDINAL VIEW"
          title="Building the record"
          sub="The first caregiver entry is saved, but there is not enough dated data to calculate a trend."
        />
        <section className="longitudinal-empty">
          <i>
            <Icon name="timeline" size={25} />
          </i>
          <h2>
            {events.length} {events.length === 1 ? "entry" : "entries"} recorded
          </h2>
          <p>
            Continue recording observations on different days. Charts and AI analysis remain
            unavailable until a meaningful comparison can be made.
          </p>
        </section>
        <Timeline events={events} />
      </>
    );
  return (
    <>
      <Heading
        over="14-DAY LONGITUDINAL VIEW"
        title="What’s changed"
        sub="Generalized synthetic patterns from two weeks of caregiver check-ins—not a diagnosis."
      />
      <AnalysisDashboard
        content={content}
        adherence={adherence}
        observationCount={observationCount}
      />
      <section className="trend-list">
        {missedReminders.length > 0 && (
          <Trend
            title="Daily reminders"
            metric="Medicine or movement tasks missed"
            values={`${missedReminders.length} missed ${missedReminders.length === 1 ? "item" : "items"} recorded`}
            tone="new"
            label="Needs review"
          />
        )}
        {content.trendRows.map((row) => (
          <Trend
            key={row.title}
            title={row.title}
            metric={row.metric}
            values={row.values}
            tone={row.tone}
            label={row.label}
          />
        ))}
        {adherence !== null && (
          <Trend
            title="Medication adherence"
            metric="Taken as scheduled"
            values={`92% → ${adherence}%`}
            tone={adherence < 90 ? "new" : "down"}
            label={adherence < 90 ? "Needs review" : "Mostly steady"}
          />
        )}
      </section>
      <button className="summary-action" onClick={() => setSummaryReady(!summaryReady)}>
        <Icon name="note" size={18} />
        <span>
          <b>{summaryReady ? "Hide 14-day care summary" : "Generate 14-day care summary"}</b>
          <small>Trends{adherence !== null ? ", adherence" : ""}, and key observations</small>
        </span>
        <span className={`summary-chevron ${summaryReady ? "open" : ""}`}>
          <Icon name="chevron" size={17} />
        </span>
      </button>
      {summaryReady && (
        <CareSummary
          patientName={patientName}
          content={content}
          adherence={adherence}
          observationCount={observationCount}
          shared={shared}
          onShare={() => setShared(true)}
        />
      )}
      <Timeline events={events} />
    </>
  );
}
function AnalysisDashboard({
  content,
  adherence,
  observationCount,
}: {
  content: PatientClinicalContent;
  adherence: number | null;
  observationCount: number;
}) {
  const series = content.series;
  const [metric, setMetric] = useState(content.defaultMetric),
    selected = series[metric] ?? series[content.defaultMetric],
    max = Math.max(8, ...selected.values),
    points = selected.values
      .map((value, index) => `${12 + index * 36},${94 - (value / max) * 72}`)
      .join(" "),
    weekly = adherence === null ? [] : [91, adherence];
  return (
    <section className="analytics-dashboard">
      <div className="analytics-heading">
        <span>
          <small>PATIENT DATA</small>
          <h2>14-day overview</h2>
        </span>
        <em>Synthetic demo</em>
      </div>
      <div className="analytics-kpis">
        <article>
          <b>{observationCount + (content.defaultMetric === "Memory" ? 8 : 0)}</b>
          <small>Observations</small>
        </article>
        <article>
          <b>{content.notableChanges}</b>
          <small>Notable changes</small>
        </article>
        <article>
          <b>{adherence === null ? "—" : `${adherence}%`}</b>
          <small>{adherence === null ? "Medication data" : "Adherence"}</small>
        </article>
      </div>
      <article className="symptom-chart">
        <div className="chart-title">
          <span>
            <small>OBSERVATION REPORTS</small>
            <b>{selected.note}</b>
          </span>
          <em>
            {selected.values[0]} → {selected.values.at(-1)}
          </em>
        </div>
        <div className="chart-switch">
          {Object.keys(series).map((item) => (
            <button
              key={item}
              className={metric === item ? "active" : ""}
              onClick={() => setMetric(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <svg
          viewBox="0 0 240 112"
          role="img"
          aria-label={`${metric} reports over the past 14 days`}
        >
          <path className="chart-grid" d="M12 22H228M12 58H228M12 94H228" />
          <polyline
            points={points}
            fill="none"
            stroke={selected.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {selected.values.map((value, index) => (
            <circle
              key={index}
              cx={12 + index * 36}
              cy={94 - (value / max) * 72}
              r="3.5"
              fill="#fff"
              stroke={selected.color}
              strokeWidth="2"
            />
          ))}
        </svg>
        <div className="chart-labels">
          <span>14 days ago</span>
          <span>Today</span>
        </div>
      </article>
      {adherence !== null && (
        <div className="analytics-lower">
          <article className="adherence-ring">
            <div
              className="ring"
              style={{ "--ring-value": `${adherence * 3.6}deg` } as React.CSSProperties}
            >
              <span>
                <b>{adherence}%</b>
                <small>taken</small>
              </span>
            </div>
            <div>
              <small>MEDICATION</small>
              <b>14-day adherence</b>
              <p>{adherence >= 90 ? "Mostly consistent" : "Needs caregiver review"}</p>
            </div>
          </article>
          <article className="weekly-bars">
            <div>
              <small>2-WEEK ADHERENCE</small>
              <b>Scheduled doses taken</b>
            </div>
            <section>
              {weekly.map((value, index) => (
                <span key={index}>
                  <i>
                    <b style={{ height: `${value}%` }} />
                  </i>
                  <small>Week {index + 1}</small>
                </span>
              ))}
            </section>
          </article>
        </div>
      )}
      <article className="data-insight">
        <Icon name="sparkle" size={17} />
        <p>
          <b>Pattern to review:</b> {content.insight}
        </p>
      </article>
      <small className="chart-footnote">
        <Icon name="shield" size={12} />
        Charts summarize synthetic caregiver-entered demo data; they do not predict or diagnose
        disease.
      </small>
    </section>
  );
}
function Trend({
  title,
  metric,
  values,
  tone,
  label,
}: {
  title: string;
  metric: string;
  values: string;
  tone: string;
  label: string;
}) {
  return (
    <article className="trend-row">
      <div>
        <small>{title}</small>
        <b>{metric}</b>
        <p>{values}</p>
      </div>
      <em className={tone}>{label}</em>
    </article>
  );
}
function CareSummary({
  patientName,
  content,
  adherence,
  observationCount,
  shared,
  onShare,
}: {
  patientName: string;
  content: PatientClinicalContent;
  adherence: number | null;
  observationCount: number;
  shared: boolean;
  onShare: () => void;
}) {
  return (
    <article className="care-summary">
      <div className="summary-heading">
        <span>
          <small>LAST 14 DAYS • SYNTHETIC</small>
          <h2>{patientName.split(" ")[0]}’s care summary</h2>
        </span>
        <em>Generated today</em>
      </div>
      <section>
        <b>Major observation trends</b>
        <p>{content.summaryMajorTrends}</p>
      </section>
      <section>
        <b>Caregiver observations</b>
        <p>
          {observationCount + (content.defaultMetric === "Memory" ? 8 : 0)} observations were
          recorded. {content.summaryObservationsNote}
        </p>
      </section>
      {adherence !== null ? (
        <section>
          <b>Medication adherence</b>
          <p>
            {Math.round((adherence * 14) / 100)}/14 scheduled days were recorded as taken (
            {adherence}%).
          </p>
        </section>
      ) : (
        <section>
          <b>Medication data</b>
          <p>
            No medication list or administration history was supplied, so adherence is not
            calculated.
          </p>
        </section>
      )}
      <section>
        <b>Notable changes</b>
        <p>{content.summaryNotableChanges}</p>
      </section>
      <p className="summary-safe">
        <Icon name="shield" size={13} />
        Generalized synthetic demo data only. Replace with real dated observations; no diagnosis or
        medication recommendation.
      </p>
      <button className={shared ? "shared" : ""} onClick={onShare}>
        <Icon name={shared ? "check" : "share"} size={16} />
        {shared ? "Shared with care team" : "Share Care Summary"}
      </button>
    </article>
  );
}

function Timeline({ events }: { events: TimelineEvent[] }) {
  const eventsByDay = events.reduce(
    (map, event) => {
      (map[event.day] = map[event.day] || []).push(event);
      return map;
    },
    {} as Record<number, TimelineEvent[]>,
  );
  function daySeverity(day: number): Severity | null {
    const dayEvents = eventsByDay[day];
    if (!dayEvents) return null;
    if (dayEvents.some((event) => event.severity === "red")) return "red";
    if (dayEvents.some((event) => event.severity === "orange")) return "orange";
    return "green";
  }
  const [selectedDay, setSelectedDay] = useState<number | null>(events[0]?.day ?? null),
    dayEvents = events.filter((event) => event.day === selectedDay);
  return (
    <section className="today-card">
      <div className="card-head">
        <span>
          <small>CARE HISTORY</small>
          <h2>August {CARE_HISTORY_YEAR}</h2>
        </span>
        <Icon name="timeline" />
      </div>
      <div className="calendar-grid">
        {["S", "M", "T", "W", "T", "F", "S"].map((label, index) => (
          <span className="calendar-weekday" key={`h${index}`}>
            {label}
          </span>
        ))}
        {careHistoryDays.map((day, index) => {
          if (day === null) return <span className="calendar-cell empty" key={index} />;
          const severity = daySeverity(day);
          return (
            <button
              key={index}
              className={`calendar-cell ${severity ? `sev-${severity}` : ""} ${day === selectedDay ? "selected" : ""} ${day === CARE_HISTORY_TODAY ? "is-today" : ""}`}
              disabled={!severity}
              onClick={() => setSelectedDay(day)}
            >
              <span className="calendar-day-num">{day}</span>
              {severity && <span className={`calendar-dot dot-${severity}`} />}
            </button>
          );
        })}
      </div>
      <div className="calendar-legend">
        <span>
          <i className="dot-red" />
          Needs review
        </span>
        <span>
          <i className="dot-orange" />
          Worsening
        </span>
        <span>
          <i className="dot-green" />
          Stable
        </span>
      </div>
      <section className="mvp-timeline calendar-day-events">
        {dayEvents.length === 0 && (
          <p className="first-reply">
            {selectedDay
              ? `No entries recorded for Aug ${selectedDay}.`
              : "Select a highlighted date to see what was recorded."}
          </p>
        )}
        {dayEvents.map((event) => (
          <article key={event.id}>
            <i className={event.kind}>
              <Icon
                name={
                  event.kind === "medication"
                    ? "pill"
                    : event.kind === "check-in"
                      ? "check"
                      : event.kind === "change"
                        ? "chart"
                        : "note"
                }
                size={17}
              />
            </i>
            <div>
              <small>{event.clock}</small>
              <h3>
                <span className={`calendar-dot dot-${event.severity}`} />
                {event.title}
              </h3>
              <p>{event.detail}</p>
              <em className={`severity-tag sev-${event.severity}`}>
                {severityLabel[event.severity]}
              </em>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
function Community() {
  const [posts, setPosts] = useState(seedCommunityPosts),
    [draft, setDraft] = useState(""),
    [topic, setTopic] = useState("Daily care"),
    [filter, setFilter] = useState("For you"),
    [query, setQuery] = useState(""),
    [openPost, setOpenPost] = useState<number | null>(null),
    [replyDraft, setReplyDraft] = useState<Record<number, string>>({});
  const [likedPosts, setLikedPosts] = useState<Record<number, boolean>>({}),
    [dmOpen, setDmOpen] = useState<number | null>(null),
    [dmDraft, setDmDraft] = useState<Record<number, string>>({}),
    [dmSent, setDmSent] = useState<Record<number, string>>({});
  const topicPosts =
      filter === "For you"
        ? posts
        : filter === "Professionals"
          ? posts.filter((post) => post.replies.some((reply) => reply.verified))
          : posts.filter((post) => post.topic === filter),
    keyword = query.trim().toLowerCase(),
    visiblePosts = topicPosts.filter(
      (post) =>
        !keyword ||
        [
          post.question,
          post.author,
          post.role,
          post.topic,
          ...post.replies.flatMap((reply) => [reply.name, reply.role, reply.text]),
        ].some((value) => value.toLowerCase().includes(keyword)),
    );
  function publish() {
    const question = draft.trim();
    if (!question) return;
    setPosts((items) => [
      {
        id: Date.now(),
        author: "Maya C.",
        role: "Family caregiver",
        time: "Just now",
        topic,
        question,
        likes: 0,
        replies: [],
      },
      ...items,
    ]);
    setDraft("");
    setFilter("For you");
  }
  function like(id: number) {
    if (likedPosts[id]) return;
    setLikedPosts((values) => ({ ...values, [id]: true }));
    setPosts((items) =>
      items.map((post) => (post.id === id ? { ...post, likes: post.likes + 1 } : post)),
    );
  }
  function reply(id: number) {
    const text = replyDraft[id]?.trim();
    if (!text) return;
    setPosts((items) =>
      items.map((post) =>
        post.id === id
          ? {
              ...post,
              replies: [
                ...post.replies,
                {
                  id: Date.now(),
                  name: "Maya C.",
                  role: "Family caregiver",
                  time: "Just now",
                  text,
                },
              ],
            }
          : post,
      ),
    );
    setReplyDraft((values) => ({ ...values, [id]: "" }));
    setOpenPost(id);
  }
  function sendDm(id: number, name: string) {
    const text = dmDraft[id]?.trim();
    if (!text) return;
    setDmSent((values) => ({ ...values, [id]: name }));
    setDmDraft((values) => ({ ...values, [id]: "" }));
    setDmOpen(null);
  }
  return (
    <>
      <Heading
        over="CAREGIVER COMMUNITY"
        title="Ask, share, and respond"
        sub="Connect with caregivers and verified healthcare professionals."
      />
      <section className="community-composer">
        <div>
          <span className="community-avatar">M</span>
          <b>What would you like help with?</b>
        </div>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask a care question or share what worked…"
        />
        <div className="composer-actions">
          <select
            aria-label="Question topic"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
          >
            <option>Daily care</option>
            <option>Medication</option>
            <option>Symptoms</option>
          </select>
          <button disabled={!draft.trim()} onClick={publish}>
            <Icon name="send" size={14} />
            Post question
          </button>
        </div>
      </section>
      <div className="community-search">
        <Icon name="search" size={17} />
        <input
          aria-label="Search community"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search medication, symptoms, routines…"
        />
        {query && (
          <button aria-label="Clear search" onClick={() => setQuery("")}>
            <Icon name="close" size={13} />
          </button>
        )}
      </div>
      {keyword && (
        <small className="search-count">
          {visiblePosts.length} {visiblePosts.length === 1 ? "result" : "results"} for “
          {query.trim()}”
        </small>
      )}
      <div className="community-filters">
        {["For you", "Professionals", "Medication", "Daily care"].map((item) => (
          <button
            key={item}
            className={filter === item ? "active" : ""}
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <section className="community-feed">
        {visiblePosts.length === 0 && (
          <article className="no-community-results">
            <Icon name="search" size={22} />
            <h2>No matching discussions</h2>
            <p>Try a broader keyword or choose a different topic.</p>
            <button
              onClick={() => {
                setQuery("");
                setFilter("For you");
              }}
            >
              Clear search and filters
            </button>
          </article>
        )}
        {visiblePosts.map((post) => (
          <article className="community-post" key={post.id}>
            <div className="community-author">
              <span className="community-avatar">{post.author[0]}</span>
              <div>
                <b>{post.author}</b>
                <small>
                  {post.role} • {post.time}
                </small>
              </div>
              <em>{post.topic}</em>
            </div>
            <h2>{post.question}</h2>
            <div className="community-actions">
              <button
                className={likedPosts[post.id] ? "liked" : ""}
                disabled={likedPosts[post.id]}
                onClick={() => like(post.id)}
              >
                <Icon name="heart" size={14} />
                {post.likes}
              </button>
              <button onClick={() => setOpenPost(openPost === post.id ? null : post.id)}>
                <Icon name="reply" size={14} />
                {post.replies.length} replies
              </button>
            </div>
            {openPost === post.id && (
              <div className="reply-thread">
                {post.replies.map((item) => (
                  <article className="community-reply" key={item.id}>
                    <button
                      className={`community-avatar avatar-button ${item.verified ? "professional" : ""}`}
                      aria-label={`Message ${item.name}`}
                      onClick={() => setDmOpen(dmOpen === item.id ? null : item.id)}
                    >
                      {item.name[0]}
                    </button>
                    <div>
                      <header>
                        <b>{item.name}</b>
                        {item.verified && (
                          <em>
                            <Icon name="check" size={10} />
                            Verified
                          </em>
                        )}
                      </header>
                      <small>
                        {item.role} • {item.time}
                      </small>
                      <p>{item.text}</p>
                      {dmOpen === item.id ? (
                        <div className="dm-box">
                          <input
                            aria-label={`Message ${item.name}`}
                            value={dmDraft[item.id] || ""}
                            onChange={(event) =>
                              setDmDraft((values) => ({ ...values, [item.id]: event.target.value }))
                            }
                            placeholder={`Message ${item.name}…`}
                          />
                          <button
                            disabled={!dmDraft[item.id]?.trim()}
                            onClick={() => sendDm(item.id, item.name)}
                          >
                            Send
                          </button>
                        </div>
                      ) : (
                        dmSent[item.id] && (
                          <small className="dm-sent">
                            <Icon name="check" size={10} />
                            Message sent to {dmSent[item.id]}
                          </small>
                        )
                      )}
                    </div>
                  </article>
                ))}
                {post.replies.length === 0 && (
                  <p className="first-reply">Be the first caregiver to respond.</p>
                )}
                <div className="reply-box">
                  <input
                    aria-label={`Reply to ${post.author}`}
                    value={replyDraft[post.id] || ""}
                    onChange={(event) =>
                      setReplyDraft((values) => ({ ...values, [post.id]: event.target.value }))
                    }
                    placeholder="Write a supportive response…"
                  />
                  <button disabled={!replyDraft[post.id]?.trim()} onClick={() => reply(post.id)}>
                    Reply
                  </button>
                </div>
              </div>
            )}
          </article>
        ))}
      </section>
      <p className="community-safety">
        <Icon name="shield" size={14} />
        Community responses provide general education and peer support, not diagnosis or
        personalized prescriptions. For urgent or sudden changes, contact the care team or emergency
        services.
      </p>
    </>
  );
}
function Profile({ patient }: { patient: Patient }) {
  const hasDocuments = true;
  return (
    <>
      <Heading
        over="PATIENT PROFILE"
        title={patient.name}
        sub="Personal and care details for this patient only."
      />
      <section className="mvp-profile">
        <div>{patient.initial}</div>
        <h2>{patient.name}</h2>
        <p>{patient.ageLine}</p>
        <span>Main caregiver: {patient.primaryCaregiver}</span>
      </section>
      <section className="profile-details">
        <small>PERSONAL DETAILS</small>
        {patientExtraDetails[patient.id].map((item) => (
          <Info key={item.label} label={item.label} value={item.value} />
        ))}
      </section>
      {hasDocuments && (
        <section className="record-source-card">
          <Icon name="file" size={19} />
          <span>
            <small>THIS PATIENT’S RECORDS</small>
            <b>3 records linked only to {patient.name}</b>
            <p>{patient.recordDescription}.</p>
          </span>
        </section>
      )}
      <section className="profile-details">
        <small>CARE DETAILS</small>
        <Info label="Doctor" value={patient.primaryPhysician} />
        <Info label="Pharmacy" value={patient.pharmacy} />
        <Info
          label="Medicine list"
          value={hasDocuments ? "Not listed; must be checked" : "Available in care plan"}
        />
        <Info label="Allergies" value={patient.allergies} />
        <Info label="Movement" value={patient.mobility} />
        <Info label="Communication" value={patient.communication} />
        <Info label="Food and eating" value={patient.feeding} />
        <Info label="Sleep" value={patient.sleep} />
        <Info label="Behavior" value={patient.behavior} />
        <Info label="Safety" value={patient.safety} />
        <Info label="Emergency contact" value={patient.emergencyContact} />
        <Info label="Care goals" value={patient.goalsOfCare} />
      </section>
      <p className="mvp-disclaimer">
        <Icon name="shield" size={13} />
        Missing details are marked “Not listed” or “Not confirmed.” Information is not copied from
        another patient.
      </p>
    </>
  );
}
function LegacyProfile({ patient }: { patient: Patient }) {
  const hasDocuments = true;
  return (
    <>
      <Heading
        over="PATIENT PROFILE"
        title={patient.name}
        sub="Essential information stored only in this patient account."
      />
      <section className="mvp-profile">
        <div>{patient.initial}</div>
        <h2>{patient.name}</h2>
        <p>{patient.ageLine}</p>
        <span>Primary caregiver: {patient.primaryCaregiver}</span>
      </section>
      {hasDocuments && (
        <section className="record-source-card">
          <Icon name="file" size={19} />
          <span>
            <small>ACCOUNT-AFFILIATED RECORDS</small>
            <b>3 synthetic documents linked only to {patient.name}</b>
            <p>{patient.recordDescription}.</p>
          </span>
        </section>
      )}
      <section className="profile-details">
        <small>CARE INFORMATION</small>
        <Info label="Primary physician" value={patient.primaryPhysician} />
        <Info label="Pharmacy" value={patient.pharmacy} />
        <Info
          label="Medication list"
          value={hasDocuments ? "Not supplied — reconciliation required" : "Available in care plan"}
        />
        <Info label="Allergies" value={patient.allergies} />
        <Info label="Mobility" value={patient.mobility} />
        <Info label="Communication" value={patient.communication} />
        <Info label="Eating / feeding" value={patient.feeding} />
        <Info label="Sleep" value={patient.sleep} />
        <Info label="Behavior / regulation" value={patient.behavior} />
        <Info label="Safety" value={patient.safety} />
        <Info label="Emergency contact" value={patient.emergencyContact} />
        <Info label="Goals of care" value={patient.goalsOfCare} />
      </section>
      <section className="support-lite">
        <small>CAREGIVER SUPPORT</small>
        <h2>Questions from the community</h2>
        <p>Search peer discussions or ask a verified professional a general care question.</p>
      </section>
      <p className="mvp-disclaimer">
        <Icon name="shield" size={13} />
        Synthetic hackathon data only. Missing clinical information is intentionally not inferred or
        copied from another patient.
      </p>
    </>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}
function Professional({ patient }: { patient: Patient }) {
  const [openClinician, setOpenClinician] = useState<number | null>(null),
    [booked, setBooked] = useState<Record<number, string>>({});
  const [deliveryOpen, setDeliveryOpen] = useState(false),
    [deliveryTime, setDeliveryTime] = useState<string | null>(null);
  function book(id: number, slot: string) {
    setBooked((values) => ({ ...values, [id]: slot }));
    setOpenClinician(null);
  }
  function cancelBooking(id: number) {
    setBooked((values) => {
      const next = { ...values };
      delete next[id];
      return next;
    });
  }
  function bookDelivery(slot: string) {
    setDeliveryTime(slot);
    setDeliveryOpen(false);
  }
  function cancelDelivery() {
    setDeliveryTime(null);
  }
  const missingTeam = true;
  return (
    <>
      <Heading
        over="PROFESSIONAL CARE"
        title="Reach a care professional"
        sub={
          missingTeam
            ? `${patient.name}’s treating clinician and pharmacy were not supplied in the uploaded record.`
            : `Connect with ${patient.name.split(" ")[0]}'s doctor and pharmacy without leaving home.`
        }
      />
      {missingTeam && (
        <article className="data-boundary">
          <Icon name="shield" size={15} />
          <p>
            <b>No affiliated care team yet</b>The professionals below are demonstration options
            only. Add confirmed contact information before enabling real appointments or
            prescription delivery.
          </p>
        </article>
      )}
      <section className="today-card">
        <div className="card-head">
          <span>
            <small>DEMO DIRECTORY</small>
            <h2>Choose a professional</h2>
          </span>
          <Icon name="doctor" />
        </div>
        <p className="prompt-example">
          These sample professionals are not part of {patient.name}’s uploaded clinical record.
        </p>
        <div className="clinician-list">
          {clinicians.map((clinician) => (
            <article className="clinician-row" key={clinician.id}>
              <button
                className="clinician-summary"
                onClick={() =>
                  setOpenClinician(openClinician === clinician.id ? null : clinician.id)
                }
              >
                <span className="community-avatar professional">{clinician.name[0]}</span>
                <span className="clinician-info">
                  <b>{clinician.name}</b>
                  <small>{clinician.role} • Demo</small>
                </span>
                <Icon name="chevron" size={16} />
              </button>
              {booked[clinician.id] && (
                <div className="booking-row">
                  <em className="booking-badge">
                    <Icon name="check" size={11} />
                    {booked[clinician.id]}
                  </em>
                  <button className="booking-cancel" onClick={() => cancelBooking(clinician.id)}>
                    Cancel
                  </button>
                </div>
              )}
              {openClinician === clinician.id && (
                <div className="slot-picker">
                  {clinician.slots.map((slot) => (
                    <button key={slot} onClick={() => book(clinician.id, slot)}>
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
      {!missingTeam && (
        <section className="today-card">
          <div className="card-head">
            <span>
              <small>HOME DELIVERY</small>
              <h2>{patient.pharmacy}</h2>
            </span>
            <Icon name="pill" />
          </div>
          <p className="prompt-example">
            Have current prescriptions delivered directly to the house.
          </p>
          {!deliveryTime && (
            <button className="primary-action" onClick={() => setDeliveryOpen((open) => !open)}>
              {deliveryOpen ? "Hide delivery windows" : "Request medication delivery"}
            </button>
          )}
          {deliveryTime && (
            <div className="booking-row">
              <em className="booking-badge">
                <Icon name="check" size={11} />
                {deliveryTime}
              </em>
              <button className="booking-cancel" onClick={cancelDelivery}>
                Cancel
              </button>
            </div>
          )}
          {deliveryOpen && !deliveryTime && (
            <div className="slot-picker">
              {deliverySlots.map((slot) => (
                <button key={slot} onClick={() => bookDelivery(slot)}>
                  {slot}
                </button>
              ))}
            </div>
          )}
        </section>
      )}
      <p className="mvp-disclaimer">
        <Icon name="shield" size={13} />
        Synthetic hackathon data only. Requests are simulated and not sent to a real provider.
      </p>
    </>
  );
}
