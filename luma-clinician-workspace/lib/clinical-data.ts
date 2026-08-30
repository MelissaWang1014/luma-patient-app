import { supabase } from './supabase';

function configured() {
  if (!supabase) throw new Error('Supabase is not configured for this build.');
  return supabase;
}

export async function linkSyntheticPatient(
  externalRef: 'SYN-ALZ-084' | 'SYN-ASD-020',
) {
  const client = configured();
  const { data, error } = await client.rpc('link_synthetic_demo_patient', {
    target_ref: externalRef,
    requested_relationship: 'clinician',
  });
  if (error) throw error;
  return data;
}

export async function createPatientInvitation(input: {
  name: string;
  dateOfBirth?: string;
  condition?: string;
  communicationNeeds?: string;
}) {
  const client = configured();
  const { data, error } = await client.rpc('create_patient_invitation', {
    patient_name: input.name,
    patient_dob: input.dateOfBirth || null,
    condition_text: input.condition || null,
    communication_text: input.communicationNeeds || null,
  });
  if (error) throw error;
  return data?.[0] as
    | { patient_id: string; invitation_code: string; expires_at: string }
    | undefined;
}

async function currentClinician() {
  const client = configured();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error('Clinician sign-in is required.');
  return user;
}

export async function loadClinicalPanel() {
  const client = configured();
  const { data, error } = await client
    .from('patient_access')
    .select('relationship,patients(*,patient_summaries(*),clinical_alerts(*))')
    .eq('relationship', 'clinician')
    .eq('status', 'active');
  if (error) throw error;
  return data;
}

export async function assignAssessment(input: {
  patientId: string;
  assignedTo?: string;
  code: string;
  title: string;
  instructions?: string;
  dueAt?: string;
}) {
  const client = configured(),
    clinician = await currentClinician();
  const { data, error } = await client
    .from('assessment_assignments')
    .insert({
      patient_id: input.patientId,
      assigned_by: clinician.id,
      assigned_to: input.assignedTo ?? null,
      assessment_code: input.code,
      title: input.title,
      instructions: input.instructions ?? null,
      due_at: input.dueAt ?? null,
      status: 'assigned',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createMedicationPlan(input: {
  patientId: string;
  medicationName: string;
  dose: string;
  instructions: string;
  schedule?: Record<string, unknown>;
  startDate?: string;
}) {
  const client = configured(),
    clinician = await currentClinician();
  const { data, error } = await client
    .from('medication_plans')
    .insert({
      patient_id: input.patientId,
      ordered_by: clinician.id,
      medication_name: input.medicationName,
      dose: input.dose,
      instructions: input.instructions,
      schedule: input.schedule ?? {},
      start_date: input.startDate ?? null,
      status: 'draft',
      reconciliation_status: 'unverified',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function loadPatientTimeline(patientId: string) {
  const client = configured();
  const [observations, medications, assessments, summaries, alerts] =
    await Promise.all([
      client
        .from('care_observations')
        .select('*')
        .eq('patient_id', patientId)
        .order('observed_at', { ascending: false })
        .limit(100),
      client
        .from('medication_events')
        .select('*,medication_plans(medication_name,dose)')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false })
        .limit(100),
      client
        .from('assessment_assignments')
        .select('*,assessment_responses(*)')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false }),
      client
        .from('patient_summaries')
        .select('*')
        .eq('patient_id', patientId)
        .order('period_end', { ascending: false })
        .limit(4),
      client
        .from('clinical_alerts')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);
  for (const result of [
    observations,
    medications,
    assessments,
    summaries,
    alerts,
  ])
    if (result.error) throw result.error;
  return {
    observations: observations.data,
    medications: medications.data,
    assessments: assessments.data,
    summaries: summaries.data,
    alerts: alerts.data,
  };
}

export async function refreshPatientSummary(
  patientId: string,
  startDate?: string,
  endDate?: string,
) {
  const client = configured();
  const { data, error } = await client.rpc('refresh_patient_summary', {
    target_patient: patientId,
    range_start: startDate ?? undefined,
    range_end: endDate ?? undefined,
  });
  if (error) throw error;
  return data;
}
