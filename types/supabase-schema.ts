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
      academic_years: {
        Row: {
          created_at: string
          is_active: boolean
          parsed_term: string | null
          parsed_title: string | null
          parsed_year: string | null
          raw_title: string
          year_code: string
        }
        Insert: {
          created_at?: string
          is_active?: boolean
          parsed_term?: string | null
          parsed_title?: string | null
          parsed_year?: string | null
          raw_title: string
          year_code: string
        }
        Update: {
          created_at?: string
          is_active?: boolean
          parsed_term?: string | null
          parsed_title?: string | null
          parsed_year?: string | null
          raw_title?: string
          year_code?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          academic_year: string
          created_at: string
          id: number
          is_active: boolean
          parsed_academic_year: string | null
          parsed_course_name: string | null
          parsed_specialisation: string | null
          parsed_year: string | null
          raw_code: string
          raw_course_name: string
        }
        Insert: {
          academic_year: string
          created_at?: string
          id?: number
          is_active?: boolean
          parsed_academic_year?: string | null
          parsed_course_name?: string | null
          parsed_specialisation?: string | null
          parsed_year?: string | null
          raw_code: string
          raw_course_name: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          id?: number
          is_active?: boolean
          parsed_academic_year?: string | null
          parsed_course_name?: string | null
          parsed_specialisation?: string | null
          parsed_year?: string | null
          raw_code?: string
          raw_course_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_academic_year_fkey"
            columns: ["academic_year"]
            referencedRelation: "academic_years"
            referencedColumns: ["year_code"]
          }
        ]
      }
      module_schedules: {
        Row: {
          created_at: string
          day: string | null
          group: string | null
          id: number
          index: number | null
          is_active: boolean
          module: number
          remarks: string | null
          time: string | null
          type: string | null
          venue: string | null
        }
        Insert: {
          created_at?: string
          day?: string | null
          group?: string | null
          id?: number
          index?: number | null
          is_active?: boolean
          module: number
          remarks?: string | null
          time?: string | null
          type?: string | null
          venue?: string | null
        }
        Update: {
          created_at?: string
          day?: string | null
          group?: string | null
          id?: number
          index?: number | null
          is_active?: boolean
          module?: number
          remarks?: string | null
          time?: string | null
          type?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "module_schedules_module_fkey"
            columns: ["module"]
            referencedRelation: "modules"
            referencedColumns: ["id"]
          }
        ]
      }
      modules: {
        Row: {
          course: number
          created_at: string
          id: number
          is_active: boolean
          parsed_credits: string | null
          parsed_module_code: string | null
          parsed_module_name: string | null
          prerequisites: string | null
          remarks: string | null
        }
        Insert: {
          course: number
          created_at?: string
          id?: number
          is_active?: boolean
          parsed_credits?: string | null
          parsed_module_code?: string | null
          parsed_module_name?: string | null
          prerequisites?: string | null
          remarks?: string | null
        }
        Update: {
          course?: number
          created_at?: string
          id?: number
          is_active?: boolean
          parsed_credits?: string | null
          parsed_module_code?: string | null
          parsed_module_name?: string | null
          prerequisites?: string | null
          remarks?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_fkey"
            columns: ["course"]
            referencedRelation: "courses"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
