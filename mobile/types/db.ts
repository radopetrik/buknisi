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
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          ordering: number
        }
        Insert: {
          id?: string
          name: string
          slug: string
          ordering?: number
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          ordering?: number
        }
      }
      sub_categories: {
        Row: {
          id: string
          category_id: string
          name: string
          slug: string
          ordering: number
        }
        Insert: {
          id?: string
          category_id: string
          name: string
          slug: string
          ordering?: number
        }
        Update: {
          id?: string
          category_id?: string
          name?: string
          slug?: string
          ordering?: number
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          slug: string
          category_id: string | null
          sub_category_id: string | null
          city_id: string | null
          address_text: string | null
          description: string | null
          phone: string | null
          email: string | null
          website: string | null
          facebook: string | null
          instagram: string | null
          is_mobile: boolean
          rating: number | null
          rating_count: number | null
          review_rank: number | null
          contact_phone: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          category_id?: string | null
          sub_category_id?: string | null
          city_id?: string | null
          address_text?: string | null
          description?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          facebook?: string | null
          instagram?: string | null
          is_mobile?: boolean
          rating?: number | null
          rating_count?: number | null
          review_rank?: number | null
          contact_phone?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          category_id?: string | null
          sub_category_id?: string | null
          city_id?: string | null
          address_text?: string | null
          description?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          facebook?: string | null
          instagram?: string | null
          is_mobile?: boolean
          rating?: number | null
          rating_count?: number | null
          review_rank?: number | null
          contact_phone?: string | null
        }
      }
      cities: {
        Row: {
          id: string
          name: string
          slug: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
      staff_role: 'basic' | 'staffer' | 'reception' | 'manager'
      price_type: 'fixed' | 'free' | 'dont_show' | 'starts_at'
      time_off_reason: 'sick_day' | 'vacation' | 'training'
    }
  }
}
