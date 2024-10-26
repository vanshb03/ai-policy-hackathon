export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      establishments: {
        Row: {
          id: number
          name: string
          address: string
          city: string
          state: string
          postal_code: string
          latitude: number | null
          longitude: number | null
          created_at: string
        }
        Insert: {
          id?: never
          name: string
          address: string
          city: string
          state: string
          postal_code: string
          latitude?: number | null
          longitude?: number | null
          created_at?: string
        }
        Update: {
          id?: never
          name?: string
          address?: string
          city?: string
          state?: string
          postal_code?: string
          latitude?: number | null
          longitude?: number | null
          created_at?: string
        }
      }
      cases: {
        Row: {
          id: number
          establishment_id: number | null
          report_date: string
          onset_date: string | null
          symptoms: string[] | null
          foods_consumed: string[] | null
          patient_count: number | null
          status: string | null
          created_at: string
        }
        Insert: {
          id?: never
          establishment_id?: number | null
          report_date: string
          onset_date?: string | null
          symptoms?: string[] | null
          foods_consumed?: string[] | null
          patient_count?: number | null
          status?: string | null
          created_at?: string
        }
        Update: {
          id?: never
          establishment_id?: number | null
          report_date?: string
          onset_date?: string | null
          symptoms?: string[] | null
          foods_consumed?: string[] | null
          patient_count?: number | null
          status?: string | null
          created_at?: string
        }
      }
      alerts: {
        Row: {
          id: number
          establishment_id: number | null
          alert_type: string
          severity: string
          case_count: number
          details: string | null
          created_at: string
        }
        Insert: {
          id?: never
          establishment_id?: number | null
          alert_type: string
          severity: string
          case_count: number
          details?: string | null
          created_at?: string
        }
        Update: {
          id?: never
          establishment_id?: number | null
          alert_type?: string
          severity?: string
          case_count?: number
          details?: string | null
          created_at?: string
        }
      }
    }
  }
}