import {supabase} from './supabase'

export type CareObservationCategory='medication'|'sleep'|'activity'|'nutrition'|'mood'|'behavior'|'function'|'safety'|'other'
export type ObservationSeverity='routine'|'watch'|'urgent'

function configured(){
 if(!supabase)throw new Error('Supabase is not configured for this build.')
 return supabase
}

export async function listMyPatients(){
 const client=configured()
 const {data,error}=await client.from('patient_access').select('relationship,can_record,can_assign,patients(*)').eq('status','active')
 if(error)throw error
 return data
}

export async function recordCareObservation(input:{patientId:string;category:CareObservationCategory;severity?:ObservationSeverity;valueNumber?:number;valueText?:string;unit?:string;metadata?:Record<string,unknown>}){
 const client=configured()
 const {data:{user},error:userError}=await client.auth.getUser()
 if(userError)throw userError
 if(!user)throw new Error('Sign in before recording care data.')
 const {data,error}=await client.from('care_observations').insert({patient_id:input.patientId,recorded_by:user.id,category:input.category,severity:input.severity??'routine',value_number:input.valueNumber??null,value_text:input.valueText??null,unit:input.unit??null,metadata:input.metadata??{},source:'caregiver'}).select().single()
 if(error)throw error
 return data
}

export async function listAssignedCareTasks(patientId:string){
 const client=configured()
 const [assessments,medications]=await Promise.all([
  client.from('assessment_assignments').select('*').eq('patient_id',patientId).in('status',['assigned','in_progress']).order('due_at'),
  client.from('medication_plans').select('*').eq('patient_id',patientId).eq('status','active').order('created_at')
 ])
 if(assessments.error)throw assessments.error
 if(medications.error)throw medications.error
 return{assessments:assessments.data,medications:medications.data}
}

export async function recordMedicationEvent(input:{patientId:string;medicationPlanId:string;status:'taken'|'missed'|'declined'|'unable'|'unknown';scheduledAt?:string;note?:string}){
 const client=configured()
 const {data:{user},error:userError}=await client.auth.getUser()
 if(userError)throw userError
 if(!user)throw new Error('Sign in before recording medication data.')
 const {data,error}=await client.from('medication_events').insert({patient_id:input.patientId,medication_plan_id:input.medicationPlanId,recorded_by:user.id,status:input.status,scheduled_at:input.scheduledAt??null,note:input.note??null}).select().single()
 if(error)throw error
 return data
}

export async function submitAssessmentResponse(input:{assignmentId:string;patientId:string;answers:Record<string,unknown>;score?:number}){
 const client=configured()
 const {data:{user},error:userError}=await client.auth.getUser()
 if(userError)throw userError
 if(!user)throw new Error('Sign in before submitting an assessment.')
 const {data,error}=await client.from('assessment_responses').upsert({assignment_id:input.assignmentId,patient_id:input.patientId,respondent_id:user.id,answers:input.answers,score:input.score??null,completed_at:new Date().toISOString()},{onConflict:'assignment_id'}).select().single()
 if(error)throw error
 await client.from('assessment_assignments').update({status:'completed',updated_at:new Date().toISOString()}).eq('id',input.assignmentId)
 return data
}
