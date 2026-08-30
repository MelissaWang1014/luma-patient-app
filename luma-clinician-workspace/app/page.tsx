'use client';
import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  Bell,
  Brain,
  CalendarDays,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileText,
  HeartPulse,
  LayoutDashboard,
  Maximize2,
  MessageSquareText,
  Mic,
  MicOff,
  MoreHorizontal,
  PhoneOff,
  Pill,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  Video,
  VideoOff,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  assignAssessment,
  createMedicationPlan,
  createPatientInvitation,
  loadPatientTimeline,
  refreshPatientSummary,
} from '@/lib/clinical-data';
import {
  getClinicianSession,
  isSupabaseConfigured,
  signInClinician,
  signOutClinician,
} from '@/lib/supabase';

type Patient = {
  id: string;
  name: string;
  initials: string;
  age: number;
  condition: string;
  guardian: string;
  meds: string;
  score: string;
  risk: 'stable' | 'watch' | 'priority';
  time: string;
  duration: string;
  type: string;
  function: string;
  lastUpdate: string;
  alert: string;
};
const appointments: Patient[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Margaret Lewis',
    initials: 'ML',
    age: 84,
    condition: 'Alzheimer’s disease · late stage',
    guardian: 'Daughter · health-care proxy',
    meds: 'Medication reconciliation needed',
    score: 'GDS 7 / FAST 7 likely',
    risk: 'priority',
    time: '9:00 AM',
    duration: '45 min',
    type: 'Palliative home follow-up',
    function: 'Bedbound · total ADL dependence',
    lastUpdate: 'Today',
    alert: 'Dysphagia, poor intake and skin risk',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Noah Bennett',
    initials: 'NB',
    age: 20,
    condition: 'Autism spectrum disorder · Level 3',
    guardian: 'Mother · legal guardian',
    meds: 'Medication list not supplied',
    score: 'AAC · <10 spoken words',
    risk: 'watch',
    time: '10:30 AM',
    duration: '45 min',
    type: 'Developmental follow-up',
    function: 'High support · walks independently',
    lastUpdate: 'Yesterday',
    alert: 'Increased self-injury and night waking',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Eleanor Brooks',
    initials: 'EB',
    age: 78,
    condition: 'Alzheimer’s disease · mild stage',
    guardian: 'Daniel Brooks · son',
    meds: 'Donepezil 10 mg nightly',
    score: 'MoCA 21 → 19',
    risk: 'watch',
    time: '1:00 PM',
    duration: '45 min',
    type: 'Cognitive follow-up',
    function: 'Needs help with IADLs',
    lastUpdate: '2 days ago',
    alert: 'More repetition over 8 weeks',
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    name: 'Robert Hale',
    initials: 'RH',
    age: 82,
    condition: 'Vascular cognitive impairment',
    guardian: 'Ana Hale · spouse',
    meds: 'Aspirin 81 mg daily',
    score: 'MoCA 18 · stable',
    risk: 'stable',
    time: '3:15 PM',
    duration: '30 min',
    type: 'Medication review',
    function: 'Independent basic ADLs',
    lastUpdate: '3 days ago',
    alert: 'No new concerns',
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    name: 'Lillian Park',
    initials: 'LP',
    age: 74,
    condition: 'Mild cognitive impairment',
    guardian: 'Grace Park · daughter',
    meds: 'No cognitive medication',
    score: 'MoCA 24 → 22',
    risk: 'watch',
    time: 'Sep 3',
    duration: '45 min',
    type: 'Remote assessment',
    function: 'Independent with reminders',
    lastUpdate: '5 days ago',
    alert: 'Two-point MoCA decline',
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    name: 'Samuel Ortiz',
    initials: 'SO',
    age: 86,
    condition: 'Lewy body dementia',
    guardian: 'Mateo Ortiz · son',
    meds: 'Rivastigmine patch 9.5 mg',
    score: 'Fluctuating attention',
    risk: 'priority',
    time: 'Sep 4',
    duration: '30 min',
    type: 'Urgent caregiver visit',
    function: 'Assisted transfers and ADLs',
    lastUpdate: 'Today',
    alert: 'New visual hallucinations',
  },
];
const week = [
  ['MON', '31'],
  ['TUE', '1'],
  ['WED', '2'],
  ['THU', '3'],
  ['FRI', '4'],
  ['SAT', '5'],
  ['SUN', '6'],
];
export default function Home() {
  const [view, setView] = useState<'patients' | 'schedule' | 'record'>(
      'patients',
    ),
    [patient, setPatient] = useState(appointments[0]),
    [toast, setToast] = useState(''),
    [modal, setModal] = useState<'test' | 'rx' | null>(null),
    [authReady, setAuthReady] = useState(false),
    [clinicianName, setClinicianName] = useState('');
  useEffect(() => {
    getClinicianSession()
      .then((result) => {
        if (result) setClinicianName(result.profile.full_name || 'Clinician');
      })
      .finally(() => setAuthReady(true));
  }, []);
  if (!authReady)
    return (
      <div className="clinician-login">
        <div className="login-card">
          <Brain />
          <h1>Opening Luma…</h1>
          <p>Checking your clinician session.</p>
        </div>
      </div>
    );
  if (!clinicianName) return <ClinicianLogin onSignedIn={setClinicianName} />;
  function notify(x: string) {
    setToast(x);
    setTimeout(() => setToast(''), 2600);
  }
  function join(p: Patient) {
    setPatient(p);
    setView('record');
  }
  return (
    <div className="cog-shell">
      <Sidebar
        view={view}
        patients={() => setView('patients')}
        schedule={() => setView('schedule')}
        signOut={async () => {
          await signOutClinician();
          setClinicianName('');
        }}
      />
      <main>
        <Top view={view} back={() => setView('patients')} notify={notify} />
        {view === 'patients' ? (
          <Registry open={join} schedule={() => setView('schedule')} />
        ) : view === 'schedule' ? (
          <Schedule join={join} notify={notify} />
        ) : (
          <PatientRecordWorkspace patient={patient} notify={notify} open={setModal} />
        )}
      </main>
      {modal && (
        <ActionModal
          kind={modal}
          patient={patient}
          close={() => setModal(null)}
          sent={(x) => {
            setModal(null);
            notify(x);
          }}
        />
      )}
      {toast && (
        <div className="cog-toast">
          <Check />
          {toast}
        </div>
      )}
    </div>
  );
}
function ClinicianLogin({
  onSignedIn,
}: {
  onSignedIn: (name: string) => void;
}) {
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [error, setError] = useState(''),
    [working, setWorking] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setWorking(true);
    setError('');
    try {
      const result = await signInClinician(email, password);
      onSignedIn(result.profile.full_name || 'Clinician');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to sign in.');
    } finally {
      setWorking(false);
    }
  }
  return (
    <div className="clinician-login">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">
          <Brain />
          <span>
            <b>Luma</b>
            <small>CLINICIAN WORKSPACE</small>
          </span>
        </div>
        <small>SECURE ACCESS</small>
        <h1>Sign in to your workspace</h1>
        <p>
          Use your clinician account to manage patients, invitations,
          assessments, and treatment plans.
        </p>
        <label>
          <span>Email address</span>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="clinician@example.com"
          />
        </label>
        <label>
          <span>Password</span>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="current-password"
          />
        </label>
        {error && <div className="login-error">{error}</div>}
        <Button type="submit" disabled={working || !isSupabaseConfigured}>
          {working ? 'Signing in…' : 'Sign in'}
        </Button>
        <div className="login-note">
          <ShieldCheck />
          Synthetic demo environment. Do not enter real patient information.
        </div>
      </form>
    </div>
  );
}
function Sidebar({
  view,
  patients,
  schedule,
  signOut,
}: {
  view: string;
  patients: () => void;
  schedule: () => void;
  signOut: () => void;
}) {
  return (
    <aside className="cog-sidebar">
      <button className="cog-brand" onClick={patients}>
        <i>
          <Brain />
        </i>
        <b>Luma</b>
        <small>COGNITIVE CARE</small>
      </button>
      <nav>
        <button
          className={view === 'patients' ? 'active' : ''}
          onClick={patients}
        >
          <Users />
          Patients <em>6</em>
        </button>
        <button
          className={view === 'schedule' ? 'active' : ''}
          onClick={schedule}
        >
          <CalendarDays />
          Appointments <em>4</em>
        </button>
        <button>
          <ClipboardCheck />
          Assessments
        </button>
        <button>
          <FileText />
          Documents
        </button>
      </nav>
      <div className="sync-placeholder">
        <Activity />
        <span>
          <b>Patient data sync</b>
          <small>Awaiting guardian-app update</small>
        </span>
        <i>Paused</i>
      </div>
      <div className="epic-cog">
        <ShieldCheck />
        <span>
          <b>Epic sandbox</b>
          <small>FHIR R4 connected</small>
        </span>
      </div>
      <div className="cog-provider">
        <span>SA</span>
        <div>
          <b>Dr. Samira Ahmed</b>
          <small>Cognitive Neurology</small>
        </div>
        <Settings />
      </div>
      <button className="clinician-signout" onClick={signOut}>
        Sign out
      </button>
    </aside>
  );
}
function Top({
  view,
  back,
  notify,
}: {
  view: string;
  back: () => void;
  notify: (x: string) => void;
}) {
  return (
    <header className="cog-top">
      <div>
        {view === 'record' ? (
          <button className="cog-back" onClick={back}>
            <ArrowLeft />
            Patient records
          </button>
        ) : (
          <>
            <small>HOME-BASED COGNITIVE CARE</small>
            <h1>
              {view === 'patients' ? 'Patient records' : 'Video appointments'}
            </h1>
          </>
        )}
      </div>
      <div>
        <span className="demo">SYNTHETIC DEMO DATA</span>
        <button className="top-icon" onClick={() => notify('No new messages')}>
          <MessageSquareText />
        </button>
        <button className="top-icon">
          <Bell />
          <i>3</i>
        </button>
        {view === 'schedule' && (
          <Button onClick={() => notify('New appointment form opened')}>
            <Plus />
            New appointment
          </Button>
        )}
      </div>
    </header>
  );
}
function Registry({
  open,
  schedule,
}: {
  open: (p: Patient) => void;
  schedule: () => void;
}) {
  const [query, setQuery] = useState(''),
    [filter, setFilter] = useState<'all' | 'priority' | 'watch' | 'stable'>(
      'all',
    ),
    [added, setAdded] = useState<Patient[]>([]),
    [creating, setCreating] = useState(false);
  async function addPatient() {
    const name = window.prompt('Patient full name');
    if (!name?.trim()) return;
    const condition =
      window.prompt('Condition or reason for care (optional)') ||
      'Assessment pending';
    setCreating(true);
    try {
      const invitation = await createPatientInvitation({
        name: name.trim(),
        condition,
      });
      if (!invitation) throw new Error('No invitation was returned.');
      const initials = name
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
      setAdded((current) => [
        ...current,
        {
          id: invitation.patient_id,
          name: name.trim(),
          initials,
          age: 0,
          condition,
          guardian: 'Invitation pending',
          meds: 'Medication reconciliation pending',
          score: 'Assessment pending',
          risk: 'stable',
          time: 'Not scheduled',
          duration: '',
          type: 'New patient',
          function: 'Initial history pending',
          lastUpdate: 'Just added',
          alert: 'Awaiting first user check-in',
        },
      ]);
      window.alert(
        `Patient added. One-time Luma access code: ${invitation.invitation_code}\n\nShare this privately with the patient or guardian. It expires in 7 days.`,
      );
    } catch (reason) {
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === 'object' && reason && 'message' in reason
            ? String(reason.message)
            : 'Unable to add patient.';
      window.alert(message);
    } finally {
      setCreating(false);
    }
  }
  const rows = [...appointments, ...added].filter(
    (p) =>
      (filter === 'all' || p.risk === filter) &&
      `${p.name} ${p.condition} ${p.guardian}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <div className="registry-page">
      <section className="registry-intro">
        <div>
          <small>COGNITIVE CARE PANEL</small>
          <h2>Patients under your care</h2>
          <p>
            Clinical records, guardian support, functional status, and upcoming
            visits.
          </p>
        </div>
        <div className="registry-actions">
          <Button onClick={addPatient} disabled={creating}>
            <Plus />
            {creating ? 'Creating…' : 'Add patient'}
          </Button>
          <Button variant="outline" onClick={schedule}>
            <CalendarDays />
            View appointment calendar
          </Button>
        </div>
      </section>
      <section className="registry-stats">
        <article>
          <span>{rows.length}</span>
          <div>
            <b>Active patients</b>
            <small>Home-based care panel</small>
          </div>
        </article>
        <article className="priority-stat">
          <span>2</span>
          <div>
            <b>Priority reviews</b>
            <small>Need clinical follow-up</small>
          </div>
        </article>
        <article>
          <span>4</span>
          <div>
            <b>Video visits</b>
            <small>Scheduled this week</small>
          </div>
        </article>
      </section>
      <section className="registry-panel">
        <div className="registry-tools">
          <label>
            <Search />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, condition, or guardian"
            />
          </label>
          <div>
            {(['all', 'priority', 'watch', 'stable'] as const).map((x) => (
              <button
                className={filter === x ? 'active' : ''}
                onClick={() => setFilter(x)}
                key={x}
              >
                {x === 'all'
                  ? 'All'
                  : x === 'priority'
                    ? 'Priority'
                    : x === 'watch'
                      ? 'Monitor'
                      : 'Stable'}
              </button>
            ))}
          </div>
        </div>
        <div className="registry-table">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Condition</th>
                <th>Guardian / support</th>
                <th>Function & communication</th>
                <th>Next visit</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr
                  key={p.name}
                  onClick={() => open(p)}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && open(p)}
                >
                  <td>
                    <span className="avatar-cog">{p.initials}</span>
                    <span>
                      <b>{p.name}</b>
                      <small>
                        {p.age} years · {p.lastUpdate}
                      </small>
                    </span>
                  </td>
                  <td>
                    <b>{p.condition}</b>
                    <small>{p.score}</small>
                  </td>
                  <td>
                    <Users />
                    <span>
                      <b>{p.guardian}</b>
                      <small>Primary collateral</small>
                    </span>
                  </td>
                  <td>
                    <b>{p.function}</b>
                    <small>{p.alert}</small>
                  </td>
                  <td>
                    <b>{p.time}</b>
                    <small>{p.type}</small>
                  </td>
                  <td>
                    <span className={`cog-risk ${p.risk}`}>
                      {p.risk === 'priority'
                        ? 'Priority'
                        : p.risk === 'watch'
                          ? 'Monitor'
                          : 'Stable'}
                    </span>
                  </td>
                  <td>
                    <ChevronRight />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="registry-empty">No patients match this view.</p>
          )}
        </div>
      </section>
      <p className="registry-note">
        <ShieldCheck />
        Attached records are synthetic educational cases. Missing medications,
        allergies, examination findings, and orders remain explicitly
        unverified.
      </p>
    </div>
  );
}
function Schedule({
  join,
  notify,
}: {
  join: (p: Patient) => void;
  notify: (x: string) => void;
}) {
  const [selectedDay, setSelectedDay] = useState(1);
  return (
    <div className="cog-content">
      <section className="welcome-row">
        <div>
          <p>Tuesday, September 1, 2026</p>
          <h2>Four home-based visits today</h2>
          <span>
            All patients have a guardian or care partner joining the call.
          </span>
        </div>
        <div className="week-nav">
          <button>
            <ChevronLeft />
          </button>
          <b>Aug 31 – Sep 6</b>
          <button>
            <ChevronRight />
          </button>
        </div>
      </section>
      <section className="day-strip">
        {week.map((d, i) => (
          <button
            key={d[1]}
            className={selectedDay === i ? 'active' : ''}
            onClick={() => setSelectedDay(i)}
          >
            <small>{d[0]}</small>
            <b>{d[1]}</b>
            <i>{i === 1 ? '4' : i === 2 ? '2' : i === 4 ? '3' : ''}</i>
          </button>
        ))}
      </section>
      <div className="schedule-grid">
        <section className="calendar-panel panel">
          <div className="section-head">
            <div>
              <small>TODAY’S SCHEDULE</small>
              <h2>Tuesday, September 1</h2>
            </div>
            <div>
              <span>
                <i />
                Video visit
              </span>
              <span>
                <i />
                Assessment
              </span>
            </div>
          </div>
          <div className="timeline">
            {appointments.slice(0, 4).map((p, i) => (
              <article key={p.name} className={`appointment ap${i}`}>
                <time>
                  {p.time}
                  <small>{p.duration}</small>
                </time>
                <div className="time-rule">
                  <i />
                </div>
                <div className="appointment-card">
                  <div className="avatar-cog">{p.initials}</div>
                  <span>
                    <small>{p.type}</small>
                    <b>{p.name}</b>
                    <em>{p.condition}</em>
                    <p>
                      <Users />
                      {p.guardian} joining
                    </p>
                  </span>
                  <span className={`cog-risk ${p.risk}`}>
                    {p.risk === 'priority'
                      ? 'Priority'
                      : p.risk === 'watch'
                        ? 'Monitor'
                        : 'Stable'}
                  </span>
                  <Button
                    variant={i === 0 ? 'default' : 'outline'}
                    onClick={() => join(p)}
                  >
                    <Video />
                    {i === 0 ? 'Join now' : 'Open visit'}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
        <aside className="right-rail">
          <section className="panel next-card">
            <div className="live">
              <i />
              NEXT · 9:00 AM
            </div>
            <div className="next-person">
              <span>ML</span>
              <div>
                <h3>Margaret Lewis</h3>
                <p>Daughter · health-care proxy</p>
              </div>
            </div>
            <dl>
              <div>
                <dt>Visit</dt>
                <dd>Palliative home follow-up</dd>
              </div>
              <div>
                <dt>Last assessment</dt>
                <dd>GDS 7 / FAST 7 likely</dd>
              </div>
              <div>
                <dt>Technology check</dt>
                <dd className="ready">
                  <Check />
                  Ready
                </dd>
              </div>
            </dl>
            <Button onClick={() => join(appointments[0])}>
              <Video />
              Enter waiting room
            </Button>
          </section>
          <section className="panel prep-card">
            <small>VISIT PREPARATION</small>
            <h3>Before Margaret’s visit</h3>
            {[
              'Review proxy observations',
              'Confirm comfort-focused goals',
              'Check medication reconciliation',
            ].map((x, i) => (
              <label key={x}>
                <input type="checkbox" defaultChecked={i < 2} />
                <span>
                  <i>{i < 2 && <Check />}</i>
                  {x}
                </span>
              </label>
            ))}
          </section>
          <section className="panel quick-panel">
            <small>QUICK ACTIONS</small>
            <button onClick={() => notify('Invitation copied')}>
              <Send />
              Send appointment link
              <ChevronRight />
            </button>
            <button onClick={() => notify('Guardian support opened')}>
              <Users />
              Guardian support
              <ChevronRight />
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
type TimelineData = Awaited<ReturnType<typeof loadPatientTimeline>>;

function PatientRecordWorkspace({
  patient: p,
  notify,
  open,
}: {
  patient: Patient;
  notify: (x: string) => void;
  open: (x: 'test' | 'rx') => void;
}) {
  const [data, setData] = useState<TimelineData | null>(null),
    [loading, setLoading] = useState(true),
    [syncError, setSyncError] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      loadPatientTimeline(p.id),
      refreshPatientSummary(p.id).catch(() => null),
    ])
      .then(([result]) => active && setData(result))
      .catch((reason) =>
        active && setSyncError(reason instanceof Error ? reason.message : 'Live data is unavailable.'),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [p.id]);

  const observations = data?.observations ?? [];
  const liveFunction = observations
    .filter((item: any) => item.category === 'function' && item.value_number != null)
    .slice(0, 14)
    .reverse();
  const demoScores = p.name === 'Margaret Lewis'
    ? [42, 43, 41, 40, 39, 41, 38, 37, 36, 38, 35, 34, 33, 34]
    : p.name === 'Noah Bennett'
      ? [58, 56, 59, 55, 52, 54, 51, 50, 53, 49, 47, 50, 48, 46]
      : [72, 71, 72, 70, 69, 70, 68, 69, 67, 68, 66, 67, 65, 66];
  const scores = liveFunction.length >= 2
    ? liveFunction.map((item: any) => Number(item.value_number))
    : demoScores;
  const points = scores.map((value, index) => {
    const x = 20 + (index * 460) / Math.max(1, scores.length - 1);
    const y = 115 - Math.max(0, Math.min(100, value)) * 0.85;
    return `${x},${y}`;
  }).join(' ');
  const selected = observations.flatMap((item: any) => item.metadata?.selectedSymptoms ?? []);
  const latestSummary = data?.summaries?.[0] as any;
  const activeAlerts = (data?.alerts ?? []).filter((item: any) => item.status === 'open');
  const d = profile(p);
  return (
    <div className="record-workspace">
      <section className="record-hero">
        <div>
          <span className="avatar-cog">{p.initials}</span>
          <div>
            <h2>{p.name}</h2>
            <p>{p.age || 'Age not entered'} · {p.condition} · MRN {d.mrn}</p>
          </div>
          <span className={`cog-risk ${p.risk}`}>
            {p.risk === 'priority'
              ? 'Priority'
              : p.risk === 'watch'
                ? 'Monitor'
                : 'Stable'}
          </span>
        </div>
        <div className="record-actions">
          <Button variant="outline" onClick={() => open('test')}><ClipboardCheck />Send assessment</Button>
          <Button onClick={() => open('rx')}><Pill />Prescribe medication</Button>
        </div>
      </section>
      {activeAlerts.length > 0 && <div className="record-alert"><ShieldCheck/><span><b>{activeAlerts.length} active clinical alert{activeAlerts.length > 1 ? 's' : ''}</b><small>{activeAlerts.map((x: any) => x.title).join(' · ')}</small></span></div>}
      <div className="record-dashboard">
        <section className="record-card patient-overview">
          <div className="record-card-title"><span><small>MEDICAL RECORD</small><h3>Patient overview</h3></span><FileText/></div>
          <dl className="overview-grid">
            <div><dt>Condition</dt><dd>{p.condition}</dd></div>
            <div><dt>Guardian / support</dt><dd>{p.guardian}</dd></div>
            <div><dt>Function</dt><dd>{p.function}</dd></div>
            <div><dt>Communication</dt><dd>{d.facts[0]?.[1]}</dd></div>
          </dl>
          <div className="medication-block"><Pill/><span><small>MEDICATIONS</small><b>{p.meds}</b><em>Medication reconciliation required before changing treatment.</em></span></div>
          <div className="warning-list">{d.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        </section>

        <section className="record-card activity-summary">
          <div className="record-card-title"><span><small>USER APP · LAST 14 DAYS</small><h3>Cognitive and daily activity</h3></span><span className="sync-status">{loading ? 'Syncing…' : syncError ? 'Demo view' : 'Synced'}</span></div>
          <div className="metric-strip">
            <article><Brain/><span><b>{Math.round(scores.at(-1) ?? 0)}%</b><small>Cognitive function</small></span></article>
            <article><Pill/><span><b>{latestSummary?.metrics?.medication_adherence_percent ?? '86'}%</b><small>Medication taken</small></span></article>
            <article><Activity/><span><b>{observations.length || 18}</b><small>Care observations</small></span></article>
          </div>
          <div className="cognitive-chart">
            <div><b>Cognitive function level</b><small>Caregiver check-ins · higher is closer to usual baseline</small></div>
            <svg viewBox="0 0 500 130" role="img" aria-label="Fourteen-day cognitive function trend">
              {[30,60,90].map((y) => <line key={y} x1="20" y1={y} x2="480" y2={y}/>) }
              <polyline points={points}/>
              {points.split(' ').map((point, i) => { const [cx,cy]=point.split(','); return <circle key={i} cx={cx} cy={cy} r="3"/>; })}
            </svg>
            <div className="chart-labels"><span>14 days ago</span><span>Today</span></div>
          </div>
          <div className="care-note-grid">
            <article><Pill/><span><b>Medication</b><small>{latestSummary?.narrative?.medication || 'Mostly administered as planned; verify any missed or difficult-to-swallow doses.'}</small></span></article>
            <article><HeartPulse/><span><b>Diet</b><small>{selected.some((x: string) => /eat|food|drink|mouth|chok/i.test(x)) ? 'Eating or swallowing changes were recorded. Review meal safety.' : 'No new diet concern selected in recent check-ins.'}</small></span></article>
            <article><Activity/><span><b>Physical therapy</b><small>{selected.some((x: string) => /move|turn|stiff|fall/i.test(x)) ? 'Movement or positioning change reported; review therapy plan.' : 'Caregiver reports routine movement support.'}</small></span></article>
          </div>
        </section>

        <section className="record-card visit-history">
          <div className="record-card-title"><span><small>LAST VISIT</small><h3>Clinical note</h3></span><MessageSquareText/></div>
          <p>{d.note}</p>
          <ul>{d.points.slice(0,3).map((point) => <li key={point}>{point}</li>)}</ul>
          <Button variant="outline" onClick={() => notify('Visit note opened for editing')}><FileText/>Edit visit note</Button>
        </section>

        <section className="record-card next-visit">
          <div className="record-card-title"><span><small>NEXT ONLINE APPOINTMENT</small><h3>{p.time}</h3></span><CalendarDays/></div>
          <p>{p.type} · {p.duration || '45 min'}</p>
          <div><Clock3/><span><b>Guardian will join from home</b><small>Video instructions sent to care partner</small></span></div>
          <Button onClick={() => notify('Appointment scheduling opened')}><CalendarDays/>Schedule or reschedule</Button>
        </section>

        <section className="record-card sent-care">
          <div className="record-card-title"><span><small>REMOTE CARE</small><h3>Sent to patient app</h3></span><Send/></div>
          <div className="sent-list">
            {(data?.assessments ?? []).slice(0,2).map((item: any) => <article key={item.id}><ClipboardCheck/><span><b>{item.title}</b><small>{item.status} · due {item.due_at?.slice(0,10) || 'not set'}</small></span></article>)}
            {(data?.medications ?? []).slice(0,2).map((item: any) => <article key={item.id}><Pill/><span><b>{item.medication_plans?.medication_name || 'Medication plan'}</b><small>{item.status}</small></span></article>)}
            {!data?.assessments?.length && <p>No active assessment has been sent yet.</p>}
          </div>
          <div className="send-buttons"><Button variant="outline" onClick={() => open('test')}><ClipboardCheck/>Send assessment</Button><Button onClick={() => open('rx')}><Pill/>New prescription</Button></div>
        </section>
      </div>
    </div>
  );
}
function profile(p: Patient) {
  if (p.name === 'Margaret Lewis')
    return {
      mrn: 'SYN-ALZ-084',
      label: 'FUNCTION & COMMUNICATION',
      detail: 'Late-stage functional profile',
      facts: [
        ['Communication', 'Minimal vocalization'],
        ['Daily care', 'Total assistance'],
        ['Mobility', 'Near-bedbound'],
      ],
      tags: ['Dysphagia', 'Double incontinence', 'Pressure-injury risk'],
      note: 'Almost bedbound and hand-fed, with food pocketing, coughing during meals, poor intake, and inconsistent recognition. Proxy prioritizes comfort and familiar surroundings.',
      points: [
        'Total assistance is needed for all daily care.',
        'Swallowing, hydration, nutrition, and skin integrity need close review.',
        'Goals emphasize comfort and avoiding burdensome interventions.',
      ],
      watch: [
        'Aspiration or choking',
        'Dehydration or weight loss',
        'Pressure injury or acute delirium',
      ],
      steps: [
        [
          'Assess swallowing and nutrition',
          'Review aspiration precautions and hand-feeding plan.',
        ],
        [
          'Reconcile medications and allergies',
          'The source record does not supply a verified list.',
        ],
        [
          'Review comfort-focused goals',
          'Consider palliative or hospice eligibility with the proxy.',
        ],
      ],
    };
  if (p.name === 'Noah Bennett')
    return {
      mrn: 'SYN-ASD-020',
      label: 'COMMUNICATION & SUPPORT',
      detail: 'Current adaptive profile',
      facts: [
        ['Communication', 'AAC, gesture, <10 words'],
        ['Daily care', 'High direct support'],
        ['Mobility', 'Walks; toe-walking'],
      ],
      tags: ['Self-injury / irritability', 'Food selectivity', 'Constipation'],
      note: 'Over six weeks, caregivers report more hand-biting and head-hitting, grooming refusal, night waking, and fewer AAC requests. Autism is not degenerative; new change needs medical and functional assessment.',
      points: [
        'AAC tablet and picture board are primary communication tools.',
        'Unexpected transitions, loud settings, waiting, toothbrushing, and constipation are common triggers.',
        'Elopement and community-safety risk require direct support.',
      ],
      watch: [
        'Increased self-injury',
        'Sleep disruption',
        'Pain, dental issues, or constipation',
      ],
      steps: [
        [
          'Evaluate recent change',
          'Screen for pain, dental problems, constipation, sleep disruption, and other medical contributors.',
        ],
        [
          'Send caregiver assessment',
          'Use an adaptive-function or behavior questionnaire, not a dementia screen.',
        ],
        [
          'Build a behavior-support plan',
          'Track triggers, communication attempts, and effective de-escalation supports.',
        ],
      ],
    };
  return {
    mrn: '0048217',
    label: 'COGNITIVE STATUS',
    detail: 'Longitudinal cognitive trend',
    facts: [
      ['Orientation', 'Mildly impaired'],
      ['Delayed recall', '1 of 5 words'],
      ['Function', p.function],
    ],
    tags: ['Hypertension', 'Hearing impairment'],
    note:
      p.alert + '. Care partner provides medication and functional history.',
    points: [
      'Care partner reports a gradual change in daily function.',
      'No acute confusion, fall, or wandering event was reported.',
      'Home support and treatment adherence were reviewed.',
    ],
    watch: [p.alert, 'Medication independence', 'Change from prior assessment'],
    steps: [
      [
        'Repeat appropriate assessment',
        'Use a remotely supervised, diagnosis-appropriate tool.',
      ],
      [
        'Check reversible contributors',
        'Review medications, sensory needs, sleep, and basic laboratory work.',
      ],
      [
        'Update home support',
        'Review safety and daily-function support with the care partner.',
      ],
    ],
  };
}
function Record({ p }: { p: Patient }) {
  const d = profile(p);
  return (
    <div className="panel-scroll">
      <section className="record-identity">
        <span className="avatar-cog big">{p.initials}</span>
        <div>
          <h3>{p.name}</h3>
          <p>MRN {d.mrn} · Synthetic record</p>
        </div>
      </section>
      <Section title={d.label}>
        <div className="score-card">
          <Brain />
          <span>
            <small>{d.detail}</small>
            <b>{p.score}</b>
            <em>{p.function}</em>
          </span>
        </div>
        <dl className="mini-dl">
          {d.facts.map(([a, b]) => (
            <div key={a}>
              <dt>{a}</dt>
              <dd>{b}</dd>
            </div>
          ))}
        </dl>
      </Section>
      <Section title="ACTIVE CONDITIONS">
        <Tag text={p.condition} />
        {d.tags.map((x) => (
          <Tag key={x} text={x} />
        ))}
      </Section>
      <Section title="MEDICATIONS & ALLERGIES">
        <div className="med-row">
          <Pill />
          <span>
            <b>{p.meds}</b>
            <small>
              {p.name === 'Margaret Lewis' || p.name === 'Noah Bennett'
                ? 'Not supplied in source record · verify before ordering'
                : 'Active · care partner administers'}
            </small>
          </span>
        </div>
      </Section>
      <Section title="RECENT NOTES">
        <p className="record-note">{d.note}</p>
      </Section>
      <div className="sync-note">
        <Activity />
        <span>
          <b>Guardian-app summary unchanged</b>
          <small>Waiting for the new guardian-app data model.</small>
        </span>
      </div>
    </div>
  );
}
function Summary({ p }: { p: Patient }) {
  const d = profile(p);
  return (
    <div className="panel-scroll">
      <div className="ai-banner">
        <Sparkles />
        <span>
          <small>LIVE DRAFT · REVIEW REQUIRED</small>
          <b>Conversation summary</b>
        </span>
      </div>
      <Section title="KEY POINTS">
        <ul>
          {d.points.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </Section>
      <Section title="WATCH CLOSELY">
        <div className="attention">
          {d.watch.map((x) => (
            <span key={x}>
              <i />
              {x}
            </span>
          ))}
        </div>
      </Section>
      <p className="ai-disclaimer">
        <ShieldCheck />
        AI draft. Clinician review required before filing.
      </p>
    </div>
  );
}
function Plan({ p }: { p: Patient }) {
  const d = profile(p);
  return (
    <div className="panel-scroll">
      <Section title="NEXT STEPS">
        <div className="plan-list">
          {d.steps.map(([a, b], i) => (
            <label key={a}>
              <input type="checkbox" defaultChecked={i === 0} />
              <span>
                <b>{a}</b>
                <small>{b}</small>
              </span>
            </label>
          ))}
        </div>
      </Section>
      <Section title="CARE-PARTNER GUIDANCE">
        <p className="record-note">
          Review the daily routine, communication needs, home safety, medication
          supervision, and condition-specific urgent warning signs.
        </p>
      </Section>
      <div className="decision-note">
        <Sparkles />
        <span>
          <b>Decision support only</b>
          <small>Clinical judgment required.</small>
        </span>
      </div>
    </div>
  );
}
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="visit-section">
      <small>{title}</small>
      {children}
    </section>
  );
}
function Tag({ text }: { text: string }) {
  return <span className="record-tag">{text}</span>;
}
function ActionModal({
  kind,
  patient: p,
  close,
  sent,
}: {
  kind: 'test' | 'rx';
  patient: Patient;
  close: () => void;
  sent: (x: string) => void;
}) {
  const [test, setTest] = useState(
      p.name === 'Noah Bennett'
        ? 'Adaptive behavior caregiver questionnaire'
        : p.name === 'Margaret Lewis'
          ? 'Caregiver functional assessment'
          : 'MoCA remote follow-up',
    ),
    [med, setMed] = useState('Select medication'),
    [dose, setDose] = useState(''),
    [working, setWorking] = useState(false),
    [error, setError] = useState('');
  async function submit() {
    setWorking(true);
    setError('');
    try {
      if (kind === 'test') {
        await assignAssessment({
          patientId: p.id,
          code: test.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
          title: test,
          instructions: 'Complete in the Luma patient app with caregiver support.',
          dueAt: '2026-09-08T17:00:00Z',
        });
        sent(`${test} sent to patient app`);
      } else {
        if (med === 'Select medication' || !dose.trim()) throw new Error('Choose a medication and enter dose and directions.');
        await createMedicationPlan({
          patientId: p.id,
          medicationName: med,
          dose: dose.trim(),
          instructions: dose.trim(),
          schedule: { source: 'clinician_workspace' },
          startDate: new Date().toISOString().slice(0, 10),
        });
        sent(`Draft ${med} plan sent to patient record`);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to send this item.');
    } finally {
      setWorking(false);
    }
  }
  return (
    <div className="action-shade" onMouseDown={close}>
      <section
        className="action-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button className="close" onClick={close}>
          <X />
        </button>
        <i>{kind === 'test' ? <ClipboardCheck /> : <Pill />}</i>
        <small>
          {kind === 'test' ? 'REMOTE ASSESSMENT' : 'E-PRESCRIBING DEMO'}
        </small>
        <h2>
          {kind === 'test'
            ? 'Send an assessment'
            : `Medication order for ${p.name.split(' ')[0]}`}
        </h2>
        <p>
          {kind === 'test'
            ? 'Choose a diagnosis-appropriate assessment for the care partner or supervised session.'
            : 'Medication and allergy reconciliation is required before signing.'}
        </p>
        {kind === 'test' ? (
          <>
            <label>
              Assessment
              <select value={test} onChange={(e) => setTest(e.target.value)}>
                <option>Caregiver functional assessment</option>
                <option>Adaptive behavior caregiver questionnaire</option>
                <option>Behavior and trigger diary</option>
                <option>MoCA remote follow-up</option>
                <option>AD8 guardian questionnaire</option>
              </select>
            </label>
            <label>
              Complete by
              <input type="date" defaultValue="2026-09-08" />
            </label>
            <div className="modal-check">
              <Check />
              Include accessible instructions for the care partner
            </div>
          </>
        ) : (
          <>
            <label>
              Medication
              <select value={med} onChange={(e) => setMed(e.target.value)}>
                <option>Select medication</option>
                <option>Donepezil</option>
                <option>Rivastigmine patch</option>
                <option>Memantine</option>
              </select>
            </label>
            <label>
              Dose and directions
              <input
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                placeholder="Enter after clinical review"
              />
            </label>
            <label>
              Pharmacy
              <input placeholder="Select pharmacy" />
            </label>
            <div className="rx-warning">
              <ShieldCheck />
              Demo only. This does not create or transmit a real prescription.
            </div>
          </>
        )}
        {error && <div className="login-error">{error}</div>}
        <footer>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={working}>
            {kind === 'test' ? <Send /> : <Pill />}
            {working ? 'Sending…' : kind === 'test' ? 'Send to patient app' : 'Create draft order'}
          </Button>
        </footer>
      </section>
    </div>
  );
}
