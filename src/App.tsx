import { useEffect, useMemo, useRef, useState } from "react";
import {
  getSession,
  isSupabaseConfigured,
  loadLatestJournal,
  saveCheckIn,
  saveJournal,
  saveMedicalRecordMetadata,
  signIn,
  signUp,
} from "./lib/supabase";
import syntheticBipolarRecord from "../docs/bipolar/01_synthetic_patient_record_EN.md?raw";
import syntheticBipolarChecklist from "../docs/bipolar/02_patient_caregiver_checklist_EN.md?raw";
import syntheticBipolarPharmacotherapy from "../docs/bipolar/03_pharmacotherapy_summary_EN.md?raw";
import CognitiveCareApp, { patients, type PatientId } from "./CognitiveCareApp";
import { claimPatientInvitation, listMyPatients } from "./lib/care-data";

type Tab = "home" | "care" | "history" | "profile";
type MedicationDraft = { name: string; details: string; action?: string };
type UploadedRecord = { name: string; content: string };
type IconName =
  | Tab
  | "moon"
  | "send"
  | "plus"
  | "shield"
  | "file"
  | "pill"
  | "sleep"
  | "walk"
  | "food"
  | "heart"
  | "chevron"
  | "check"
  | "mic"
  | "sparkle";
const paths: Record<IconName, React.ReactNode> = {
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v11h14V10M9 21v-7h6v7" />
    </>
  ),
  care: (
    <>
      <path d="M12 21s-7-4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 6-7 10-7 10Z" />
      <path d="M8 13h2l1-3 2 6 1-3h2" />
    </>
  ),
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 3-7L3 8" />
      <path d="M3 3v5h5m4-1v5l3 2" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  moon: <path d="M20 16A9 9 0 0 1 8 4a9 9 0 1 0 12 12Z" />,
  send: (
    <>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="m22 2-11 11" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  file: (
    <>
      <path d="M6 2h8l4 4v16H6Z" />
      <path d="M14 2v5h5M9 13h6M9 17h6" />
    </>
  ),
  pill: (
    <>
      <path d="m10 21 11-11a4 4 0 0 0-6-6L4 15a4 4 0 0 0 6 6Z" />
      <path d="m9 10 5 5" />
    </>
  ),
  sleep: (
    <>
      <path d="M20 16A9 9 0 0 1 8 4a9 9 0 1 0 12 12Z" />
      <path d="M16 4h5l-5 5h5" />
    </>
  ),
  walk: (
    <>
      <circle cx="13" cy="4" r="2" />
      <path d="m10 22 1-6-3-3 2-5 4 3 4 1m-5-1-2 5 4 6" />
    </>
  ),
  food: (
    <>
      <path d="M6 2v8M3 2v5a3 3 0 0 0 6 0V2M6 10v12M16 2v20m0-20c4 2 5 7 0 10" />
    </>
  ),
  heart: <path d="M21 8c0 6-9 13-9 13S3 14 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3Z" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  check: <path d="m5 12 4 4L19 6" />,
  mic: (
    <>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8" />
    </>
  ),
  sparkle: (
    <>
      <path d="m12 3 1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4Z" />
      <path d="m19 16 .6 1.9 1.9.6-1.9.6L19 21l-.6-1.9-1.9-.6 1.9-.6Z" />
    </>
  ),
};
function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
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
const slides = [
  [
    "10 days",
    "You kept showing up",
    "Ten days of checking in with yourself. That consistency is worth celebrating.",
  ],
  [
    "7.4 hrs",
    "Your sleep is improving",
    "You averaged 34 more minutes of rest than last week. Small changes add up.",
  ],
  [
    "4 walks",
    "Movement made a difference",
    "On walking days, you reported feeling calmer. Your body noticed the care.",
  ],
];
const replies = [
  "Thank you for telling me. It sounds like today asked a lot of you. What felt hardest?",
  "I’m glad you checked in. A gentle next step could be water and three slow breaths. What feels manageable?",
  "I can help you notice patterns and prepare questions for your care team, but I can’t diagnose symptoms. When did you notice this?",
];

function titleCaseMedication(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function extractMedicationPlan(text: string): MedicationDraft[] {
  const drafts: MedicationDraft[] = [];
  const jsonBlocks = [...text.matchAll(/```json\s*([\s\S]*?)```/gi)].map((match) => match[1]);
  for (const jsonBlock of jsonBlocks) {
    try {
      const data = JSON.parse(jsonBlock),
        groups = [...(data.medications_on_admission || []), ...(data.medications_started || [])];
      for (const item of groups) {
        if (!item?.drug) continue;
        const details = [item.dose_mg != null ? `${item.dose_mg} mg` : null, item.frequency]
          .filter(Boolean)
          .join(" • ");
        drafts.push({
          name: titleCaseMedication(String(item.drug)),
          details: details || "Schedule requires review",
          action: item.action || item.duration,
        });
      }
    } catch {
      /* Continue with other records. */
    }
  }
  if (!drafts.length) {
    const medicineNames = [
      "lithium carbonate",
      "lithium",
      "olanzapine",
      "sertraline",
      "nicotine patch",
      "lorazepam",
      "quetiapine",
      "lamotrigine",
      "aripiprazole",
      "risperidone",
      "lurasidone",
      "cariprazine",
      "valproate",
      "carbamazepine",
    ];
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine
          .replace(/[|*_#`]/g, " ")
          .replace(/\s+/g, " ")
          .trim(),
        lower = line.toLowerCase();
      if (!line || /avoided|avoid |allerg|strong recommendation against/.test(lower)) continue;
      const name = medicineNames.find((medicine) => lower.includes(medicine));
      if (!name) continue;
      const dose = line.match(/\b\d+(?:\.\d+)?\s*(?:mg|mcg|g)\b/i)?.[0],
        frequency = line.match(
          /\b(?:once daily|twice daily|three times daily|daily|nightly|at bedtime|every \d+ hours|q\d+h(?:\s+prn)?|as needed)\b/i,
        )?.[0];
      if (!dose || !frequency) continue;
      drafts.push({
        name: titleCaseMedication(name),
        details: `${dose} • ${frequency}`,
        action: /taper|discontinue/i.test(line)
          ? "Taper/discontinue mentioned — clinician-directed only"
          : undefined,
      });
    }
  }
  return drafts.filter(
    (draft, index, list) =>
      list.findIndex((item) => item.name.toLowerCase() === draft.name.toLowerCase()) === index,
  );
}

interface VoiceResult {
  0: { transcript: string };
  isFinal: boolean;
}
interface VoiceResultEvent {
  results: VoiceResult[];
  resultIndex: number;
}
interface VoiceRecognizer {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: VoiceResultEvent) => void) | null;
}
type VoiceWindow = Window & {
  SpeechRecognition?: new () => VoiceRecognizer;
  webkitSpeechRecognition?: new () => VoiceRecognizer;
};
function toggleVoiceEntry(
  ref: { current: VoiceRecognizer | null },
  listening: boolean,
  onResult: (sessionText: string) => void,
  onState: (active: boolean) => void,
) {
  if (listening) {
    ref.current?.stop();
    ref.current = null;
    onState(false);
    return;
  }
  const voiceWindow = window as VoiceWindow,
    Recognizer = voiceWindow.SpeechRecognition || voiceWindow.webkitSpeechRecognition;
  if (!Recognizer) {
    onState(false);
    return;
  }
  let committed = "";
  const recognition = new Recognizer();
  ref.current = recognition;
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";
  recognition.onstart = () => onState(true);
  recognition.onend = () => {
    ref.current = null;
    onState(false);
  };
  recognition.onerror = () => {
    ref.current = null;
    onState(false);
  };
  recognition.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const words = event.results[i]?.[0]?.transcript || "";
      if (event.results[i]?.isFinal) committed += `${words} `;
      else interim += words;
    }
    onResult(`${committed}${interim}`.trim());
  };
  recognition.start();
}
export default function App() {
  const [showLogin, setShowLogin] = useState(true);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<PatientId>("margaret");
  const [databasePatientId, setDatabasePatientId] = useState<string | null>(null);
  const [recordCarePlanApplied, setRecordCarePlanApplied] = useState(false);
  const [appliedMedications, setAppliedMedications] = useState<MedicationDraft[]>([]);
  const chatVoiceRef = useRef<VoiceRecognizer | null>(null);
  const [role, setRole] = useState<"patient" | "parent" | null>(null);
  const [carePage, setCarePage] = useState<"main" | "records" | "note" | "mealplan">("main"),
    [recordFiles, setRecordFiles] = useState<UploadedRecord[]>([]),
    [noteTitle, setNoteTitle] = useState(""),
    [noteBody, setNoteBody] = useState(""),
    [noteSaved, setNoteSaved] = useState(false);
  const [tab, setTab] = useState<Tab>("home"),
    [slide, setSlide] = useState(0),
    [text, setText] = useState(""),
    [taken, setTaken] = useState(false),
    [uploaded, setUploaded] = useState(false),
    [bedTime, setBedTime] = useState("21:30"),
    [sleepReminder, setSleepReminder] = useState(true),
    [chatListening, setChatListening] = useState(false),
    [historyMode, setHistoryMode] = useState<"calendar" | "diary">("calendar"),
    [diaryPage, setDiaryPage] = useState(0),
    [selectedHistoryDay, setSelectedHistoryDay] = useState(29);
  const [messages, setMessages] = useState([
    { who: "ai", text: "Hi Maya. I’m here with you. How are your mind and body feeling today?" },
  ]);
  const recordContent = useMemo(
      () =>
        recordFiles
          .map((file) => file.content)
          .filter(Boolean)
          .join("\n\n"),
      [recordFiles],
    ),
    recordName = recordFiles.at(-1)?.name || "";
  const date = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(
        new Date(),
      ),
    [],
  );
  useEffect(() => {
    getSession()
      .then((session) => {
        if (session?.user.id) {
          setAuthUserId(session.user.id);
          setShowLogin(false);
        }
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!authUserId) return;
    listMyPatients()
      .then((links) => {
        const first = links?.[0] as any;
        const subject = Array.isArray(first?.patients) ? first.patients[0] : first?.patients;
        if (!subject?.id) return;
        setDatabasePatientId(subject.id);
        const normalized = String(subject.display_name || "").toLowerCase();
        if (normalized.includes("noah")) setPatientId("noah");
        else if (normalized.includes("margaret")) setPatientId("margaret");
      })
      .catch(() => {});
    loadLatestJournal(authUserId)
      .then((entry) => {
        if (entry) {
          setNoteTitle(entry.title);
          setNoteBody(entry.body);
          setNoteSaved(true);
        }
      })
      .catch(() => {});
  }, [authUserId]);
  function send() {
    if (!text.trim()) return;
    const content = text.trim();
    setMessages((m) => [
      ...m,
      { who: "you", text: content },
      { who: "ai", text: replies[m.length % replies.length] },
    ]);
    setText("");
    if (authUserId) saveCheckIn(authUserId, content).catch(() => {});
  }
  if (showLogin)
    return (
      <LoginPage
        onContinue={(userId, selectedPatientId, selectedDatabasePatientId) => {
          setAuthUserId(userId || null);
          if (selectedPatientId) setPatientId(selectedPatientId);
          if (selectedDatabasePatientId) setDatabasePatientId(selectedDatabasePatientId);
          setShowLogin(false);
        }}
      />
    );
  return <CognitiveCareApp key={`${patientId}-${databasePatientId}`} patientId={patientId} databasePatientId={databasePatientId} />;
  if (!role) return <RolePicker onChoose={setRole} />;
  if (role === "parent") return <ParentApp onSwitch={() => setRole(null)} />;
  return (
    <div className="stage">
      <main className="phone">
        <header>
          {tab === "care" && carePage !== "main" ? (
            <button className="back-button" onClick={() => setCarePage("main")}>
              ‹ <span>My Care</span>
            </button>
          ) : (
            <button className="brand" onClick={() => setRole(null)}>
              <i>
                <Icon name="heart" size={19} />
              </i>
              Luma
            </button>
          )}
          <button className="switch-role" onClick={() => setRole(null)}>
            Switch view
          </button>
        </header>
        <div className="page" key={`${tab}-${carePage}`}>
          {tab === "home" && (
            <>
              <section className="welcome">
                <small>{date}</small>
                <h1>Good morning, Maya</h1>
                <p>Let’s take today one gentle step at a time.</p>
              </section>
              <article className={`progress s${slide}`}>
                <small>YOUR JOURNEY</small>
                <strong>{slides[slide][0]}</strong>
                <h2>{slides[slide][1]}</h2>
                <p>{slides[slide][2]}</p>
                <div className="dots">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      className={i === slide ? "on" : ""}
                      onClick={() => setSlide(i)}
                      aria-label={`Progress card ${i + 1}`}
                    />
                  ))}
                </div>
              </article>
              <Title
                over="DAILY CHECK-IN"
                title="A safe space to share"
                end={
                  <span className="private">
                    <Icon name="shield" size={13} />
                    Private
                  </span>
                }
              />
              <article className="chat">
                <div className="messages">
                  {messages.map((m, i) => (
                    <div className={`message ${m.who}`} key={i}>
                      <i>{m.who === "ai" ? "✦" : "M"}</i>
                      <p>{m.text}</p>
                    </div>
                  ))}
                </div>
                <div className="chips">
                  {["My sleep", "I feel anxious", "A small win"].map((x) => (
                    <button key={x} onClick={() => setText(x)}>
                      {x}
                    </button>
                  ))}
                </div>
                <div className="composer">
                  <button>
                    <Icon name="plus" size={18} />
                  </button>
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder={chatListening ? "Listening…" : "Share what’s on your mind…"}
                  />
                  <button
                    className={`voice-button ${chatListening ? "listening" : ""}`}
                    onClick={() => {
                      const beforeVoice = text;
                      toggleVoiceEntry(
                        chatVoiceRef,
                        chatListening,
                        (sessionText) =>
                          setText(`${beforeVoice}${beforeVoice ? " " : ""}${sessionText}`),
                        setChatListening,
                      );
                    }}
                    aria-label={chatListening ? "Stop voice check-in" : "Start voice check-in"}
                  >
                    <Icon name="mic" size={17} />
                  </button>
                  <button className="send" onClick={send}>
                    <Icon name="send" size={17} />
                  </button>
                </div>
                <small className="note">
                  {chatListening
                    ? "Live transcription is appearing as you speak — tap the red microphone to stop."
                    : "Luma supports your care — it does not replace a healthcare professional."}
                </small>
              </article>
            </>
          )}
          {tab === "care" && carePage === "main" && (
            <>
              <Hero
                over="MY CARE"
                title="Your care, made simpler"
                sub="Keep your health information and daily routines together."
              />
              <button
                className={`upload ${uploaded ? "done" : ""}`}
                onClick={() => setCarePage("records")}
              >
                <Badge type="lav" icon={uploaded ? "check" : "file"} />
                <span>
                  <b>{uploaded ? "Medical records" : "Add a medical record"}</b>
                  <small>
                    {recordCarePlanApplied
                      ? "Record-informed care plan applied • Review anytime"
                      : uploaded
                        ? `${recordFiles.length} document${recordFiles.length === 1 ? "" : "s"} • Ready to review`
                        : "PDF, DOC, or DOCX document"}
                  </small>
                </span>
                <Icon name="chevron" size={18} />
              </button>
              <Title
                over="TODAY"
                title="Your routine"
                end={
                  <small>
                    {recordCarePlanApplied
                      ? `${appliedMedications.length} medications from record`
                      : "2 of 4 complete"}
                  </small>
                }
              />
              <div className="routines">
                {recordCarePlanApplied ? (
                  appliedMedications.map((medication, index) => (
                    <Routine
                      key={medication.name}
                      icon="pill"
                      type={["rose", "lav", "gold", "green"][index % 4]}
                      title={medication.name}
                      sub={`${medication.details}${medication.action ? ` • ${medication.action}` : ""} • Confirm with prescriber`}
                      end={
                        index === 0 ? (
                          <button
                            className={`check ${taken ? "on" : ""}`}
                            onClick={() => setTaken(!taken)}
                          >
                            {taken && <Icon name="check" size={14} />}
                          </button>
                        ) : (
                          <em>Review</em>
                        )
                      }
                    />
                  ))
                ) : (
                  <Routine
                    icon="pill"
                    type="rose"
                    title="Mood stabilizer"
                    sub="As prescribed • 9:00 AM"
                    end={
                      <button
                        className={`check ${taken ? "on" : ""}`}
                        onClick={() => setTaken(!taken)}
                      >
                        {taken && <Icon name="check" size={14} />}
                      </button>
                    }
                  />
                )}
                <Routine
                  icon="sleep"
                  type="blue"
                  title="Sleep"
                  sub={
                    recordCarePlanApplied
                      ? "7h 32m • Target 7–9 hours with consistent timing"
                      : "7h 32m last night"
                  }
                  end={
                    <button
                      className={`reminder-toggle ${sleepReminder ? "on" : ""}`}
                      onClick={() => setSleepReminder(!sleepReminder)}
                    >
                      <i />
                    </button>
                  }
                  extra={
                    <div className="bedtime-row">
                      <span>
                        {recordCarePlanApplied ? "Consistent bedtime reminder" : "Bedtime reminder"}
                      </span>
                      <input
                        aria-label="Bedtime reminder"
                        type="time"
                        value={bedTime}
                        onChange={(e) => setBedTime(e.target.value)}
                      />
                      <small>{sleepReminder ? "On" : "Off"}</small>
                    </div>
                  }
                />
                <Routine
                  icon="walk"
                  type="green"
                  title="Movement"
                  sub="2,840 steps today"
                  end={<em>57%</em>}
                  extra={
                    <div className="movement-progress">
                      <div>
                        <span style={{ width: "56.8%" }} />
                      </div>
                      <small>
                        <b>2,840</b> current <i>Daily target: 5,000</i>
                      </small>
                    </div>
                  }
                />
                <Routine
                  icon="plus"
                  type="gold"
                  title="Add a note"
                  sub="Mood, symptoms, or anything else"
                  end={
                    <button
                      className="row-link"
                      onClick={() => setCarePage("note")}
                      aria-label="Open journal"
                    >
                      <Icon name="chevron" size={17} />
                    </button>
                  }
                />
              </div>
              {recordCarePlanApplied && (
                <section className="record-guidance">
                  <small>FROM YOUR RECORD SET</small>
                  <h2>Food & monitoring guidance</h2>
                  <article>
                    <Icon name="food" size={19} />
                    <span>
                      <b>Keep salt and fluids steady</b>
                      <small>
                        The lithium guidance warns against sudden sodium changes and dehydration.
                        Confirm personal fluid targets with the care team.
                      </small>
                    </span>
                  </article>
                  <article>
                    <Icon name="moon" size={19} />
                    <span>
                      <b>Keep caffeine consistent and limited</b>
                      <small>
                        The patient order restricts caffeine; the checklist warns against abrupt
                        caffeine changes with lithium.
                      </small>
                    </span>
                  </article>
                  <article>
                    <Icon name="shield" size={19} />
                    <span>
                      <b>Monitoring reminders</b>
                      <small>
                        Lithium level, kidney and thyroid checks, plus metabolic monitoring for
                        olanzapine, require clinician scheduling.
                      </small>
                    </span>
                  </article>
                </section>
              )}
              <article className="recipe">
                <div>
                  <small>
                    {recordCarePlanApplied ? "RECORD-INFORMED 7-DAY PLAN" : "RECIPE FOR YOU"}
                  </small>
                  <h2>
                    {recordCarePlanApplied
                      ? "A full week of Mediterranean meals"
                      : "Warm salmon & quinoa bowl"}
                  </h2>
                  <p>
                    {recordCarePlanApplied
                      ? "Breakfast, lunch, dinner, snacks, shopping list, and weekend prep—built around the uploaded record set."
                      : "Balanced, simple, and selected around your preferences."}
                  </p>
                  <button onClick={() => recordCarePlanApplied && setCarePage("mealplan")}>
                    {recordCarePlanApplied ? "Open 7-day meal plan" : "View recipe"} →
                  </button>
                </div>
                <i>
                  <Icon name="food" size={40} />
                </i>
              </article>
              <p className="warning">
                <Icon name="shield" size={15} /> Record-derived medications, food guidance, and
                monitoring reminders are drafts and must be confirmed with the clinician or
                pharmacist.
              </p>
            </>
          )}
          {tab === "care" && carePage === "records" && (
            <MedicalRecords
              records={recordFiles}
              recordContent={recordContent}
              applied={recordCarePlanApplied}
              onApply={(plan) => {
                setAppliedMedications(plan);
                setRecordCarePlanApplied(true);
              }}
              onDemo={() => {
                setRecordFiles([
                  { name: "01_synthetic_patient_record_EN.md", content: syntheticBipolarRecord },
                  {
                    name: "02_patient_caregiver_checklist_EN.md",
                    content: syntheticBipolarChecklist,
                  },
                  {
                    name: "03_pharmacotherapy_summary_EN.md",
                    content: syntheticBipolarPharmacotherapy,
                  },
                ]);
                setUploaded(true);
                setRecordCarePlanApplied(false);
                setAppliedMedications([]);
              }}
              onFile={async (file) => {
                const content = /\.(md|txt)$/i.test(file.name) ? await file.text() : "";
                setRecordFiles((files) =>
                  files.length >= 3 ? files : [...files, { name: file.name, content }],
                );
                setUploaded(true);
                setRecordCarePlanApplied(false);
                setAppliedMedications([]);
                if (authUserId) saveMedicalRecordMetadata(authUserId, file).catch(() => {});
              }}
            />
          )}
          {tab === "care" && carePage === "mealplan" && <WeeklyMealPlan />}
          {tab === "care" && carePage === "note" && (
            <Journal
              title={noteTitle}
              body={noteBody}
              saved={noteSaved}
              onTitle={(value) => {
                setNoteTitle(value);
                setNoteSaved(false);
              }}
              onBody={(value) => {
                setNoteBody(value);
                setNoteSaved(false);
              }}
              onSave={() => {
                setNoteSaved(true);
                if (authUserId)
                  saveJournal(authUserId, noteTitle, noteBody).catch(() => setNoteSaved(false));
              }}
            />
          )}
          {tab === "history" && (
            <>
              {historyMode === "calendar" ? (
                <>
                  <Hero
                    over="MOOD & ROUTINE HISTORY"
                    title="Your days, in context"
                    sub="Select a calendar day to review mood, sleep, movement, medication, and notes."
                  />
                  <BipolarCalendar
                    selectedDay={selectedHistoryDay}
                    onSelect={setSelectedHistoryDay}
                    noteBody={noteBody}
                    messages={messages}
                    onOpenDiary={(day) => {
                      setDiaryPage(day >= 27 ? 2 : 0);
                      setHistoryMode("diary");
                    }}
                  />
                </>
              ) : (
                <BipolarDiary
                  noteBody={noteBody}
                  page={diaryPage}
                  onPage={setDiaryPage}
                  onBack={() => setHistoryMode("calendar")}
                />
              )}
            </>
          )}
          {tab === "profile" && (
            <>
              <section className="profile">
                <div>M</div>
                <h1>Maya Chen</h1>
                <p>Taking care, one day at a time</p>
                <small>Member since May 2026</small>
              </section>
              <div className="stats">
                <span>
                  <b>10</b>
                  <small>day streak</small>
                </span>
                <span>
                  <b>24</b>
                  <small>check-ins</small>
                </span>
                <span>
                  <b>8</b>
                  <small>small wins</small>
                </span>
              </div>
              <Title over="CARE & SUPPORT" title="" />
              <div className="settings">
                <Setting
                  icon="heart"
                  type="rose"
                  title="My care team"
                  sub="Dr. Ahmed and 2 supporters"
                />
                <Setting
                  icon="shield"
                  type="blue"
                  title="Safety plan"
                  sub="People and steps that help"
                />
              </div>
              <Title over="PREFERENCES" title="" />
              <div className="settings">
                <Setting icon="moon" type="lav" title="Appearance" sub="System settings" />
                <Setting
                  icon="shield"
                  type="green"
                  title="Privacy & data"
                  sub="Manage what you share"
                />
              </div>
              <button className="urgent">
                Need urgent help? <b>View crisis resources →</b>
              </button>
            </>
          )}
        </div>
        {carePage === "main" && (
          <nav>
            {(
              [
                ["home", "Home"],
                ["care", "My Care"],
                ["history", "History"],
                ["profile", "Profile"],
              ] as [Tab, string][]
            ).map(([id, label]) => (
              <button
                className={tab === id ? "active" : ""}
                onClick={() => {
                  setTab(id);
                  setCarePage("main");
                  if (id === "history") setHistoryMode("calendar");
                }}
                key={id}
              >
                <i>
                  <Icon name={id} />
                </i>
                {label}
              </button>
            ))}
          </nav>
        )}
      </main>
    </div>
  );
}
function Hero({ over, title, sub }: { over: string; title: string; sub: string }) {
  return (
    <section className="hero">
      <small>{over}</small>
      <h1>{title}</h1>
      <p>{sub}</p>
    </section>
  );
}
function Title({ over, title, end }: { over: string; title: string; end?: React.ReactNode }) {
  return (
    <div className="title">
      <span>
        <small>{over}</small>
        {title && <h2>{title}</h2>}
      </span>
      {end}
    </div>
  );
}
function Badge({ type, icon }: { type: string; icon: IconName }) {
  return (
    <i className={`badge ${type}`}>
      <Icon name={icon} />
    </i>
  );
}
function Routine({
  icon,
  type,
  title,
  sub,
  end,
  extra,
}: {
  icon: IconName;
  type: string;
  title: string;
  sub: string;
  end: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <div className={`routine ${extra ? "expanded" : ""}`}>
      <div className="routine-main">
        <Badge icon={icon} type={type} />
        <span>
          <b>{title}</b>
          <small>{sub}</small>
        </span>
        {end}
      </div>
      {extra}
    </div>
  );
}
function Setting(p: { icon: IconName; type: string; title: string; sub: string }) {
  return (
    <button>
      <Badge icon={p.icon} type={p.type} />
      <span>
        <b>{p.title}</b>
        <small>{p.sub}</small>
      </span>
      <Icon name="chevron" size={17} />
    </button>
  );
}
function Day({
  day,
  mood,
  cls,
  title,
  body,
}: {
  day: string;
  mood: string;
  cls: string;
  title: string;
  body: string;
}) {
  return (
    <article>
      <div className="date">
        <b>{day}</b>
        <small>AUG</small>
      </div>
      <div>
        <span className={`mood ${cls}`}>{mood}</span>
        <h3>{title}</h3>
        <p>{body}</p>
        <small>3 notes • 6 min chat</small>
      </div>
    </article>
  );
}

function LoginPage({
  onContinue,
}: {
  onContinue: (userId?: string, patientId?: PatientId, databasePatientId?: string) => void;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signin"),
    [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [invitationCode, setInvitationCode] = useState(""),
    [showPassword, setShowPassword] = useState(false),
    [error, setError] = useState(""),
    [working, setWorking] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if ((mode === "signup" || invitationCode.trim()) && !name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }
    if (!isSupabaseConfigured) {
      setError(
        "Connect a Supabase project before using real accounts. You can still open the demo below.",
      );
      return;
    }
    setWorking(true);
    setError("");
    try {
      const session =
        mode === "signin"
          ? await signIn(email, password)
          : await signUp(name.trim(), email, password);
      if (session) {
        const claimedPatientId = invitationCode.trim()
          ? await claimPatientInvitation(name.trim(), invitationCode.trim())
          : undefined;
        const normalizedName = name.trim().toLowerCase();
        const selectedPatient = normalizedName.includes("noah")
          ? "noah"
          : normalizedName.includes("margaret")
            ? "margaret"
            : undefined;
        onContinue(session.user.id, selectedPatient, claimedPatientId);
      }
      else setError("Check your email to confirm your account, then sign in.");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to authenticate. Please try again.",
      );
    } finally {
      setWorking(false);
    }
  }
  function switchMode(next: "signin" | "signup") {
    setMode(next);
    setError("");
  }
  return (
    <div className="auth-stage">
      <main className="auth-card">
        <section className="auth-welcome">
          <div className="auth-brand">
            <i>
              <Icon name="heart" size={22} />
            </i>
            <span>Luma</span>
          </div>
          <div className="auth-message">
            <span>✦</span>
            <small>YOUR GENTLE HEALTH COMPANION</small>
            <h1>
              Care begins with
              <br />
              being heard.
            </h1>
            <p>A private place to reflect, notice patterns, and stay connected to everyday care.</p>
          </div>
          <div className="auth-preview">
            <div>
              <Icon name="moon" size={19} />
              <span>
                <small>REST</small>
                <b>7h 32m</b>
              </span>
            </div>
            <div>
              <Icon name="walk" size={19} />
              <span>
                <small>MOVEMENT</small>
                <b>2,840 steps</b>
              </span>
            </div>
            <div>
              <Icon name="heart" size={19} />
              <span>
                <small>TODAY</small>
                <b>Near baseline</b>
              </span>
            </div>
          </div>
          <p className="auth-quote">“One gentle check-in at a time.”</p>
        </section>
        <section className="auth-form-panel">
          <div className="auth-mobile-brand">
            <i>
              <Icon name="heart" size={18} />
            </i>
            Luma
          </div>
          <div className="auth-heading">
            <small>WELCOME {mode === "signin" ? "BACK" : "TO LUMA"}</small>
            <h2>{mode === "signin" ? "Sign in to continue" : "Create your account"}</h2>
            <p>
              {mode === "signin"
                ? "Your daily care space is ready for you."
                : "Start building a clearer picture of each day."}
            </p>
          </div>
          <div className="auth-tabs">
            <button
              className={mode === "signin" ? "active" : ""}
              onClick={() => switchMode("signin")}
            >
              Sign in
            </button>
            <button
              className={mode === "signup" ? "active" : ""}
              onClick={() => switchMode("signup")}
            >
              Create account
            </button>
          </div>
          <form onSubmit={submit}>
            {(mode === "signup" || invitationCode) && (
              <label>
                <span>Your name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Maya Chen"
                  autoComplete="name"
                />
              </label>
            )}
            <label>
              <span>Clinician invitation code <small>(optional)</small></span>
              <input
                value={invitationCode}
                onChange={(event) => setInvitationCode(event.target.value.toUpperCase())}
                placeholder="Example: A1B2C3D4"
                autoComplete="one-time-code"
              />
            </label>
            <label>
              <span>Email address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>
            <label>
              <span>
                Password {mode === "signin" && <button type="button">Forgot password?</button>}
              </span>
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>
            {error && <p className="auth-error">{error}</p>}
            <button className="auth-submit" type="submit" disabled={working}>
              {working ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}{" "}
              {!working && <span>→</span>}
            </button>
          </form>
          <div className="auth-divider">
            <span>choose a separated patient demo</span>
          </div>
          <div className="patient-demo-list">
            <button
              className="demo-login patient-demo"
              onClick={() => onContinue(undefined, "margaret")}
            >
              <span className="demo-avatar">M</span>
              <span>
                <b>{patients.margaret.name}</b>
                <small>Late-stage Alzheimer’s disease</small>
                <em>Private 14-day demo history available</em>
              </span>
              <strong>→</strong>
            </button>
            <button
              className="demo-login patient-demo"
              onClick={() => onContinue(undefined, "noah")}
            >
              <span className="demo-avatar">N</span>
              <span>
                <b>{patients.noah.name}</b>
                <small>Autism • very substantial support needs</small>
                <em>Separate 14-day demo history available</em>
              </span>
              <strong>→</strong>
            </button>
          </div>
          <p className="auth-privacy">
            <Icon name="shield" size={13} />
            {isSupabaseConfigured
              ? "Real accounts use your configured Supabase project."
              : "Each demo has isolated browser-session data. Database setup is required for permanent accounts."}
          </p>
        </section>
      </main>
    </div>
  );
}

function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <div className="landing">
      <header className="landing-nav">
        <button className="landing-brand">
          <i>
            <Icon name="heart" size={20} />
          </i>
          <span>Luma</span>
        </button>
        <div>
          <a href="#features">Features</a>
          <a href="#care">How it works</a>
          <button onClick={onStart}>Open demo</button>
        </div>
      </header>
      <main>
        <section className="landing-hero">
          <div className="hero-copy">
            <span className="landing-kicker">
              <i>✦</i> A gentler way to understand each day
            </span>
            <h1>
              Care for your mind.
              <br />
              <em>Together.</em>
            </h1>
            <p>
              Luma helps people living with bipolar disorder and their caregivers notice patterns,
              support daily routines, and prepare clearer conversations with the care team.
            </p>
            <div className="hero-actions">
              <button onClick={onStart}>
                Explore the demo <span>→</span>
              </button>
              <a href="#features">See what Luma does</a>
            </div>
            <div className="trust-row">
              <span>
                <Icon name="shield" size={15} />
                Privacy-minded
              </span>
              <span>
                <Icon name="heart" size={15} />
                Supportive by design
              </span>
              <span>
                <Icon name="sparkle" size={15} />
                Pattern-aware
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="landing-orb one" />
            <div className="landing-orb two" />
            <div className="preview-phone">
              <div className="preview-top">
                <b>
                  <i>
                    <Icon name="heart" size={13} />
                  </i>
                  Luma
                </b>
                <span>•••</span>
              </div>
              <div className="preview-body">
                <small>SATURDAY, AUGUST 29</small>
                <h2>Good morning, Maya</h2>
                <article>
                  <small>YOUR JOURNEY</small>
                  <strong>10 days</strong>
                  <h3>You kept showing up</h3>
                  <p>
                    Ten days of checking in with yourself. That consistency is worth celebrating.
                  </p>
                </article>
                <div className="preview-chat">
                  <span>✦</span>
                  <p>How are your mind and body feeling today?</p>
                </div>
                <div className="preview-nav">
                  <i className="active">
                    <Icon name="home" size={16} />
                  </i>
                  <i>
                    <Icon name="care" size={16} />
                  </i>
                  <i>
                    <Icon name="history" size={16} />
                  </i>
                  <i>
                    <Icon name="profile" size={16} />
                  </i>
                </div>
              </div>
            </div>
            <div className="floating-card sleep-float">
              <Icon name="sleep" size={18} />
              <span>
                <small>LAST NIGHT</small>
                <b>7h 32m</b>
              </span>
            </div>
            <div className="floating-card mood-float">
              <i>●</i>
              <span>
                <small>TODAY</small>
                <b>Near baseline</b>
              </span>
            </div>
          </div>
        </section>
        <section className="landing-intro" id="features">
          <small>ONE COMPANION, TWO PERSPECTIVES</small>
          <h2>
            Built for the person living it
            <br />
            and the people supporting them.
          </h2>
          <div className="audience-grid">
            <article>
              <span className="audience-icon patient">
                <Icon name="profile" size={25} />
              </span>
              <div>
                <small>PATIENT EXPERIENCE</small>
                <h3>A private space to reflect</h3>
                <p>
                  Share how the day feels, keep routines together, dictate journal notes, and look
                  back on meaningful patterns.
                </p>
                <ul>
                  <li>
                    <Icon name="check" size={13} />
                    Supportive daily check-ins
                  </li>
                  <li>
                    <Icon name="check" size={13} />
                    Medication, sleep, and movement
                  </li>
                  <li>
                    <Icon name="check" size={13} />
                    Mood calendar and private diary
                  </li>
                </ul>
              </div>
            </article>
            <article>
              <span className="audience-icon caregiver">
                <Icon name="heart" size={25} />
              </span>
              <div>
                <small>CAREGIVER EXPERIENCE</small>
                <h3>Observe with more context</h3>
                <p>
                  Record changes relative to a child’s usual baseline and bring organized
                  observations to the care team.
                </p>
                <ul>
                  <li>
                    <Icon name="check" size={13} />
                    Condition-specific observations
                  </li>
                  <li>
                    <Icon name="check" size={13} />
                    Gentle symptom scaling
                  </li>
                  <li>
                    <Icon name="check" size={13} />
                    Baseline-aware summaries
                  </li>
                </ul>
              </div>
            </article>
          </div>
        </section>
        <section className="landing-care" id="care">
          <div>
            <small>FROM MOMENTS TO PATTERNS</small>
            <h2>
              Everyday care,
              <br />
              made easier to see.
            </h2>
            <p>
              Luma brings scattered details into one calm, understandable view—without reducing a
              person to a score.
            </p>
            <button onClick={onStart}>Choose your experience →</button>
          </div>
          <div className="care-steps">
            <article>
              <b>01</b>
              <span>
                <h3>Check in</h3>
                <p>Write, speak, or choose a gentle prompt.</p>
              </span>
            </article>
            <article>
              <b>02</b>
              <span>
                <h3>Record the day</h3>
                <p>Track sleep, movement, medication, and notes.</p>
              </span>
            </article>
            <article>
              <b>03</b>
              <span>
                <h3>Notice change</h3>
                <p>Review patterns against the person’s usual baseline.</p>
              </span>
            </article>
          </div>
        </section>
        <section className="landing-safety">
          <Icon name="shield" size={28} />
          <div>
            <small>DESIGNED WITH CARE</small>
            <h2>Supportive—not diagnostic.</h2>
            <p>
              Luma helps organize personal observations and prepare conversations. It does not
              diagnose, predict mood episodes, or replace a qualified healthcare professional.
            </p>
          </div>
        </section>
        <section className="landing-cta">
          <span>✦</span>
          <h2>Start with one gentle check-in.</h2>
          <p>Explore the patient and caregiver demo experiences.</p>
          <button onClick={onStart}>Open Luma demo →</button>
        </section>
      </main>
      <footer>
        <button className="landing-brand">
          <i>
            <Icon name="heart" size={16} />
          </i>
          <span>Luma</span>
        </button>
        <p>Hackathon prototype • Synthetic demonstration data only</p>
      </footer>
    </div>
  );
}

const weeklyMeals = [
  {
    day: "MON",
    focus: "Steady start",
    breakfast: "¾ cup plain Greek yogurt, ½ cup berries, ¼ cup oats, 1 tbsp walnuts",
    lunch: "1½ cups lentil-vegetable soup, whole-grain pita, cucumber salad",
    dinner: "4 oz baked salmon, ¾ cup cooked quinoa, 1½ cups roasted broccoli and peppers",
    snack: "1 medium apple with 1 tbsp peanut butter",
    prep: "Bake salmon at 400°F for 12–15 min; roast vegetables for 22 min. Use the patient’s usual, clinician-approved amount of salt.",
  },
  {
    day: "TUE",
    focus: "Fiber & color",
    breakfast: "2-egg spinach and tomato omelet, 1 slice whole-grain toast, 1 orange",
    lunch: "Salmon-quinoa leftovers over 2 cups mixed greens with olive oil and lemon",
    dinner: "1¼ cups chickpea tomato stew, ½ cup brown rice, steamed green beans",
    snack: "¾ cup grapes and 12 unsalted almonds",
    prep: "Simmer chickpeas, crushed tomato, carrot, and spinach for 20 min. Portion half for Thursday lunch.",
  },
  {
    day: "WED",
    focus: "Simple rhythm",
    breakfast: "½ cup dry oats cooked with milk, ½ banana, cinnamon, 1 tbsp chia seeds",
    lunch: "Whole-grain wrap with 3 oz turkey, avocado, lettuce, tomato; side carrots",
    dinner: "4 oz lemon-herb chicken, ¾ cup farro, 1½ cups zucchini and eggplant",
    snack: "¾ cup plain yogurt with sliced pear",
    prep: "Roast chicken and vegetables together at 425°F for 22–25 min; cook two farro portions.",
  },
  {
    day: "THU",
    focus: "Plant-forward",
    breakfast: "1 slice whole-grain toast, ½ avocado, 1 boiled egg, 1 kiwi",
    lunch: "Leftover chickpea stew, ½ cup brown rice, side greens",
    dinner:
      "Whole-wheat pasta: 1½ cups cooked pasta, ¾ cup tomato-lentil sauce, spinach, 1 tbsp parmesan",
    snack: "1 cup bell-pepper strips with ¼ cup hummus",
    prep: "Cook lentils in tomato sauce for 20 min; fold in spinach during the final 2 min.",
  },
  {
    day: "FRI",
    focus: "Omega-3 meal",
    breakfast: "¾ cup cottage cheese, ½ cup pineapple, 2 tbsp pumpkin seeds",
    lunch: "Mediterranean bowl: ¾ cup farro, ½ cup chickpeas, cucumber, tomato, olives, greens",
    dinner: "4 oz baked trout, 1 medium sweet potato, 1½ cups asparagus",
    snack: "Air-popped popcorn, 3 cups, prepared with the usual consistent seasoning",
    prep: "Bake trout at 400°F for 12 min; roast halved sweet potato for 30–35 min.",
  },
  {
    day: "SAT",
    focus: "Low-effort weekend",
    breakfast: "Smoothie: 1 cup milk, ½ banana, ½ cup berries, ¼ cup oats, 1 tbsp nut butter",
    lunch: "Tomato-white bean toast: ¾ cup beans over 2 slices whole-grain toast; side salad",
    dinner:
      "Chicken vegetable sheet pan: 4 oz chicken, 2 cups peppers/onion/zucchini, ¾ cup couscous",
    snack: "1 peach and a small handful of walnuts",
    prep: "Roast chicken and vegetables at 425°F for 22–25 min; make two servings for Sunday lunch.",
  },
  {
    day: "SUN",
    focus: "Prep & reset",
    breakfast: "2 scrambled eggs, sautéed spinach, 1 slice whole-grain toast, berries",
    lunch: "Leftover chicken-couscous bowl with greens and lemon-olive-oil dressing",
    dinner: "1½ cups vegetable and bean minestrone, whole-grain roll, tomato-cucumber salad",
    snack: "¾ cup plain yogurt with 1 tbsp walnuts",
    prep: "Make 4 soup portions; refrigerate two for early next week and freeze two. Prepare Monday oats and chop vegetables.",
  },
];
function WeeklyMealPlan() {
  const [day, setDay] = useState(0),
    meal = weeklyMeals[day];
  return (
    <section className="meal-plan-page">
      <Hero
        over="RECORD-INFORMED NUTRITION"
        title="Your 7-day meal plan"
        sub="A detailed Mediterranean-style draft built from the synthetic record set."
      />
      <div className="meal-safety">
        <Icon name="shield" size={18} />
        <p>
          <b>Lithium consistency note</b>Keep the patient’s usual salt, fluid, and caffeine pattern
          steady. Do not begin a low-sodium diet or change fluid intake without the prescriber’s
          guidance.
        </p>
      </div>
      <div className="meal-days">
        {weeklyMeals.map((item, index) => (
          <button
            key={item.day}
            className={day === index ? "active" : ""}
            onClick={() => setDay(index)}
          >
            <b>{item.day}</b>
            <small>{index + 1}</small>
          </button>
        ))}
      </div>
      <article className="day-menu">
        <div className="day-menu-head">
          <span>DAY {day + 1}</span>
          <h2>
            {meal.day} • {meal.focus}
          </h2>
        </div>
        <MealRow label="Breakfast" time="8:00 AM" text={meal.breakfast} />
        <MealRow label="Lunch" time="12:30 PM" text={meal.lunch} />
        <MealRow label="Snack" time="3:30 PM" text={meal.snack} />
        <MealRow label="Dinner" time="6:30 PM" text={meal.dinner} />
        <div className="meal-prep">
          <b>How to prepare</b>
          <p>{meal.prep}</p>
        </div>
      </article>
      <section className="weekly-prep">
        <small>SHOP ONCE • PREP ONCE</small>
        <h2>One-week shopping list</h2>
        <div>
          <span>
            <b>Produce</b>
            <small>
              Berries, bananas, apples, orange, kiwi, pear, peach, avocado, lemons, spinach, mixed
              greens, tomatoes, cucumbers, carrots, peppers, broccoli, zucchini, eggplant, green
              beans, asparagus, sweet potatoes, onions
            </small>
          </span>
          <span>
            <b>Proteins</b>
            <small>
              Salmon, trout, chicken breast, sliced turkey, eggs, Greek yogurt, cottage cheese,
              chickpeas, lentils, white beans
            </small>
          </span>
          <span>
            <b>Pantry</b>
            <small>
              Oats, quinoa, brown rice, farro, couscous, whole-wheat pasta, whole-grain bread and
              pita, tomatoes, olive oil, walnuts, almonds, chia, pumpkin seeds, peanut butter
            </small>
          </span>
        </div>
      </section>
      <section className="prep-timeline">
        <small>60-MINUTE WEEKEND PREP</small>
        <ol>
          <li>
            <b>0–15 min</b>Cook quinoa/farro; wash and chop vegetables.
          </li>
          <li>
            <b>15–40 min</b>Roast two trays of vegetables and chicken; simmer lentil soup.
          </li>
          <li>
            <b>40–55 min</b>Boil eggs, portion nuts and chopped vegetables.
          </li>
          <li>
            <b>55–60 min</b>Label containers by day; refrigerate 3–4 days and freeze later portions.
          </li>
        </ol>
      </section>
      <p className="warning">
        <Icon name="shield" size={15} /> This is a synthetic demo plan, not a prescription. A
        dietitian or prescriber must confirm allergies, calories, fluid needs, sodium pattern,
        kidney considerations, and medication interactions.
      </p>
    </section>
  );
}
function MealRow({ label, time, text }: { label: string; time: string; text: string }) {
  return (
    <div className="meal-row">
      <i>
        <Icon name="food" size={17} />
      </i>
      <span>
        <small>{time}</small>
        <b>{label}</b>
        <p>{text}</p>
      </span>
    </div>
  );
}

function MedicalRecords({
  records,
  recordContent,
  applied,
  onApply,
  onDemo,
  onFile,
}: {
  records: UploadedRecord[];
  recordContent: string;
  applied: boolean;
  onApply: (plan: MedicationDraft[]) => void;
  onDemo: () => void;
  onFile: (file: File) => void;
}) {
  const recordName = records.at(-1)?.name || "";
  const synthetic = /synthetic data notice|entirely fabricated|synthetic patient/i.test(
      recordContent,
    ),
    diagnosis =
      recordContent.match(/Bipolar I disorder[^\n|]*/i)?.[0] || "Condition requires review",
    recordId = recordContent.match(/TEACH-[A-Z]+-\d+/)?.[0] || "Uploaded record",
    medicationPlan = extractMedicationPlan(recordContent);
  return (
    <section className="records-page">
      <Hero
        over="MEDICAL RECORDS"
        title="Keep your records together"
        sub="Add up to three documents for this patient's combined review."
      />
      <button className="synthetic-load" onClick={onDemo}>
        <Icon name="sparkle" size={17} />
        <span>
          <b>Load 3-file bipolar demo</b>
          <small>Patient record, monitoring checklist, and medication reference</small>
        </span>
        <Icon name="chevron" size={17} />
      </button>
      <label className={`upload-zone ${records.length >= 3 ? "limit-reached" : ""}`}>
        <input
          disabled={records.length >= 3}
          type="file"
          accept=".pdf,.doc,.docx,.md,.txt,text/markdown,text/plain,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
          }}
        />
        <i>
          <Icon name="file" size={32} />
          <span>
            <Icon name="plus" size={14} />
          </span>
        </i>
        <h2>
          {records.length >= 3
            ? "Three-file limit reached"
            : records.length
              ? "Add another document"
              : "Upload a document"}
        </h2>
        <p>{records.length}/3 patient files added</p>
        <small>One file at a time • Use synthetic data only • Maximum 10 MB each</small>
      </label>
      {records.length > 0 && (
        <div className="record-file-list">
          {records.map((record, index) => (
            <article className="uploaded-record" key={`${record.name}-${index}`}>
              <Badge type="lav" icon="file" />
              <span>
                <b>{record.name}</b>
                <small>
                  File {index + 1} of {records.length} • Included in combined review
                </small>
              </span>
              <i>
                <Icon name="check" size={17} />
              </i>
            </article>
          ))}
        </div>
      )}
      {recordContent && (
        <>
          <article className="record-preview">
            <div className="record-preview-head">
              <span>
                <Icon name={synthetic ? "check" : "shield"} size={16} />
                {synthetic ? "Synthetic records confirmed" : "Review before using"}
              </span>
              <small>COMBINED PREVIEW</small>
            </div>
            <h2>{recordId}</h2>
            <p>
              <b>Detected condition</b>
              {diagnosis}
            </p>
            <div>
              <span>
                <b>Documents analyzed</b>
                <small>
                  {records.length} patient files •{" "}
                  {recordContent.trim().split(/\s+/).length.toLocaleString()} total words
                </small>
              </span>
              <span>
                <b>Demo status</b>
                <small>
                  {synthetic
                    ? "Synthetic label found in the record set"
                    : "Synthetic status not detected"}
                </small>
              </span>
            </div>
            <small className="preview-warning">
              Patient-specific medication orders are prioritized; general reference material is not
              treated as a prescription.
            </small>
          </article>
          {medicationPlan.length > 0 && (
            <article className="care-plan-review">
              <small>COMBINED RECORD DRAFT</small>
              <h2>Review medication plan</h2>
              <ul>
                {medicationPlan.map((medication) => (
                  <li key={medication.name}>
                    <b>{medication.name}</b>
                    <span>
                      {medication.details}
                      {medication.action ? ` • ${medication.action}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
              <p>
                <Icon name="shield" size={15} />
                The plan changes according to the uploaded patient records. Every extracted item
                requires clinician or pharmacist confirmation.
              </p>
              <button onClick={() => onApply(medicationPlan)} disabled={applied}>
                {applied ? (
                  <>
                    <Icon name="check" size={15} /> Applied to demo My Care
                  </>
                ) : (
                  <>Apply combined draft to demo My Care →</>
                )}
              </button>
            </article>
          )}
        </>
      )}
      <div className="records-info">
        <Icon name="shield" size={17} />
        <p>
          <b>Safe demo mode</b>
          <br />
          The selected files are read only in the current browser session. They are not uploaded to
          a server or retained after refresh.
        </p>
      </div>
    </section>
  );
}

function Journal({
  title,
  body,
  saved,
  onTitle,
  onBody,
  onSave,
}: {
  title: string;
  body: string;
  saved: boolean;
  onTitle: (v: string) => void;
  onBody: (v: string) => void;
  onSave: () => void;
}) {
  const [listening, setListening] = useState(false);
  const journalVoiceRef = useRef<VoiceRecognizer | null>(null);
  const journalBodyRef = useRef(body);
  journalBodyRef.current = body;
  const now = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
  function suggestTitle() {
    const lower = body.toLowerCase(),
      themes: string[] = [];
    if (/anxious|anxiety|worried|worry|stress|panic/.test(lower)) themes.push("Anxiety");
    if (/sleep|tired|fatigue|exhausted|insomnia/.test(lower)) themes.push("Sleep and Energy");
    if (/headache|migraine|pain|ache|sore/.test(lower)) themes.push("Pain");
    if (/sad|low|depress|lonely|down/.test(lower)) themes.push("Low Mood");
    if (/calm|relax|peace|hope|happy|better/.test(lower)) themes.push("Calm and Hope");
    if (/focus|distract|concentrat|memory/.test(lower)) themes.push("Focus");
    if (/dizzy|nausea|seizure|vision/.test(lower)) themes.push("Physical Symptoms");
    const unique = [...new Set(themes)];
    let suggestion = "Today’s Mind and Body Check-In";
    if (unique.length === 1) suggestion = `Reflecting on ${unique[0]}`;
    else if (unique.length > 1) suggestion = `${unique[0]} with ${unique[1]}`;
    onTitle(suggestion);
  }
  return (
    <section className="journal-page">
      <div className="voice-entry">
        <button
          className={listening ? "listening" : ""}
          onClick={() => {
            const beforeVoice = journalBodyRef.current;
            toggleVoiceEntry(
              journalVoiceRef,
              listening,
              (sessionText) => {
                const next = `${beforeVoice}${beforeVoice ? " " : ""}${sessionText}`;
                journalBodyRef.current = next;
                onBody(next);
              },
              setListening,
            );
          }}
          aria-label={listening ? "Stop voice entry" : "Start voice entry"}
        >
          <i>
            <Icon name="mic" size={19} />
          </i>
          <span>
            <b>{listening ? "Stop recording" : "Add a voice entry"}</b>
            <small>
              {listening
                ? "Words appear live as you speak. Tap here when finished."
                : "Your words will be transcribed into this note."}
            </small>
          </span>
          {listening && <em>STOP</em>}
        </button>
      </div>
      <div className="journal-toolbar">
        <span>{saved ? "Saved" : "Editing"}</span>
        <button onClick={onSave} disabled={!title.trim() && !body.trim()}>
          {saved ? (
            <>
              <Icon name="check" size={14} /> Saved
            </>
          ) : (
            "Save note"
          )}
        </button>
      </div>
      <article className="journal-paper">
        <div className="journal-title-row">
          <textarea
            rows={2}
            className="journal-title"
            style={{
              height: `${Math.max(76, Math.min(155, 44 + Math.ceil(Math.max(title.length, 1) / 24) * 29))}px`,
            }}
            aria-label="Note title"
            value={title}
            onChange={(e) => onTitle(e.target.value)}
            placeholder="Title"
          />
          <button onClick={suggestTitle} disabled={!body.trim()}>
            <Icon name="sparkle" size={14} />
            Summarize title
          </button>
        </div>
        <p className="journal-date">{now}</p>
        <textarea
          aria-label="Journal note"
          value={body}
          onChange={(e) => onBody(e.target.value)}
          placeholder="Start writing…&#10;&#10;How are you feeling today? What symptoms did you notice? What would you like to remember?"
        />
        <div className="journal-footer">
          <span>{body.trim() ? body.trim().split(/\s+/).length : 0} words</span>
          <span>Private note</span>
        </div>
      </article>
      <div className="journal-prompts">
        <div className="journal-prompt">
          <small>GENTLE PROMPT</small>
          <p>What is one thing your body or mind is asking for today?</p>
        </div>
        <div className="journal-prompt alt">
          <small>LOOKING BACK</small>
          <p>What felt a little easier today than it did yesterday?</p>
        </div>
        <div className="journal-prompt symptoms">
          <small>NOTICE A PATTERN</small>
          <p>
            Which symptom or feeling changed the most today, and what happened before it changed?
          </p>
        </div>
      </div>
    </section>
  );
}

type DayRecord = {
  mood: string;
  status: "baseline" | "changed" | "review";
  medication: "Taken" | "Missed" | "Pending";
  sleep: string;
  sleepQuality: string;
  exercise: string;
  exerciseQuality: string;
  summary: string;
  note?: string;
};
const augustRecords: Record<number, DayRecord> = {
  24: {
    mood: "Low",
    status: "changed",
    medication: "Taken",
    sleep: "9h 10m",
    sleepQuality: "Long, unrefreshing",
    exercise: "8 min walk",
    exerciseQuality: "Light",
    summary: "Lower energy and longer sleep than the usual pattern. A short walk was completed.",
    note: "I moved slowly today and needed more rest. I tried not to judge myself for having less energy.",
  },
  25: {
    mood: "Balanced",
    status: "baseline",
    medication: "Taken",
    sleep: "7h 45m",
    sleepQuality: "Restful",
    exercise: "28 min walk",
    exerciseQuality: "Steady",
    summary: "Mood, sleep, and activity were close to the recent baseline.",
  },
  26: {
    mood: "Elevated",
    status: "review",
    medication: "Taken",
    sleep: "4h 20m",
    sleepQuality: "Reduced need for sleep",
    exercise: "64 active min",
    exerciseQuality: "Much higher than usual",
    summary:
      "Energy and activity increased while sleep decreased. These changes are worth watching relative to the care plan.",
    note: "I had so many ideas today and wanted to start everything at once. I did not feel tired even after sleeping less.",
  },
  27: {
    mood: "Irritable",
    status: "changed",
    medication: "Missed",
    sleep: "5h 05m",
    sleepQuality: "Interrupted",
    exercise: "42 active min",
    exerciseQuality: "Higher than usual",
    summary:
      "Sleep remained short, activity was elevated, and the morning medication was not recorded.",
    note: "Everything felt louder and more frustrating today. Taking a break in a quiet room helped a little.",
  },
  28: {
    mood: "Settling",
    status: "changed",
    medication: "Taken",
    sleep: "6h 35m",
    sleepQuality: "Improving",
    exercise: "25 min walk",
    exerciseQuality: "Moderate",
    summary:
      "Sleep and activity moved closer to the usual pattern, though mood still felt somewhat activated.",
  },
  29: {
    mood: "Balanced",
    status: "baseline",
    medication: "Taken",
    sleep: "7h 32m",
    sleepQuality: "Restful",
    exercise: "2,840 steps",
    exerciseQuality: "Gentle movement",
    summary:
      "Today appears closer to the recent baseline, with restorative sleep and moderate movement.",
    note: "I felt more grounded this morning. A short walk helped me slow down and organize my thoughts.",
  },
};

function BipolarCalendar({
  selectedDay,
  onSelect,
  noteBody,
  messages,
  onOpenDiary,
}: {
  selectedDay: number;
  onSelect: (day: number) => void;
  noteBody: string;
  messages: { who: string; text: string }[];
  onOpenDiary: (day: number) => void;
}) {
  const offset = (new Date(2026, 7, 1).getDay() + 6) % 7,
    cells = [...Array(offset).fill(null), ...Array.from({ length: 31 }, (_, i) => i + 1)],
    base = augustRecords[selectedDay],
    record = selectedDay === 29 && base ? { ...base, note: noteBody.trim() || base.note } : base,
    userShare = messages
      .filter((message) => message.who === "you")
      .map((message) => message.text)
      .join(" ");
  return (
    <section className="bipolar-calendar">
      <article className="calendar-card">
        <div className="calendar-head">
          <button aria-label="Previous month">‹</button>
          <div>
            <small>AUGUST</small>
            <h2>2026</h2>
          </div>
          <button aria-label="Next month">›</button>
        </div>
        <div className="weekdays">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="month-grid">
          {cells.map((day, index) =>
            day ? (
              <button
                key={day}
                className={`${day === selectedDay ? "selected " : ""}${augustRecords[day]?.status || ""}`}
                onClick={() => onSelect(day)}
              >
                <b>{day}</b>
                {augustRecords[day] && <i />}
                {augustRecords[day]?.note && <em>✎</em>}
              </button>
            ) : (
              <span key={`blank-${index}`} />
            ),
          )}
        </div>
        <div className="calendar-legend">
          <span>
            <i className="baseline" />
            Near baseline
          </span>
          <span>
            <i className="changed" />
            Changed
          </span>
          <span>
            <i className="review" />
            Review
          </span>
          <span>✎ Note</span>
        </div>
      </article>
      {record ? (
        <DayDetails
          day={selectedDay}
          record={record}
          userShare={userShare}
          onOpenDiary={() => onOpenDiary(selectedDay)}
        />
      ) : (
        <article className="empty-day">
          <Icon name="moon" size={25} />
          <h2>No record for August {selectedDay}</h2>
          <p>Complete a check-in, routine, or note to create this day’s record.</p>
        </article>
      )}
    </section>
  );
}

function DayDetails({
  day,
  record,
  userShare,
  onOpenDiary,
}: {
  day: number;
  record: DayRecord;
  userShare: string;
  onOpenDiary: () => void;
}) {
  return (
    <article className="day-details">
      <div className="day-details-head">
        <div>
          <small>AUGUST {day}, 2026</small>
          <h2>{record.mood} day</h2>
        </div>
        <span className={record.status}>
          {record.status === "baseline"
            ? "Near baseline"
            : record.status === "changed"
              ? "Changed"
              : "Worth reviewing"}
        </span>
      </div>
      <p className="day-summary">{record.summary}</p>
      <div className="daily-metrics">
        <div>
          <Badge type="rose" icon="pill" />
          <span>
            <small>MEDICATION</small>
            <b>{record.medication}</b>
          </span>
          <em className={record.medication.toLowerCase()}>
            {record.medication === "Taken" ? "✓" : "!"}
          </em>
        </div>
        <div>
          <Badge type="blue" icon="sleep" />
          <span>
            <small>SLEEP</small>
            <b>{record.sleep}</b>
            <i>{record.sleepQuality}</i>
          </span>
        </div>
        <div>
          <Badge type="green" icon="walk" />
          <span>
            <small>MOVEMENT</small>
            <b>{record.exercise}</b>
            <i>{record.exerciseQuality}</i>
          </span>
        </div>
      </div>
      {record.note && (
        <button className="day-note" onClick={onOpenDiary}>
          <span>
            <Icon name="file" size={16} />
            JOURNAL NOTE <em>Open diary →</em>
          </span>
          <p>{record.note}</p>
        </button>
      )}
      {day === 29 && userShare && (
        <div className="day-share">
          <span>
            <Icon name="heart" size={15} />
            SAFE-SPACE CHECK-IN
          </span>
          <p>{userShare}</p>
        </div>
      )}
      <small className="record-disclaimer">
        Patterns are compared with the person’s usual baseline and are not a diagnosis or prediction
        of a mood episode.
      </small>
    </article>
  );
}

function BipolarDiary({
  noteBody,
  page,
  onPage,
  onBack,
}: {
  noteBody: string;
  page: number;
  onPage: (page: number) => void;
  onBack: () => void;
}) {
  const entries = Object.entries(augustRecords)
    .filter(([, record]) => record.note)
    .map(([day, record]) => ({ ...record, day: Number(day) }));
  if (noteBody.trim()) {
    const today = entries.find((entry) => entry.day === 29);
    if (today) today.note = noteBody.trim();
  }
  const safePage = Math.min(page, Math.max(0, entries.length - 2)),
    visible = entries.slice(safePage, safePage + 2);
  return (
    <section className="diary-view">
      <button className="diary-back" onClick={onBack}>
        ← Back to daily calendar
      </button>
      <div className="diary-heading">
        <div>
          <small>NOTES BY DAY</small>
          <h2>Your recorded journal days</h2>
        </div>
        <span>{entries.length} entries</span>
      </div>
      <div className="diary-book">
        {" "}
        <div className="book-spine" />
        <div className="book-rings">
          <i />
          <i />
          <i />
        </div>
        {visible.map((entry) => (
          <article className="diary-sheet" key={entry.day}>
            <div className="paper-date">AUG {entry.day}, 2026</div>
            <span className={`diary-mood ${entry.status}`}>{entry.mood}</span>
            <h3>
              {entry.status === "baseline"
                ? "A day near my baseline"
                : entry.status === "review"
                  ? "Noticing a bigger change"
                  : "Noticing a change"}
            </h3>
            <p>{entry.note}</p>
            <small>
              {entry.sleep} sleep • {entry.exercise}
            </small>
          </article>
        ))}
      </div>
      <div className="diary-controls">
        <button onClick={() => onPage(Math.max(0, safePage - 2))} disabled={safePage === 0}>
          ← Earlier
        </button>
        <div>
          {entries.map(
            (_, index) =>
              index % 2 === 0 && <i key={index} className={safePage === index ? "active" : ""} />,
          )}
        </div>
        <button
          onClick={() => onPage(Math.min(Math.max(0, entries.length - 2), safePage + 2))}
          disabled={safePage >= entries.length - 2}
        >
          Later →
        </button>
      </div>
      <p className="diary-note">
        <Icon name="shield" size={14} />A diary page appears only on days with a saved note.
      </p>
    </section>
  );
}

function DailySummary({
  noteBody,
  messages,
}: {
  noteBody: string;
  messages: { who: string; text: string }[];
}) {
  const shared = messages
      .filter((message) => message.who === "you")
      .map((message) => message.text)
      .join(" "),
    combined = `${shared} ${noteBody}`.trim().toLowerCase(),
    themes: string[] = [];
  if (/anxious|worry|stress|panic/.test(combined)) themes.push("anxiety");
  if (/sleep|tired|fatigue|exhaust/.test(combined)) themes.push("sleep and energy");
  if (/calm|peace|better|hope/.test(combined)) themes.push("calm");
  if (/pain|headache|migraine/.test(combined)) themes.push("physical discomfort");
  if (/walk|exercise|movement/.test(combined)) themes.push("movement");
  const focus = themes.length ? themes.slice(0, 3).join(", ") : "general wellbeing",
    noteExcerpt = noteBody.trim() || "No journal note has been added yet.",
    chatExcerpt = shared || "No personal check-in has been shared yet.";
  return (
    <section className="summary-view">
      <div className="week">
        {["M", "T", "W", "T", "F", "S", "S"].map((x, i) => (
          <div className={i === 4 ? "today" : i < 4 ? "logged" : ""} key={i}>
            <small>{x}</small>
            <b>{25 + i}</b>
            <i>{i < 5 ? "•" : ""}</i>
          </div>
        ))}
      </div>
      <article className="condition-summary">
        <div className="summary-top">
          <span>
            <Icon name="sparkle" size={18} />
          </span>
          <div>
            <small>TODAY’S CONDITION SUMMARY</small>
            <h2>A gentle look at your day</h2>
          </div>
          <em>Stable</em>
        </div>
        <p>
          Today’s reflections center on <b>{focus}</b>. Your entries suggest that you are noticing
          how daily activities and emotions connect. Continue observing changes without judging
          them.
        </p>
        <div className="summary-sources">
          <span>
            <Icon name="heart" size={15} />
            <i>
              <b>Safe-space check-in</b>
              <small>{chatExcerpt}</small>
            </i>
          </span>
          <span>
            <Icon name="file" size={15} />
            <i>
              <b>My Care journal</b>
              <small>{noteExcerpt}</small>
            </i>
          </span>
        </div>
        <small className="summary-disclaimer">
          Generated from this session’s check-in and journal content. This is not a clinical
          assessment.
        </small>
      </article>
      <Title over="RECENT DAYS" title="Your emotional patterns" />
      <div className="timeline">
        <Day
          day="29"
          mood="Calm"
          cls="calm"
          title="A steadier day"
          body="Your morning walk helped quiet the racing thoughts. Sleep: 7h 32m."
        />
        <Day
          day="28"
          mood="Low energy"
          cls="low"
          title="You made space to rest"
          body="You chose one manageable task instead of pushing through fatigue."
        />
        <Day
          day="27"
          mood="Hopeful"
          cls="hope"
          title="A small win worth keeping"
          body="Cooking dinner and calling a friend helped you feel connected."
        />
      </div>
    </section>
  );
}

function EmotionDiary({
  noteBody,
  page,
  onPage,
}: {
  noteBody: string;
  page: number;
  onPage: (page: number) => void;
}) {
  const entries = [
      {
        date: "AUG 29",
        mood: "calm",
        title: "Finding a steadier rhythm",
        text:
          noteBody.trim() ||
          "I took a quiet moment to notice how I was feeling. The day was not perfect, but I kept showing up for myself.",
      },
      {
        date: "AUG 28",
        mood: "low energy",
        title: "Making room for rest",
        text: "Today I felt tired, so I chose one small task and gave myself permission to rest afterward.",
      },
      {
        date: "AUG 27",
        mood: "hopeful",
        title: "A small moment of connection",
        text: "I cooked dinner and called someone I trust. It reminded me that small moments can still feel meaningful.",
      },
      {
        date: "AUG 26",
        mood: "anxious",
        title: "Listening without judgment",
        text: "My thoughts felt busy today. Writing them down helped me see them with a little more distance.",
      },
    ],
    visible = entries.slice(page, page + 2);
  return (
    <section className="diary-view">
      <div className="diary-heading">
        <div>
          <small>MY EMOTION DIARY</small>
          <h2>Pages from your week</h2>
        </div>
        <span>{page / 2 + 1} of 2</span>
      </div>
      <div className="diary-book">
        <div className="book-spine" />
        <div className="book-rings">
          <i />
          <i />
          <i />
        </div>
        {visible.map((entry, index) => (
          <article className="diary-sheet" key={entry.date}>
            <div className="paper-date">{entry.date}</div>
            <span className={`diary-mood ${entry.mood.replace(" ", "-")}`}>{entry.mood}</span>
            <h3>{entry.title}</h3>
            <p>{entry.text}</p>
            <small>{index === 0 && page === 0 ? "Written today" : "Saved reflection"}</small>
          </article>
        ))}
      </div>
      <div className="diary-controls">
        <button onClick={() => onPage(Math.max(0, page - 2))} disabled={page === 0}>
          ← Previous pages
        </button>
        <div>
          <i className={page === 0 ? "active" : ""} />
          <i className={page === 2 ? "active" : ""} />
        </div>
        <button onClick={() => onPage(Math.min(2, page + 2))} disabled={page === 2}>
          Next pages →
        </button>
      </div>
      <p className="diary-note">
        <Icon name="shield" size={14} />
        Your emotional diary is private and organized by day.
      </p>
    </section>
  );
}

function RolePicker({ onChoose }: { onChoose: (role: "patient" | "parent") => void }) {
  return (
    <div className="stage">
      <main className="phone role-phone">
        <div className="role-hero">
          <i>
            <Icon name="heart" size={28} />
          </i>
          <small>WELCOME TO LUMA</small>
          <h1>
            Care feels better
            <br />
            when we do it together.
          </h1>
          <p>Choose how you’d like to use Luma today.</p>
        </div>
        <div className="role-options">
          <button onClick={() => onChoose("patient")}>
            <Badge type="green" icon="profile" />
            <span>
              <b>I’m a patient</b>
              <small>Check in, track routines, and reflect on your journey.</small>
            </span>
            <Icon name="chevron" />
          </button>
          <button onClick={() => onChoose("parent")}>
            <Badge type="lav" icon="heart" />
            <span>
              <b>I’m a parent or caregiver</b>
              <small>Observe symptoms and follow your child’s progress.</small>
            </span>
            <Icon name="chevron" />
          </button>
        </div>
        <p className="role-note">
          <Icon name="shield" size={15} /> Your information stays private and is never shared
          without permission.
        </p>
      </main>
    </div>
  );
}

const conditionSymptoms: Record<string, string[]> = {
  "Bipolar disorder": [
    "Mood unusually elevated or irritable",
    "Reduced need for sleep",
    "Racing thoughts or rapid speech",
    "Impulsive or risky behavior",
    "Low mood or low energy",
  ],
  Anxiety: [
    "Worry or fear",
    "Restlessness",
    "Avoiding activities",
    "Trouble sleeping",
    "Physical tension",
  ],
  Depression: ["Low mood", "Loss of interest", "Low energy", "Sleep changes", "Social withdrawal"],
  ADHD: [
    "Difficulty focusing",
    "Impulsivity",
    "Restlessness",
    "Task completion",
    "Emotional regulation",
  ],
  "Autism spectrum": [
    "Sensory distress",
    "Communication difficulty",
    "Routine disruption",
    "Social overwhelm",
    "Repetitive behavior",
  ],
  Epilepsy: ["Seizure activity", "Confusion", "Fatigue", "Headache", "Sleep disruption"],
  Migraine: [
    "Head pain",
    "Light sensitivity",
    "Nausea",
    "Aura or vision change",
    "Concentration difficulty",
  ],
  "Traumatic brain injury": [
    "Headache",
    "Memory difficulty",
    "Dizziness",
    "Mood change",
    "Sleep disruption",
  ],
};

function ParentApp({ onSwitch }: { onSwitch: () => void }) {
  const [condition, setCondition] = useState("Bipolar disorder"),
    [scores, setScores] = useState<Record<string, number>>({}),
    [submitted, setSubmitted] = useState(false);
  const symptoms = conditionSymptoms[condition],
    average = symptoms.reduce((sum, s) => sum + (scores[s] ?? 2), 0) / symptoms.length;
  const trend =
    condition === "Bipolar disorder"
      ? average <= 1.6
        ? {
            label: "Near usual baseline",
            cls: "better",
            body: "Observed mood, sleep, energy, and behavior are close to Noah’s recent baseline.",
          }
        : average <= 3.2
          ? {
              label: "Some change noticed",
              cls: "stable",
              body: "Today differs somewhat from Noah’s usual pattern. Continue observing sleep, energy, mood, and behavior.",
            }
          : {
              label: "Significant change",
              cls: "worse",
              body: "Several changes are noticeable today. Consider following the agreed care or safety plan and contacting the care team.",
            }
      : average <= 1.6
        ? {
            label: "Showing improvement",
            cls: "better",
            body: "Today’s observed symptom level is lower than the recent baseline.",
          }
        : average <= 3.2
          ? {
              label: "Mostly stable",
              cls: "stable",
              body: "Today looks similar to the recent pattern. Keep observing gently.",
            }
          : {
              label: "Needs attention",
              cls: "worse",
              body: "Symptoms appear stronger today. Consider contacting the care team.",
            };
  function changeCondition(next: string) {
    setCondition(next);
    setScores({});
    setSubmitted(false);
  }
  return (
    <div className="stage">
      <main className="phone parent-phone">
        <header>
          <button className="brand" onClick={onSwitch}>
            <i>
              <Icon name="heart" size={19} />
            </i>
            Luma
          </button>
          <button className="switch-role" onClick={onSwitch}>
            Switch view
          </button>
        </header>
        <div className="page">
          <Hero
            over="PARENT & CAREGIVER"
            title="How is Noah today?"
            sub="Record what you notice. You don’t need to have all the answers."
          />
          <section className="child-card">
            <div className="child-avatar">N</div>
            <div>
              <b>Noah Chen</b>
              <small>Age 11 • Last check-in yesterday</small>
            </div>
            <button>Change</button>
          </section>
          <Title over="CONDITION" title="What are you tracking?" />
          <div className="condition-tabs">
            {Object.keys(conditionSymptoms).map((name) => (
              <button
                className={condition === name ? "active" : ""}
                key={name}
                onClick={() => changeCondition(name)}
              >
                {name}
              </button>
            ))}
          </div>
          <Title
            over="TODAY’S OBSERVATIONS"
            title="Rate each symptom"
            end={<small>0 none · 5 severe</small>}
          />
          <div className="symptom-list">
            {symptoms.map((symptom) => {
              const value = scores[symptom] ?? 2;
              return (
                <label key={symptom}>
                  <span>
                    <b>{symptom}</b>
                    <em className={`level l${value}`}>
                      {["None", "Mild", "Mild", "Moderate", "Strong", "Severe"][value]}
                    </em>
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    value={value}
                    onChange={(e) => {
                      setScores({ ...scores, [symptom]: Number(e.target.value) });
                      setSubmitted(false);
                    }}
                  />
                  <span className="scale">
                    <i>0</i>
                    <i>1</i>
                    <i>2</i>
                    <i>3</i>
                    <i>4</i>
                    <i>5</i>
                  </span>
                </label>
              );
            })}
          </div>
          <button className="review-button" onClick={() => setSubmitted(true)}>
            Review today’s pattern
          </button>
          {submitted && (
            <article className={`trend-card ${trend.cls}`}>
              <div className="trend-icon">
                {trend.cls === "better" ? "↘" : trend.cls === "stable" ? "→" : "↗"}
              </div>
              <div>
                <small>COMPARED WITH THE LAST 7 DAYS</small>
                <h2>{trend.label}</h2>
                <p>{trend.body}</p>
                <button>Share summary with care team →</button>
              </div>
            </article>
          )}
          <p className="warning parent-warning">
            <Icon name="shield" size={15} />
            This is an observation tool, not a diagnosis. Sudden, severe, or dangerous symptoms need
            professional or emergency help.
          </p>
        </div>
      </main>
    </div>
  );
}
