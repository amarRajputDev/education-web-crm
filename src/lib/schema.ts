/**
 * SQLite DDL for the Aarohan Institute demo platform.
 * Every statement is idempotent so the schema can be applied on any fresh
 * database as well as on an existing one.
 */
export const SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS schema_migrations (
     version INTEGER PRIMARY KEY,
     applied_at TEXT NOT NULL
   )`,

  `CREATE TABLE IF NOT EXISTS roles (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     key TEXT NOT NULL UNIQUE,
     name TEXT NOT NULL,
     description TEXT DEFAULT '',
     is_system INTEGER NOT NULL DEFAULT 1,
     created_at TEXT NOT NULL DEFAULT (datetime('now'))
   )`,

  `CREATE TABLE IF NOT EXISTS permissions (
     key TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     category TEXT NOT NULL DEFAULT 'general'
   )`,

  `CREATE TABLE IF NOT EXISTS role_permissions (
     role_key TEXT NOT NULL,
     permission_key TEXT NOT NULL,
     PRIMARY KEY (role_key, permission_key)
   )`,

  `CREATE TABLE IF NOT EXISTS users (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT NOT NULL,
     email TEXT NOT NULL UNIQUE,
     phone TEXT DEFAULT '',
     password_hash TEXT NOT NULL,
     role_key TEXT NOT NULL REFERENCES roles(key),
     status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','invited','inactive')),
     designation TEXT DEFAULT '',
     avatar_url TEXT DEFAULT '',
     last_login_at TEXT,
     must_change_password INTEGER NOT NULL DEFAULT 0,
     created_at TEXT NOT NULL DEFAULT (datetime('now')),
     updated_at TEXT NOT NULL DEFAULT (datetime('now'))
   )`,

  `CREATE TABLE IF NOT EXISTS sessions (
     id TEXT PRIMARY KEY,
     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     created_at TEXT NOT NULL DEFAULT (datetime('now')),
     expires_at TEXT NOT NULL,
     last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
     ip TEXT DEFAULT '',
     user_agent TEXT DEFAULT ''
   )`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)`,

  `CREATE TABLE IF NOT EXISTS academic_sessions (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT NOT NULL UNIQUE,
     slug TEXT NOT NULL UNIQUE,
     start_date TEXT,
     end_date TEXT,
     application_deadline TEXT,
     is_current INTEGER NOT NULL DEFAULT 0,
     status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','upcoming','closed')),
     created_at TEXT NOT NULL DEFAULT (datetime('now'))
   )`,

  `CREATE TABLE IF NOT EXISTS departments (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT NOT NULL,
     slug TEXT NOT NULL UNIQUE,
     code TEXT DEFAULT '',
     overview TEXT DEFAULT '',
     head_faculty_id INTEGER,
     image TEXT DEFAULT '/images/gallery-1.jpg',
     visibility TEXT NOT NULL DEFAULT 'published' CHECK (visibility IN ('published','draft')),
     sort_order INTEGER NOT NULL DEFAULT 0,
     seo_title TEXT DEFAULT '',
     seo_description TEXT DEFAULT '',
     created_at TEXT NOT NULL DEFAULT (datetime('now')),
     updated_at TEXT NOT NULL DEFAULT (datetime('now'))
   )`,

  `CREATE TABLE IF NOT EXISTS faculty (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT NOT NULL,
     slug TEXT NOT NULL UNIQUE,
     designation TEXT NOT NULL DEFAULT '',
     department_id INTEGER REFERENCES departments(id),
     qualifications TEXT DEFAULT '',
     experience_years INTEGER NOT NULL DEFAULT 0,
     research_interests TEXT DEFAULT '[]',
     expertise TEXT DEFAULT '[]',
     bio TEXT DEFAULT '',
     email TEXT DEFAULT '',
     phone TEXT DEFAULT '',
     photo TEXT DEFAULT '',
     display_order INTEGER NOT NULL DEFAULT 0,
     visibility TEXT NOT NULL DEFAULT 'published' CHECK (visibility IN ('published','draft')),
     created_at TEXT NOT NULL DEFAULT (datetime('now')),
     updated_at TEXT NOT NULL DEFAULT (datetime('now'))
   )`,
  `CREATE INDEX IF NOT EXISTS idx_faculty_department ON faculty(department_id)`,

  `CREATE TABLE IF NOT EXISTS courses (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT NOT NULL,
     slug TEXT NOT NULL UNIQUE,
     code TEXT DEFAULT '',
     degree_level TEXT NOT NULL DEFAULT 'Undergraduate' CHECK (degree_level IN ('Undergraduate','Postgraduate','Diploma','Certificate','Doctorate')),
     department_id INTEGER REFERENCES departments(id),
     duration_months INTEGER NOT NULL DEFAULT 36,
     duration_label TEXT NOT NULL DEFAULT '3 Years',
     study_mode TEXT NOT NULL DEFAULT 'Full-time' CHECK (study_mode IN ('Full-time','Part-time','Online','Hybrid')),
     seats INTEGER NOT NULL DEFAULT 60,
     eligibility TEXT DEFAULT '',
     overview TEXT DEFAULT '',
     description TEXT DEFAULT '',
     learning_outcomes TEXT DEFAULT '[]',
     curriculum TEXT DEFAULT '[]',
     careers TEXT DEFAULT '[]',
     fee_amount INTEGER DEFAULT 0,
     fee_note TEXT DEFAULT '',
     scholarship_info TEXT DEFAULT '',
     image TEXT DEFAULT '/images/course-cs.jpg',
     status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('published','draft')),
     featured INTEGER NOT NULL DEFAULT 0,
     session_ids TEXT DEFAULT '[]',
     faqs TEXT DEFAULT '[]',
     seo_title TEXT DEFAULT '',
     seo_description TEXT DEFAULT '',
     created_at TEXT NOT NULL DEFAULT (datetime('now')),
     updated_at TEXT NOT NULL DEFAULT (datetime('now'))
   )`,
  `CREATE INDEX IF NOT EXISTS idx_courses_department ON courses(department_id)`,
  `CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status)`,

  `CREATE TABLE IF NOT EXISTS enquiry_statuses (
     key TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     color TEXT NOT NULL DEFAULT 'neutral',
     sort_order INTEGER NOT NULL DEFAULT 0,
     is_system INTEGER NOT NULL DEFAULT 1,
     active INTEGER NOT NULL DEFAULT 1
   )`,

  `CREATE TABLE IF NOT EXISTS application_statuses (
     key TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     color TEXT NOT NULL DEFAULT 'neutral',
     sort_order INTEGER NOT NULL DEFAULT 0,
     requires_reason INTEGER NOT NULL DEFAULT 0,
     active INTEGER NOT NULL DEFAULT 1
   )`,

  `CREATE TABLE IF NOT EXISTS enquiries (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     ref TEXT NOT NULL UNIQUE,
     name TEXT NOT NULL,
     phone TEXT NOT NULL,
     email TEXT NOT NULL DEFAULT '',
     course_id INTEGER REFERENCES courses(id),
     course_interest TEXT DEFAULT '',
     source TEXT NOT NULL DEFAULT 'Website' CHECK (source IN ('Website','Phone','Walk-in','Social Media','Referral','Campaign','Event','Other')),
     source_page TEXT DEFAULT '',
     utm_campaign TEXT DEFAULT '',
     preferred_contact TEXT DEFAULT 'Phone' CHECK (preferred_contact IN ('Phone','Email','WhatsApp')),
     message TEXT DEFAULT '',
     consent INTEGER NOT NULL DEFAULT 0,
     status TEXT NOT NULL DEFAULT 'new',
     priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
     counsellor_id INTEGER REFERENCES users(id),
     tags TEXT DEFAULT '[]',
     last_contacted_at TEXT,
     next_followup_at TEXT,
     is_duplicate INTEGER NOT NULL DEFAULT 0,
     merged_into INTEGER REFERENCES enquiries(id),
     created_at TEXT NOT NULL DEFAULT (datetime('now')),
     updated_at TEXT NOT NULL DEFAULT (datetime('now'))
   )`,
  `CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status)`,
  `CREATE INDEX IF NOT EXISTS idx_enquiries_counsellor ON enquiries(counsellor_id)`,
  `CREATE INDEX IF NOT EXISTS idx_enquiries_created ON enquiries(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_enquiries_phone ON enquiries(phone)`,
  `CREATE INDEX IF NOT EXISTS idx_enquiries_followup ON enquiries(next_followup_at)`,

  `CREATE TABLE IF NOT EXISTS enquiry_notes (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     enquiry_id INTEGER NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
     author_id INTEGER REFERENCES users(id),
     note_type TEXT NOT NULL DEFAULT 'note' CHECK (note_type IN ('note','call','email','whatsapp','meeting')),
     body TEXT NOT NULL,
     outcome TEXT DEFAULT '',
     created_at TEXT NOT NULL DEFAULT (datetime('now'))
   )`,
  `CREATE INDEX IF NOT EXISTS idx_enquiry_notes_enquiry ON enquiry_notes(enquiry_id)`,

  `CREATE TABLE IF NOT EXISTS enquiry_activities (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     enquiry_id INTEGER NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
     actor_id INTEGER REFERENCES users(id),
     action TEXT NOT NULL,
     detail TEXT DEFAULT '',
     created_at TEXT NOT NULL DEFAULT (datetime('now'))
   )`,
  `CREATE INDEX IF NOT EXISTS idx_enquiry_activities_enquiry ON enquiry_activities(enquiry_id)`,

  `CREATE TABLE IF NOT EXISTS follow_up_tasks (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     enquiry_id INTEGER NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
     counsellor_id INTEGER REFERENCES users(id),
     due_at TEXT NOT NULL,
     note TEXT DEFAULT '',
     status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','missed')),
     outcome TEXT DEFAULT '',
     completed_at TEXT,
     reminder_sent INTEGER NOT NULL DEFAULT 0,
     created_by INTEGER REFERENCES users(id),
     created_at TEXT NOT NULL DEFAULT (datetime('now')),
     updated_at TEXT NOT NULL DEFAULT (datetime('now'))
   )`,
  `CREATE INDEX IF NOT EXISTS idx_followups_due ON follow_up_tasks(due_at)`,
  `CREATE INDEX IF NOT EXISTS idx_followups_counsellor ON follow_up_tasks(counsellor_id)`,

  `CREATE TABLE IF NOT EXISTS admission_applications (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     ref TEXT NOT NULL UNIQUE,
     enquiry_id INTEGER REFERENCES enquiries(id),
     full_name TEXT NOT NULL,
     dob TEXT DEFAULT '',
     gender TEXT DEFAULT '',
     email TEXT NOT NULL,
     phone TEXT NOT NULL,
     parent_name TEXT DEFAULT '',
     parent_phone TEXT DEFAULT '',
     qualification TEXT DEFAULT '',
     institution_name TEXT DEFAULT '',
     board TEXT DEFAULT '',
     passing_year TEXT DEFAULT '',
     marks TEXT DEFAULT '',
     course_id INTEGER REFERENCES courses(id),
     course_name TEXT DEFAULT '',
     department_id INTEGER REFERENCES departments(id),
     study_mode TEXT DEFAULT 'Full-time',
     session_id INTEGER REFERENCES academic_sessions(id),
     session_name TEXT DEFAULT '',
     preference2 TEXT DEFAULT '',
     address TEXT DEFAULT '',
     permanent_address TEXT DEFAULT '',
     same_as_current INTEGER NOT NULL DEFAULT 1,
     city TEXT DEFAULT '',
     state TEXT DEFAULT '',
     postal_code TEXT DEFAULT '',
     photo_path TEXT DEFAULT '',
     status TEXT NOT NULL DEFAULT 'submitted',
     document_status TEXT NOT NULL DEFAULT 'pending' CHECK (document_status IN ('pending','partial','complete','verified')),
     reviewer_id INTEGER REFERENCES users(id),
     consent INTEGER NOT NULL DEFAULT 0,
     ip TEXT DEFAULT '',
     source_page TEXT DEFAULT '',
     submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
     updated_at TEXT NOT NULL DEFAULT (datetime('now'))
   )`,
  `CREATE INDEX IF NOT EXISTS idx_applications_status ON admission_applications(status)`,
  `CREATE INDEX IF NOT EXISTS idx_applications_course ON admission_applications(course_id)`,
  `CREATE INDEX IF NOT EXISTS idx_applications_submitted ON admission_applications(submitted_at)`,

  `CREATE TABLE IF NOT EXISTS application_documents (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     application_id INTEGER NOT NULL REFERENCES admission_applications(id) ON DELETE CASCADE,
     doc_type TEXT NOT NULL,
     original_name TEXT NOT NULL,
     stored_name TEXT NOT NULL,
     mime_type TEXT DEFAULT '',
     size_bytes INTEGER DEFAULT 0,
     status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
     remarks TEXT DEFAULT '',
     verified_by INTEGER REFERENCES users(id),
     uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
   )`,
  `CREATE INDEX IF NOT EXISTS idx_documents_application ON application_documents(application_id)`,

  `CREATE TABLE IF NOT EXISTS application_reviews (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     application_id INTEGER NOT NULL REFERENCES admission_applications(id) ON DELETE CASCADE,
     actor_id INTEGER REFERENCES users(id),
     from_status TEXT DEFAULT '',
     to_status TEXT DEFAULT '',
     notes TEXT DEFAULT '',
     decision_reason TEXT DEFAULT '',
     is_internal INTEGER NOT NULL DEFAULT 1,
     created_at TEXT NOT NULL DEFAULT (datetime('now'))
   )`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_application ON application_reviews(application_id)`,

  `CREATE TABLE IF NOT EXISTS events (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     title TEXT NOT NULL,
     slug TEXT NOT NULL UNIQUE,
     category TEXT NOT NULL DEFAULT 'Academic' CHECK (category IN ('Academic','Workshop','Seminar','Cultural','Sports','Admission','Other')),
     summary TEXT DEFAULT '',
     body TEXT DEFAULT '',
     location TEXT DEFAULT '',
     starts_at TEXT NOT NULL,
     ends_at TEXT,
     image TEXT DEFAULT '/images/seminar.jpg',
     registration_url TEXT DEFAULT '',
     status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published','draft')),
     created_at TEXT NOT NULL DEFAULT (datetime('now')),
     updated_at TEXT NOT NULL DEFAULT (datetime('now'))
   )`,
  `CREATE INDEX IF NOT EXISTS idx_events_starts ON events(starts_at)`,

  `CREATE TABLE IF NOT EXISTS news_posts (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     title TEXT NOT NULL,
     slug TEXT NOT NULL UNIQUE,
     category TEXT NOT NULL DEFAULT 'Notice' CHECK (category IN ('News','Notice','Achievement','Announcement')),
     excerpt TEXT DEFAULT '',
     body TEXT DEFAULT '',
     cover_image TEXT DEFAULT '/images/news-1.jpg',
     author TEXT DEFAULT 'Editorial Team',
     status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published','draft')),
     published_at TEXT,
     created_at TEXT NOT NULL DEFAULT (datetime('now')),
     updated_at TEXT NOT NULL DEFAULT (datetime('now'))
   )`,

  `CREATE TABLE IF NOT EXISTS gallery_items (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     title TEXT NOT NULL,
     category TEXT NOT NULL DEFAULT 'Campus' CHECK (category IN ('Campus','Laboratory','Library','Sports','Cultural','Events')),
     image TEXT NOT NULL,
     alt TEXT DEFAULT '',
     caption TEXT DEFAULT '',
     sort_order INTEGER NOT NULL DEFAULT 0,
     status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published','draft')),
     created_at TEXT NOT NULL DEFAULT (datetime('now'))
   )`,

  `CREATE TABLE IF NOT EXISTS testimonials (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT NOT NULL,
     role TEXT DEFAULT '',
     program TEXT DEFAULT '',
     grad_year TEXT DEFAULT '',
     quote TEXT NOT NULL,
     photo TEXT DEFAULT '',
     rating INTEGER NOT NULL DEFAULT 5,
     is_demo INTEGER NOT NULL DEFAULT 1,
     status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published','draft')),
     sort_order INTEGER NOT NULL DEFAULT 0,
     created_at TEXT NOT NULL DEFAULT (datetime('now'))
   )`,

  `CREATE TABLE IF NOT EXISTS faqs (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     category TEXT NOT NULL DEFAULT 'General',
     question TEXT NOT NULL,
     answer TEXT NOT NULL,
     sort_order INTEGER NOT NULL DEFAULT 0,
     status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published','draft')),
     created_at TEXT NOT NULL DEFAULT (datetime('now'))
   )`,

  `CREATE TABLE IF NOT EXISTS site_settings (
     setting_key TEXT PRIMARY KEY,
     setting_value TEXT DEFAULT '',
     group_name TEXT NOT NULL DEFAULT 'general',
     label TEXT NOT NULL,
     type TEXT NOT NULL DEFAULT 'text',
     help TEXT DEFAULT '',
     updated_at TEXT NOT NULL DEFAULT (datetime('now'))
   )`,

  `CREATE TABLE IF NOT EXISTS content_blocks (
     block_key TEXT PRIMARY KEY,
     title TEXT DEFAULT '',
     body TEXT DEFAULT '',
     image TEXT DEFAULT '',
     meta TEXT DEFAULT '{}',
     status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published','draft')),
     updated_by INTEGER REFERENCES users(id),
     updated_at TEXT NOT NULL DEFAULT (datetime('now'))
   )`,

  `CREATE TABLE IF NOT EXISTS downloads (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     title TEXT NOT NULL,
     category TEXT NOT NULL DEFAULT 'Prospectus',
     description TEXT DEFAULT '',
     file_path TEXT DEFAULT '',
     external_url TEXT DEFAULT '',
     status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published','draft')),
     downloads_count INTEGER NOT NULL DEFAULT 0,
     created_at TEXT NOT NULL DEFAULT (datetime('now'))
   )`,

  `CREATE TABLE IF NOT EXISTS notifications (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
     type TEXT NOT NULL DEFAULT 'info',
     title TEXT NOT NULL,
     body TEXT DEFAULT '',
     link TEXT DEFAULT '',
     entity TEXT DEFAULT '',
     entity_id INTEGER,
     read_at TEXT,
     created_at TEXT NOT NULL DEFAULT (datetime('now'))
   )`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at)`,

  `CREATE TABLE IF NOT EXISTS audit_logs (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id INTEGER REFERENCES users(id),
     action TEXT NOT NULL,
     entity TEXT DEFAULT '',
     entity_id TEXT DEFAULT '',
     detail TEXT DEFAULT '',
     ip TEXT DEFAULT '',
     created_at TEXT NOT NULL DEFAULT (datetime('now'))
   )`,
  `CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at)`,

  `CREATE TABLE IF NOT EXISTS rate_limits (
     bucket TEXT NOT NULL,
     window_start TEXT NOT NULL,
     count INTEGER NOT NULL DEFAULT 0,
     PRIMARY KEY (bucket, window_start)
   )`,

  `CREATE TABLE IF NOT EXISTS newsletter_subscribers (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     email TEXT NOT NULL UNIQUE,
     source TEXT DEFAULT '',
     created_at TEXT NOT NULL DEFAULT (datetime('now'))
   )`,
];
