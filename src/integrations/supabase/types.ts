export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      amenities: {
        Row: {
          capacity: number | null
          condominium_id: string
          created_at: string
          id: string
          name: string
          requires_booking: boolean | null
        }
        Insert: {
          capacity?: number | null
          condominium_id: string
          created_at?: string
          id?: string
          name: string
          requires_booking?: boolean | null
        }
        Update: {
          capacity?: number | null
          condominium_id?: string
          created_at?: string
          id?: string
          name?: string
          requires_booking?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "amenities_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      amenity_checkins: {
        Row: {
          amenity_id: string
          checkin_time: string
          checkout_time: string | null
          created_at: string
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          amenity_id: string
          checkin_time?: string
          checkout_time?: string | null
          created_at?: string
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          amenity_id?: string
          checkin_time?: string
          checkout_time?: string | null
          created_at?: string
          id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "amenity_checkins_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_members: {
        Row: {
          club_id: string
          id: string
          joined_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          club_id: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          club_id?: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          image_url: string | null
          member_count: number | null
          name: string
          sport_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          image_url?: string | null
          member_count?: number | null
          name: string
          sport_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          image_url?: string | null
          member_count?: number | null
          name?: string
          sport_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clubs_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      condominiums: {
        Row: {
          created_at: string
          id: string
          invite_code: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string
          name?: string
        }
        Relationships: []
      }
      event_comments: {
        Row: {
          comment_text: string
          created_at: string
          event_id: string
          id: string
          parent_comment_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string
          event_id: string
          id?: string
          parent_comment_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string
          event_id?: string
          id?: string
          parent_comment_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_comments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "event_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          evaluation_status: string | null
          event_id: string
          id: string
          joined_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          evaluation_status?: string | null
          event_id: string
          id?: string
          joined_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          evaluation_status?: string | null
          event_id?: string
          id?: string
          joined_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          age_group: string | null
          amenity_id: string | null
          condominium_id: string | null
          created_at: string | null
          created_by: string
          custom_sport_name: string | null
          date: string
          description: string | null
          gender: string | null
          has_pcd_structure: boolean | null
          id: string
          image_url: string | null
          latitude: number | null
          location: string
          location_reference: string | null
          longitude: number | null
          max_participants: number | null
          participant_count: number | null
          pcd_types: string[] | null
          requires_approval: boolean | null
          skill_level: string | null
          sport_id: string | null
          status: string | null
          time: string
          title: string
          updated_at: string | null
        }
        Insert: {
          age_group?: string | null
          amenity_id?: string | null
          condominium_id?: string | null
          created_at?: string | null
          created_by: string
          custom_sport_name?: string | null
          date: string
          description?: string | null
          gender?: string | null
          has_pcd_structure?: boolean | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          location: string
          location_reference?: string | null
          longitude?: number | null
          max_participants?: number | null
          participant_count?: number | null
          pcd_types?: string[] | null
          requires_approval?: boolean | null
          skill_level?: string | null
          sport_id?: string | null
          status?: string | null
          time: string
          title: string
          updated_at?: string | null
        }
        Update: {
          age_group?: string | null
          amenity_id?: string | null
          condominium_id?: string | null
          created_at?: string | null
          created_by?: string
          custom_sport_name?: string | null
          date?: string
          description?: string | null
          gender?: string | null
          has_pcd_structure?: boolean | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          location?: string
          location_reference?: string | null
          longitude?: number | null
          max_participants?: number | null
          participant_count?: number | null
          pcd_types?: string[] | null
          requires_approval?: boolean | null
          skill_level?: string | null
          sport_id?: string | null
          status?: string | null
          time?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          club_id: string | null
          content: string
          created_at: string | null
          event_id: string | null
          id: string
          message_type: string | null
          recipient_id: string | null
          sender_id: string
        }
        Insert: {
          club_id?: string | null
          content: string
          created_at?: string | null
          event_id?: string | null
          id?: string
          message_type?: string | null
          recipient_id?: string | null
          sender_id: string
        }
        Update: {
          club_id?: string | null
          content?: string
          created_at?: string | null
          event_id?: string | null
          id?: string
          message_type?: string | null
          recipient_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_lists: {
        Row: {
          created_at: string
          event_id: string
          guest_document: string | null
          guest_name: string
          id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          guest_document?: string | null
          guest_name: string
          id?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          guest_document?: string | null
          guest_name?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_lists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      matchmaking_requests: {
        Row: {
          condominium_id: string
          created_at: string
          id: string
          sport_name: string
          status: string | null
          time_preference: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          condominium_id: string
          created_at?: string
          id?: string
          sport_name: string
          status?: string | null
          time_preference?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          condominium_id?: string
          created_at?: string
          id?: string
          sport_name?: string
          status?: string | null
          time_preference?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matchmaking_requests_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matchmaking_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          accessibility_needs: string[] | null
          apt_number: string | null
          birth_date: string | null
          block_number: string | null
          city: string | null
          condominium_id: string | null
          created_at: string
          full_name: string
          gender: string | null
          id: string
          is_admin: boolean | null
          phone: string | null
          profile_photo_url: string | null
          total_reviews_received: number | null
          updated_at: string
          user_id: string
          user_rating: number | null
        }
        Insert: {
          accessibility_needs?: string[] | null
          apt_number?: string | null
          birth_date?: string | null
          block_number?: string | null
          city?: string | null
          condominium_id?: string | null
          created_at?: string
          full_name?: string
          gender?: string | null
          id?: string
          is_admin?: boolean | null
          phone?: string | null
          profile_photo_url?: string | null
          total_reviews_received?: number | null
          updated_at?: string
          user_id: string
          user_rating?: number | null
        }
        Update: {
          accessibility_needs?: string[] | null
          apt_number?: string | null
          birth_date?: string | null
          block_number?: string | null
          city?: string | null
          condominium_id?: string | null
          created_at?: string
          full_name?: string
          gender?: string | null
          id?: string
          is_admin?: boolean | null
          phone?: string | null
          profile_photo_url?: string | null
          total_reviews_received?: number | null
          updated_at?: string
          user_id?: string
          user_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          event_id: string
          id: string
          praise_tags: string[] | null
          rating: number | null
          review_type: string
          reviewed_user_id: string | null
          reviewer_user_id: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          event_id: string
          id?: string
          praise_tags?: string[] | null
          rating?: number | null
          review_type: string
          reviewed_user_id?: string | null
          reviewer_user_id: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          event_id?: string
          id?: string
          praise_tags?: string[] | null
          rating?: number | null
          review_type?: string
          reviewed_user_id?: string | null
          reviewer_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sport_suggestions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sport_name: string
          status: string
          suggested_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sport_name: string
          status?: string
          suggested_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sport_name?: string
          status?: string
          suggested_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sports: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      suggested_sports: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          name: string
          status: string
          suggested_by: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          name: string
          status?: string
          suggested_by?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          name?: string
          status?: string
          suggested_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_ratings: {
        Row: {
          comment: string | null
          created_at: string | null
          event_id: string
          id: string
          rated_user_id: string
          rater_user_id: string
          rating: number
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          rated_user_id: string
          rater_user_id: string
          rating: number
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          rated_user_id?: string
          rater_user_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_ratings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sports: {
        Row: {
          created_at: string
          id: string
          sport_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          sport_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          sport_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sports_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      user_statistics: {
        Row: {
          full_name: string | null
          member_since: string | null
          organized_events_count: number | null
          participations_count: number | null
          user_id: string | null
        }
        Insert: {
          full_name?: string | null
          member_since?: string | null
          organized_events_count?: never
          participations_count?: never
          user_id?: string | null
        }
        Update: {
          full_name?: string | null
          member_since?: string | null
          organized_events_count?: never
          participations_count?: never
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_participant: {
        Args: { p_event_id: string; p_participant_id: string }
        Returns: undefined
      }
      approve_sport_suggestion: {
        Args: { suggestion_id: string }
        Returns: undefined
      }
      auto_finalize_events: { Args: never; Returns: undefined }
      calculate_user_rating: {
        Args: { target_user_id: string }
        Returns: number
      }
      get_public_profile: {
        Args: { target_user_id: string }
        Returns: {
          created_at: string
          full_name: string
          profile_photo_url: string
          user_id: string
        }[]
      }
      get_valid_organized_events_count: {
        Args: { user_id_param: string }
        Returns: number
      }
      get_valid_participation_count: {
        Args: { user_id_param: string }
        Returns: number
      }
      reject_participant: {
        Args: { p_event_id: string; p_participant_id: string }
        Returns: undefined
      }
      reject_sport_suggestion: {
        Args: { reason?: string; suggestion_id: string }
        Returns: undefined
      }
      search_events_normalized: {
        Args: { search_query: string }
        Returns: {
          date: string
          description: string
          id: string
          image_url: string
          location: string
          max_participants: number
          participant_count: number
          skill_level: string
          status: string
          time_field: string
          title: string
        }[]
      }
      search_profiles_normalized: {
        Args: { search_query: string }
        Returns: {
          city: string
          full_name: string
          profile_photo_url: string
          user_id: string
        }[]
      }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
