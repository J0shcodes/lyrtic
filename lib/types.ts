// ============================================================================
// Authentication & Organization Types
// ============================================================================

export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  email_verified: boolean
  created_at: string
  updated_at: string
  deleted_at?: string | null
//   password_hash: string
}

export interface DbUser extends User {
    password_hash: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url?: string
  plan: 'free' | 'starter' | 'growth' | 'business'
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export interface Membership {
  id: string
  user_id: string
  organization_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  invited_by?: string
  accepted_at?: string
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  user_id: string
  token: string
  expires_at: string
  user_agent?: string
  ip_address?: string
  created_at: string
}

// ============================================================================
// Customer Types
// ============================================================================

export interface Customer {
  id: string
  organization_id: string
  email: string
  full_name?: string
  phone?: string
  location?: string
  customer_id?: string
  status: 'active' | 'inactive' | 'churned'
  lifecycle_stage: 'lead' | 'prospect' | 'customer' | 'churned'
  health_score: number
  churn_risk: 'low' | 'medium' | 'high' | 'critical'
  last_interaction?: string
  notes?: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export interface Transaction {
  id: string
  organization_id: string
  customer_id: string
  transaction_id: string
  amount: number
  currency: string
  transaction_date: string
  category?: string
  description?: string
  payment_method?: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  organization_id: string
  customer_id: string
  event_type: string
  event_name: string
  event_date: string
  properties: Record<string, unknown>
  created_at: string
}

// ============================================================================
// Segmentation Types
// ============================================================================

export interface Segment {
  id: string
  organization_id: string
  name: string
  description?: string
  criteria: Record<string, unknown>
  criteria_logic: 'AND' | 'OR'
  customer_count: number
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export interface SegmentMembership {
  id: string
  segment_id: string
  customer_id: string
  added_at: string
}

// ============================================================================
// Insights & AI Types
// ============================================================================

export interface Insight {
  id: string
  organization_id: string
  customer_id?: string
  segment_id?: string
  insight_type: string
  title: string
  content: string
  summary?: string
  confidence: number
  generated_by: 'claude' | 'rule-based'
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

// ============================================================================
// Import Types
// ============================================================================

export interface Import {
  id: string
  organization_id: string
  created_by: string
  file_name: string
  blob_url: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  total_rows?: number
  successful_rows?: number
  failed_rows?: number
  error_details?: Record<string, unknown>
  field_mapping: Record<string, string>
  created_at: string
  updated_at: string
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// ============================================================================
// Dashboard & Analytics Types
// ============================================================================

export interface DashboardMetrics {
  totalCustomers: number
  activeCustomers: number
  churnedCustomers: number
  averageHealthScore: number
  criticalRiskCount: number
  totalRevenue: number
  revenueThisMonth: number
  customersByStage: Record<string, number>
  topSegments: Array<{ name: string; count: number }>
}

export interface ChartDataPoint {
  date: string
  value: number
  label?: string
}

// ============================================================================
// Form Types
// ============================================================================

export interface SignUpFormData {
  email: string
  password: string
  full_name: string
  organization_name: string
}

export interface SignInFormData {
  email: string
  password: string
}

export interface CreateSegmentFormData {
  name: string
  description?: string
  criteria: Array<{
    field: string
    operator: string
    value: unknown
  }>
  criteria_logic: 'AND' | 'OR'
}

// ============================================================================
// Service Layer Types
// ============================================================================

export interface CreateCustomerInput {
  email: string
  full_name?: string
  phone?: string
  location?: string
  customer_id?: string
  status?: string
  lifecycle_stage?: string
  notes?: string
  metadata?: Record<string, unknown>
}

export interface UpdateCustomerInput {
  full_name?: string
  phone?: string
  location?: string
  status?: string
  lifecycle_stage?: string
  health_score?: number
  churn_risk?: string
  notes?: string
  metadata?: Record<string, unknown>
}

export interface HealthScoreInput {
  transactions_count: number
  transactions_amount: number
  days_since_last_transaction: number
  customer_age_days: number
  engagement_events: number
  support_tickets: number
}

export interface CreateInsightInput {
  customer_id?: string
  segment_id?: string
  insight_type: string
  title: string
  content: string
  summary?: string
  metadata?: Record<string, unknown>
}

// ============================================================================
// Authentication Context Types
// ============================================================================

export interface AuthContextType {
  user: User | null
  organization: Organization | null
  membership: Membership | null
  loading: boolean
  error: Error | null
  logout: () => Promise<void>
}