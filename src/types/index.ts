// src/types/index.ts

export type AuthorityType = 
  | 'water'                   // المؤسسة العامة لمياه الشرب
  | 'electricity'             // الشركة العامة للكهرباء
  | 'sanitation'              // مديرية الصرف الصحي
  | 'telecom'                 // الشركة السورية للاتصالات
  | 'paving'                  // مديرية الصيانة والتعبيد البلدية
  | 'municipality_maintenance'; // الصيانة العامة

export type WorkType = 
  | 'water'
  | 'electricity'
  | 'sanitation'
  | 'telecom'
  | 'paving';

export type ProjectStatus = 'planned' | 'in_progress' | 'completed' | 'suspended';

export type ExtractionSource = 'offline_parser' | 'real_ai' | 'simulated_ai' | 'manual_entry';

export interface Zone {
  id: string;
  name_ar: string;
  neighborhood_ar: string;
  aliases: string[];
}

export interface Project {
  document_reference?: string;
  document_date?: string;
  analysis_warnings?: string[];
  analysis_evidence?: { field: string; quote: string }[];
  id: string;
  code: string; // e.g. "PRJ-2026-001"
  authority: AuthorityType;
  authority_name_ar: string;
  work_type: WorkType;
  work_type_name_ar: string;
  title_ar: string;
  original_text: string;
  zone_id: string;
  zone_name_ar: string;
  street_segment: string;
  landmark?: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  duration_days: number;
  status: ProjectStatus;
  source: ExtractionSource;
  location_confidence: number; // 0.0 to 1.0
  location_review_needed: boolean;
  road_length_m: number;
  road_width_m: number;
  created_at: string;
  is_synthetic: boolean;
}

export type ConflictSeverity = 'high' | 'notice' | 'review' | 'medium';

export type ConflictType = 
  | 'paving_sequence_notice'         // Non-overlapping sequencing/safety advice
  | 'paving_conflict'                 // تعارض مع التزفيت (blocking)
  | 'paving_before_excavation'         // تعارض مع التزفيت (alias for compatibility)
  | 'utility_coordination_notice'     // تنبيه تنسيقي (non-blocking)
  | 'overlapping_excavation'          // تنبيه تنسيقي (alias for compatibility)
  | 'same_work_type_collision'        // تنبيه تنسيقي (alias for compatibility)
  | 'uncertain_location_review'       // بحاجة إلى مراجعة
  | 'spatial_proximity_needs_review'  // بحاجة إلى مراجعة (alias for compatibility)
  | 'no_conflict';                    // لا يوجد تعارض

export interface Conflict {
  id: string;
  project_a_id: string; // Project A (e.g. Underground digging)
  project_b_id: string; // Project B (e.g. Paving or another digging)
  conflict_type: ConflictType;
  conflict_type_label_ar: string; // "تعارض مع التزفيت" | "تنبيه تنسيقي" | "بحاجة إلى مراجعة" | "لا يوجد تعارض"
  severity: ConflictSeverity;
  is_blocking: boolean; // Only true for confirmed paving-related blocking conflicts!
  explanation: string;
  zone_id: string;
  zone_name_ar: string;
  street_segment: string;
  temporal_overlap_days: number;
  status: 'detected' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  // Practical operational resolution fields
  resolved_at?: string;
  resolved_by?: string;
  resolution_type?: 'rescheduled' | 'location_corrected' | 'joint_execution' | 'dismissed_with_reason';
  resolution_notes?: string;
  protocol_number?: string;
  avoided_cost_syp?: number;
  approved_paving_date?: string;
}

export interface CoordinationDecision {
  id: string;
  conflict_id: string;
  protocol_number: string;
  paving_project_id: string;
  predecessor_project_ids: string[];
  predecessor_completion_date: string;
  original_start_date?: string; // Rescheduled project's date before this decision
  safety_buffer_days: number;
  proposed_paving_date: string;
  approved_paving_date: string | null;
  road_length_m: number;
  road_width_m: number;
  cost_per_m2: number;
  estimated_avoidable_cost: number;
  review_status: 'pending' | 'approved' | 'rejected' | 'modified';
  reviewed_by?: string;
  reviewed_at?: string;
  notes?: string;
  action_applied_to_project?: boolean;
  rescheduled_project_id?: string;
  coordination_type?: 'paving_stagger' | 'same_work_stagger' | 'excavation_stagger' | 'utility_coordination';
}

export interface ZoneMatchResult {
  matchedZone: Zone | null;
  confidence: number;
  matchedAlias?: string;
  isAmbiguous: boolean;
  candidateZones: { zone: Zone; score: number; reason: string }[];
}

export interface ExtractedWorkOrder {
  document_reference?: string;
  document_date?: string;
  warnings?: string[];
  evidence?: { field: string; quote: string }[];

  authority: AuthorityType | '';
  authority_name_ar: string;
  work_type: WorkType | '';
  work_type_name_ar: string;
  title_ar: string;
  original_location: string;
  neighborhood: string;
  street: string;
  zone_id: string;
  zone_name_ar: string;
  street_segment: string;
  landmark: string;
  start_date: string;
  duration_days: number;
  end_date: string;
  missing_fields: string[];
  location_confidence: number;
  location_review_needed: boolean;
  extraction_source: ExtractionSource;
  road_length_m: number;
  road_width_m: number;
}
