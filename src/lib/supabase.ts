import { createClient, type Session } from '@supabase/supabase-js'

const url=import.meta.env.VITE_SUPABASE_URL?.trim()
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

export const isSupabaseConfigured=Boolean(url&&key)
export const supabase=isSupabaseConfigured?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null

export async function getSession():Promise<Session|null>{
 if(!supabase)return null
 const {data,error}=await supabase.auth.getSession()
 if(error)throw error
 return data.session
}

export async function signIn(email:string,password:string){
 if(!supabase)throw new Error('Database connection is not configured yet.')
 const {data,error}=await supabase.auth.signInWithPassword({email,password})
 if(error)throw error
 return data.session
}

export async function signUp(name:string,email:string,password:string){
 if(!supabase)throw new Error('Database connection is not configured yet.')
 const {data,error}=await supabase.auth.signUp({email,password,options:{data:{full_name:name,role:'caregiver'}}})
 if(error)throw error
 return data.session
}

export async function saveJournal(userId:string,title:string,body:string){
 if(!supabase)return
 const {error}=await supabase.from('journal_entries').insert({patient_id:userId,title,body,entry_date:new Date().toISOString().slice(0,10)})
 if(error)throw error
}

export async function loadLatestJournal(userId:string){
 if(!supabase)return null
 const {data,error}=await supabase.from('journal_entries').select('title,body').eq('patient_id',userId).order('created_at',{ascending:false}).limit(1).maybeSingle()
 if(error)throw error
 return data
}

export async function saveCheckIn(userId:string,content:string){
 if(!supabase)return
 const {error}=await supabase.from('check_ins').insert({patient_id:userId,content})
 if(error)throw error
}

export async function saveMedicalRecordMetadata(userId:string,file:File){
 if(!supabase)return
 const {error}=await supabase.from('medical_records').insert({patient_id:userId,file_name:file.name,mime_type:file.type||null,file_size:file.size})
 if(error)throw error
}
