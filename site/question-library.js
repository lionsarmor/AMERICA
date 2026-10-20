/* Common application questions, with evidence-only local defaults. */
(() => {
'use strict';
const catalog=[
  {
    "key": "name",
    "label": "What is your full name?",
    "category": "Contact",
    "options": [],
    "type": "input_text",
    "aliases": [
      "full name",
      "legal name",
      "name"
    ],
    "scope": "global"
  },
  {
    "key": "first_name",
    "label": "What is your first or given name?",
    "category": "Contact",
    "options": [],
    "type": "input_text",
    "aliases": [
      "first name",
      "given name"
    ],
    "scope": "global"
  },
  {
    "key": "last_name",
    "label": "What is your last or family name?",
    "category": "Contact",
    "options": [],
    "type": "input_text",
    "aliases": [
      "last name",
      "surname",
      "family name"
    ],
    "scope": "global"
  },
  {
    "key": "preferred_name",
    "label": "What name do you prefer to be called?",
    "category": "Contact",
    "options": [],
    "type": "input_text",
    "aliases": [
      "preferred name",
      "preferred first name"
    ],
    "scope": "global"
  },
  {
    "key": "email",
    "label": "What email address should employers use to contact you?",
    "category": "Contact",
    "options": [],
    "type": "input_text",
    "aliases": [
      "email",
      "email address",
      "e mail address"
    ],
    "scope": "global"
  },
  {
    "key": "phone",
    "label": "What phone number should employers use to contact you?",
    "category": "Contact",
    "options": [],
    "type": "input_text",
    "aliases": [
      "phone",
      "phone number",
      "telephone number",
      "mobile phone number",
      "contact number"
    ],
    "scope": "global"
  },
  {
    "key": "linkedin",
    "label": "What is the URL of your LinkedIn profile?",
    "category": "Contact",
    "options": [],
    "type": "input_text",
    "aliases": [
      "linkedin",
      "linkedin profile",
      "linkedin url"
    ],
    "scope": "global"
  },
  {
    "key": "github",
    "label": "What is the URL of your GitHub profile?",
    "category": "Contact",
    "options": [],
    "type": "input_text",
    "aliases": [
      "github",
      "github profile",
      "github url"
    ],
    "scope": "global"
  },
  {
    "key": "portfolio",
    "label": "What is the URL of your portfolio or personal website?",
    "category": "Contact",
    "options": [],
    "type": "input_text",
    "aliases": [
      "website",
      "personal website",
      "portfolio",
      "portfolio url",
      "website url"
    ],
    "scope": "global"
  },
  {
    "key": "resume",
    "label": "Which resume should be attached to this application?",
    "category": "Contact",
    "options": [],
    "type": "input_text",
    "aliases": [
      "resume",
      "resume cv",
      "cv"
    ],
    "scope": "global"
  },
  {
    "key": "resume:technician",
    "label": "Which technician resume is available for field and travel roles?",
    "category": "Contact",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "resume:software",
    "label": "Which software resume is available for development roles?",
    "category": "Contact",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "current_location",
    "label": "Where do you currently live (city, state or province, and country)?",
    "category": "Locations",
    "options": [],
    "type": "input_text",
    "aliases": [
      "current location",
      "where are you currently located city state",
      "where do you currently reside"
    ],
    "scope": "global"
  },
  {
    "key": "residential_city",
    "label": "In which city do you currently live?",
    "category": "Locations",
    "options": [],
    "type": "input_text",
    "aliases": [
      "city",
      "city of residence",
      "current city"
    ],
    "scope": "global"
  },
  {
    "key": "residential_state",
    "label": "In which state or province do you currently live?",
    "category": "Locations",
    "options": [],
    "type": "input_text",
    "aliases": [
      "state",
      "province",
      "state of residence"
    ],
    "scope": "global"
  },
  {
    "key": "residential_country",
    "label": "In which country do you currently live?",
    "category": "Locations",
    "options": [],
    "type": "input_text",
    "aliases": [
      "country",
      "country of residence"
    ],
    "scope": "global"
  },
  {
    "key": "residential_street",
    "label": "What is your current residential street address?",
    "category": "Locations",
    "options": [],
    "type": "input_text",
    "aliases": [
      "street address",
      "address line 1",
      "home address"
    ],
    "scope": "global"
  },
  {
    "key": "residential_postal_code",
    "label": "What is the ZIP or postal code of your current residence?",
    "category": "Locations",
    "options": [],
    "type": "input_text",
    "aliases": [
      "zip",
      "zip code",
      "postal code"
    ],
    "scope": "global"
  },
  {
    "key": "mailing_address",
    "label": "What mailing address should an employer use for correspondence?",
    "category": "Locations",
    "options": [],
    "type": "input_text",
    "aliases": [
      "mailing address"
    ],
    "scope": "global"
  },
  {
    "key": "work_bases",
    "label": "Which locations can you use as a work base during assignments?",
    "category": "Locations",
    "options": [],
    "type": "input_text",
    "aliases": [
      "available work bases",
      "work bases"
    ],
    "scope": "global"
  },
  {
    "key": "relocation_preferences",
    "label": "To which locations, if any, are you willing to relocate?",
    "category": "Locations",
    "options": [],
    "type": "input_text",
    "aliases": [
      "relocation preferences"
    ],
    "scope": "global"
  },
  {
    "key": "commute_limit",
    "label": "What is the longest daily commute you would accept?",
    "category": "Locations",
    "options": [],
    "type": "input_text",
    "aliases": [
      "maximum commute",
      "commute limit"
    ],
    "scope": "global"
  },
  {
    "key": "remote_country_restrictions",
    "label": "From which countries can you legally perform remote work?",
    "category": "Locations",
    "options": [],
    "type": "input_text",
    "aliases": [
      "remote work countries"
    ],
    "scope": "global"
  },
  {
    "key": "professional_summary",
    "label": "How would you summarize your professional experience?",
    "category": "Experience",
    "options": [],
    "type": "textarea",
    "aliases": [
      "professional summary",
      "career summary",
      "about you",
      "tell us about yourself"
    ],
    "scope": "global"
  },
  {
    "key": "software_summary",
    "label": "How would you describe your software engineering experience?",
    "category": "Experience",
    "options": [],
    "type": "textarea",
    "aliases": [
      "software engineering experience"
    ],
    "scope": "global"
  },
  {
    "key": "technician_summary",
    "label": "How would you describe your telecommunications and field-service experience?",
    "category": "Experience",
    "options": [],
    "type": "textarea",
    "aliases": [
      "telecommunications experience",
      "field service experience"
    ],
    "scope": "global"
  },
  {
    "key": "most_recent_title",
    "label": "What is your most recent job title listed on your resume?",
    "category": "Experience",
    "options": [],
    "type": "input_text",
    "aliases": [
      "most recent job title",
      "last job title"
    ],
    "scope": "global"
  },
  {
    "key": "current_employer",
    "label": "Who is your current legal employer?",
    "category": "Experience",
    "options": [],
    "type": "input_text",
    "aliases": [
      "current employer",
      "current company"
    ],
    "scope": "global"
  },
  {
    "key": "current_job_title",
    "label": "What is your current job title?",
    "category": "Experience",
    "options": [],
    "type": "input_text",
    "aliases": [
      "current job title",
      "current title"
    ],
    "scope": "global"
  },
  {
    "key": "previous_organizations",
    "label": "Which organizations or projects have you worked with?",
    "category": "Experience",
    "options": [],
    "type": "input_text",
    "aliases": [
      "previous organizations"
    ],
    "scope": "global"
  },
  {
    "key": "employment_history",
    "label": "What is your employment and project history, including dates?",
    "category": "Experience",
    "options": [],
    "type": "textarea",
    "aliases": [
      "employment history",
      "work history"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:total",
    "label": "How many full years of professional experience are documented by dated roles on your resume?",
    "category": "Experience",
    "options": [],
    "type": "input_text",
    "aliases": [
      "total years of experience"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:software",
    "label": "How many full years of software development work are documented by your resume?",
    "category": "Experience",
    "options": [],
    "type": "input_text",
    "aliases": [
      "years of software development experience"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:field",
    "label": "How many full years of infrastructure and field work are documented by your resume?",
    "category": "Experience",
    "options": [],
    "type": "input_text",
    "aliases": [
      "years of field experience"
    ],
    "scope": "global"
  },
  {
    "key": "employment_gaps",
    "label": "Are there employment gaps you would like to explain?",
    "category": "Experience",
    "options": [],
    "type": "input_text",
    "aliases": [
      "employment gaps"
    ],
    "scope": "global"
  },
  {
    "key": "reason_leaving",
    "label": "What is your reason for leaving your current or most recent role?",
    "category": "Experience",
    "options": [],
    "type": "input_text",
    "aliases": [
      "reason for leaving"
    ],
    "scope": "global"
  },
  {
    "key": "managerial_experience",
    "label": "What people-management or supervisory experience do you have?",
    "category": "Experience",
    "options": [],
    "type": "textarea",
    "aliases": [
      "management experience",
      "supervisory experience"
    ],
    "scope": "global"
  },
  {
    "key": "leadership_example",
    "label": "What is an example of a team or project you led?",
    "category": "Experience",
    "options": [],
    "type": "input_text",
    "aliases": [
      "leadership example"
    ],
    "scope": "global"
  },
  {
    "key": "achievement_example",
    "label": "Which professional achievement would you most like to highlight?",
    "category": "Experience",
    "options": [],
    "type": "input_text",
    "aliases": [
      "professional achievement"
    ],
    "scope": "global"
  },
  {
    "key": "education_institution",
    "label": "Which college or educational institution did you attend?",
    "category": "Education",
    "options": [],
    "type": "input_text",
    "aliases": [
      "school",
      "school name",
      "college",
      "university",
      "educational institution"
    ],
    "scope": "global"
  },
  {
    "key": "education_study",
    "label": "What subject or field did you study?",
    "category": "Education",
    "options": [],
    "type": "input_text",
    "aliases": [
      "field of study",
      "major",
      "discipline"
    ],
    "scope": "global"
  },
  {
    "key": "education_description",
    "label": "What education or coursework is listed on your resume?",
    "category": "Education",
    "options": [],
    "type": "input_text",
    "aliases": [
      "education summary"
    ],
    "scope": "global"
  },
  {
    "key": "education_degree",
    "label": "What degree, if any, have you completed?",
    "category": "Education",
    "options": [],
    "type": "input_text",
    "aliases": [
      "degree",
      "highest degree",
      "highest completed degree"
    ],
    "scope": "global"
  },
  {
    "key": "education_graduation_date",
    "label": "When did you graduate or complete your studies?",
    "category": "Education",
    "options": [],
    "type": "input_text",
    "aliases": [
      "graduation date",
      "graduation year"
    ],
    "scope": "global"
  },
  {
    "key": "education_gpa",
    "label": "What was your GPA, if you choose to provide it?",
    "category": "Education",
    "options": [],
    "type": "input_text",
    "aliases": [
      "gpa"
    ],
    "scope": "global"
  },
  {
    "key": "education_start_date",
    "label": "When did you begin your studies?",
    "category": "Education",
    "options": [],
    "type": "input_text",
    "aliases": [
      "education start date"
    ],
    "scope": "global"
  },
  {
    "key": "professional_training",
    "label": "What additional professional training have you completed?",
    "category": "Education",
    "options": [],
    "type": "input_text",
    "aliases": [
      "professional training"
    ],
    "scope": "global"
  },
  {
    "key": "start_date",
    "label": "When are you available to start a new role?",
    "category": "Availability",
    "options": [],
    "type": "input_text",
    "aliases": [
      "start date",
      "available start date",
      "availability date",
      "earliest start date"
    ],
    "scope": "global"
  },
  {
    "key": "notice_period",
    "label": "How much notice do you need to give before starting a new role?",
    "category": "Availability",
    "options": [],
    "type": "input_text",
    "aliases": [
      "notice period"
    ],
    "scope": "global"
  },
  {
    "key": "interview_availability",
    "label": "When are you generally available for interviews?",
    "category": "Availability",
    "options": [],
    "type": "input_text",
    "aliases": [
      "interview availability"
    ],
    "scope": "global"
  },
  {
    "key": "interview_timezone",
    "label": "Which time zone should recruiters use when arranging interviews?",
    "category": "Availability",
    "options": [],
    "type": "input_text",
    "aliases": [
      "interview time zone"
    ],
    "scope": "global"
  },
  {
    "key": "preferred_work_types",
    "label": "Which types of work and assignments are you looking for?",
    "category": "Availability",
    "options": [],
    "type": "input_text",
    "aliases": [
      "preferred work types"
    ],
    "scope": "global"
  },
  {
    "key": "preferred_locations",
    "label": "Which job markets and assignment locations are you targeting?",
    "category": "Availability",
    "options": [],
    "type": "input_text",
    "aliases": [
      "preferred job locations"
    ],
    "scope": "global"
  },
  {
    "key": "weeks_away",
    "label": "How many weeks away between visits home work for you?",
    "category": "Availability",
    "options": [],
    "type": "input_text",
    "aliases": [
      "maximum weeks away"
    ],
    "scope": "global"
  },
  {
    "key": "project_break_weeks",
    "label": "How much time off do you want between projects?",
    "category": "Availability",
    "options": [],
    "type": "input_text",
    "aliases": [
      "time between projects"
    ],
    "scope": "global"
  },
  {
    "key": "pto_preferences",
    "label": "What paid-time-off or rotation arrangements matter to you?",
    "category": "Availability",
    "options": [],
    "type": "input_text",
    "aliases": [
      "pto preferences"
    ],
    "scope": "global"
  },
  {
    "key": "shift_preferences",
    "label": "Which working shifts would you accept?",
    "category": "Availability",
    "options": [],
    "type": "input_text",
    "aliases": [
      "shift preferences"
    ],
    "scope": "global"
  },
  {
    "key": "weekend_availability",
    "label": "Are you willing and available to work weekends?",
    "category": "Availability",
    "options": [],
    "type": "input_text",
    "aliases": [
      "weekend availability"
    ],
    "scope": "global"
  },
  {
    "key": "overtime_availability",
    "label": "Are you willing and available to work overtime?",
    "category": "Availability",
    "options": [],
    "type": "input_text",
    "aliases": [
      "overtime availability"
    ],
    "scope": "global"
  },
  {
    "key": "on_call_availability",
    "label": "Are you willing and available to take on-call assignments?",
    "category": "Availability",
    "options": [],
    "type": "input_text",
    "aliases": [
      "on call availability"
    ],
    "scope": "global"
  },
  {
    "key": "travel_percent",
    "label": "What percentage of travel can you take during assignments?",
    "category": "Availability",
    "options": [],
    "type": "input_text",
    "aliases": [
      "travel percentage",
      "percentage of travel"
    ],
    "scope": "global"
  },
  {
    "key": "travel_international",
    "label": "Are you open to international travel assignments?",
    "category": "Availability",
    "options": [],
    "type": "input_text",
    "aliases": [
      "international travel availability"
    ],
    "scope": "global"
  },
  {
    "key": "travel_us",
    "label": "Are you open to travel assignments throughout the United States?",
    "category": "Availability",
    "options": [],
    "type": "input_text",
    "aliases": [
      "nationwide travel availability"
    ],
    "scope": "global"
  },
  {
    "key": "remote_preference",
    "label": "Are you interested in US remote work?",
    "category": "Availability",
    "options": [],
    "type": "input_text",
    "aliases": [
      "remote work preference"
    ],
    "scope": "global"
  },
  {
    "key": "contract_preference",
    "label": "Are you interested in temporary or project-based contract work?",
    "category": "Availability",
    "options": [],
    "type": "input_text",
    "aliases": [
      "contract work preference"
    ],
    "scope": "global"
  },
  {
    "key": "hotel_preference",
    "label": "What lodging arrangements do you need while traveling for a project?",
    "category": "Availability",
    "options": [],
    "type": "input_text",
    "aliases": [
      "lodging preferences"
    ],
    "scope": "global"
  },
  {
    "key": "salary_target",
    "label": "What annual total compensation are you targeting in US dollars?",
    "category": "Compensation",
    "options": [],
    "type": "input_text",
    "aliases": [
      "annual total compensation target",
      "annual compensation target usd"
    ],
    "scope": "global"
  },
  {
    "key": "minimum_base_salary",
    "label": "What minimum annual base salary would you accept, excluding extras?",
    "category": "Compensation",
    "options": [],
    "type": "input_text",
    "aliases": [
      "minimum base salary"
    ],
    "scope": "global"
  },
  {
    "key": "desired_hourly_rate",
    "label": "What hourly rate are you seeking in US dollars?",
    "category": "Compensation",
    "options": [],
    "type": "input_text",
    "aliases": [
      "desired hourly rate",
      "hourly rate expectation"
    ],
    "scope": "global"
  },
  {
    "key": "per_diem_expectation",
    "label": "What per-diem arrangements would make a travel assignment worthwhile?",
    "category": "Compensation",
    "options": [],
    "type": "input_text",
    "aliases": [
      "per diem expectations"
    ],
    "scope": "global"
  },
  {
    "key": "benefit_preferences",
    "label": "Which benefits matter most when you evaluate an offer?",
    "category": "Compensation",
    "options": [],
    "type": "input_text",
    "aliases": [
      "benefit preferences"
    ],
    "scope": "global"
  },
  {
    "key": "employment_classification",
    "label": "Which employment arrangements do you accept (W-2, independent contract, or other)?",
    "category": "Compensation",
    "options": [],
    "type": "input_text",
    "aliases": [
      "employment classification preference"
    ],
    "scope": "global"
  },
  {
    "key": "salary_currency",
    "label": "In which currency should your compensation target be evaluated?",
    "category": "Compensation",
    "options": [],
    "type": "input_text",
    "aliases": [
      "compensation currency"
    ],
    "scope": "global"
  },
  {
    "key": "unpaid_break_preference",
    "label": "Would you accept unpaid breaks between projects?",
    "category": "Compensation",
    "options": [],
    "type": "input_text",
    "aliases": [
      "unpaid project breaks"
    ],
    "scope": "global"
  },
  {
    "key": "clearance_status",
    "label": "What is your current security-clearance status?",
    "category": "Eligibility",
    "options": [],
    "type": "input_text",
    "aliases": [
      "current security clearance status",
      "security clearance level"
    ],
    "scope": "global"
  },
  {
    "key": "clearance_expiration",
    "label": "When does your currently held clearance expire or require review?",
    "category": "Eligibility",
    "options": [],
    "type": "input_text",
    "aliases": [
      "clearance expiration"
    ],
    "scope": "global"
  },
  {
    "key": "clearance_sponsorship",
    "label": "Are you willing to undergo employer-sponsored clearance processing?",
    "category": "Eligibility",
    "options": [],
    "type": "input_text",
    "aliases": [
      "clearance processing willingness"
    ],
    "scope": "global"
  },
  {
    "key": "passport_valid",
    "label": "Do you currently hold a valid passport?",
    "category": "Eligibility",
    "options": [],
    "type": "input_text",
    "aliases": [
      "valid passport"
    ],
    "scope": "global"
  },
  {
    "key": "passport_expiration",
    "label": "When does your passport expire?",
    "category": "Eligibility",
    "options": [],
    "type": "input_text",
    "aliases": [
      "passport expiration"
    ],
    "scope": "global"
  },
  {
    "key": "us_permanent_resident",
    "label": "Are you a lawful permanent resident of the United States?",
    "category": "Eligibility",
    "options": [],
    "type": "input_text",
    "aliases": [
      "us permanent resident"
    ],
    "scope": "global"
  },
  {
    "key": "other_country_work_authorization",
    "label": "Which countries outside the US have confirmed permission for you to work?",
    "category": "Eligibility",
    "options": [],
    "type": "input_text",
    "aliases": [
      "other country work authorization"
    ],
    "scope": "global"
  },
  {
    "key": "reference_details",
    "label": "Which professional references have agreed to be contacted?",
    "category": "References",
    "options": [],
    "type": "textarea",
    "aliases": [
      "professional references"
    ],
    "scope": "global"
  },
  {
    "key": "reference_contact_permission",
    "label": "May an employer contact your current or previous employer for a reference?",
    "category": "References",
    "options": [],
    "type": "input_text",
    "aliases": [
      "reference contact permission"
    ],
    "scope": "global"
  },
  {
    "key": "reference_relationships",
    "label": "How do you know each professional reference you have supplied?",
    "category": "References",
    "options": [],
    "type": "textarea",
    "aliases": [
      "reference relationships"
    ],
    "scope": "global"
  },
  {
    "key": "technical_skills",
    "label": "Which technical skills are supported by your resume?",
    "category": "Technical experience",
    "options": [],
    "type": "input_text",
    "aliases": [
      "technical skills",
      "core skills"
    ],
    "scope": "global"
  },
  {
    "key": "fiber_experience",
    "label": "Describe your hands-on experience installing, splicing, and testing fiber-optic infrastructure.",
    "category": "Technical experience",
    "options": [],
    "type": "textarea",
    "aliases": [
      "fiber optic experience"
    ],
    "scope": "global"
  },
  {
    "key": "network_diagnostics",
    "label": "Describe your experience diagnosing network or optical-fiber faults.",
    "category": "Technical experience",
    "options": [],
    "type": "input_text",
    "aliases": [
      "network troubleshooting experience"
    ],
    "scope": "global"
  },
  {
    "key": "government_project_experience",
    "label": "Describe your experience supporting government or FAA infrastructure projects.",
    "category": "Technical experience",
    "options": [],
    "type": "textarea",
    "aliases": [
      "government project experience",
      "faa project experience"
    ],
    "scope": "global"
  },
  {
    "key": "data_center_experience",
    "label": "Describe your hands-on experience with data-center infrastructure.",
    "category": "Technical experience",
    "options": [],
    "type": "textarea",
    "aliases": [
      "data center experience"
    ],
    "scope": "global"
  },
  {
    "key": "optical_vendor_experience",
    "label": "Which optical networking vendors and platforms have you worked with hands-on?",
    "category": "Technical experience",
    "options": [],
    "type": "textarea",
    "aliases": [
      "optical networking vendors"
    ],
    "scope": "global"
  },
  {
    "key": "dwdm_experience",
    "label": "Describe your hands-on experience with DWDM and optical transport networks.",
    "category": "Technical experience",
    "options": [],
    "type": "textarea",
    "aliases": [
      "dwdm experience",
      "optical transport network experience"
    ],
    "scope": "global"
  },
  {
    "key": "pcb_experience",
    "label": "Describe your PCB design and electronics-prototyping experience.",
    "category": "Technical experience",
    "options": [],
    "type": "textarea",
    "aliases": [
      "pcb design experience"
    ],
    "scope": "global"
  },
  {
    "key": "ai_experience",
    "label": "Describe your experience integrating local AI models into applications.",
    "category": "Technical experience",
    "options": [],
    "type": "textarea",
    "aliases": [
      "ai integration experience"
    ],
    "scope": "global"
  },
  {
    "key": "deployment_experience",
    "label": "Describe your experience deploying and maintaining applications.",
    "category": "Technical experience",
    "options": [],
    "type": "textarea",
    "aliases": [
      "deployment experience"
    ],
    "scope": "global"
  },
  {
    "key": "eeo_gender",
    "label": "Which gender response, if any, do you want to provide on voluntary demographic forms?",
    "category": "Voluntary information",
    "options": [],
    "type": "input_text",
    "aliases": [
      "gender"
    ],
    "scope": "global"
  },
  {
    "key": "eeo_race_ethnicity",
    "label": "Which race or ethnicity response, if any, do you want to provide on voluntary forms?",
    "category": "Voluntary information",
    "options": [],
    "type": "input_text",
    "aliases": [
      "race ethnicity"
    ],
    "scope": "global"
  },
  {
    "key": "eeo_veteran",
    "label": "What veteran-status response, if any, do you want to provide?",
    "category": "Voluntary information",
    "options": [],
    "type": "input_text",
    "aliases": [
      "veteran status"
    ],
    "scope": "global"
  },
  {
    "key": "eeo_disability",
    "label": "What disability-status response, if any, do you want to provide?",
    "category": "Voluntary information",
    "options": [],
    "type": "input_text",
    "aliases": [
      "disability status"
    ],
    "scope": "global"
  },
  {
    "key": "pronouns",
    "label": "Which pronouns, if any, would you like employers to use?",
    "category": "Voluntary information",
    "options": [],
    "type": "input_text",
    "aliases": [
      "pronouns"
    ],
    "scope": "global"
  },
  {
    "key": "us_citizen",
    "label": "Are you a US citizen?",
    "category": "Eligibility",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "us_work_authorization",
    "label": "Are you authorized to work in the United States?",
    "category": "Eligibility",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "us_sponsorship",
    "label": "Do you need employment visa sponsorship in the United States?",
    "category": "Eligibility",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "us_unrestricted_work_authorization",
    "label": "Can you work for any employer in the US without immigration restrictions?",
    "category": "Eligibility",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "us_work_without_sponsorship",
    "label": "Can you work in the US without employment visa sponsorship?",
    "category": "Eligibility",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "us_citizen_or_resident",
    "label": "Are you a US citizen or lawful permanent resident?",
    "category": "Eligibility",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "us_export_person",
    "label": "Do you qualify as a US person for US export-control purposes?",
    "category": "Eligibility",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "us_national",
    "label": "Are you a US citizen or US national?",
    "category": "Eligibility",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "age_over_18",
    "label": "Are you at least 18 years old?",
    "category": "Eligibility",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "us_driver_license_valid",
    "label": "Do you hold a valid US driver’s license?",
    "category": "Eligibility",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "us_work_status",
    "label": "What is your US work-authorization status?",
    "category": "Eligibility",
    "options": [
      "US citizen",
      "Lawful permanent resident",
      "Other / verify"
    ],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "certification:osha_10",
    "label": "Do you hold a current OSHA 10 credential?",
    "category": "Certifications",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "certification:osha_30",
    "label": "Do you hold a current OSHA 30 credential?",
    "category": "Certifications",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "certification:cpr_first_aid",
    "label": "Do you hold current CPR or first-aid certification?",
    "category": "Certifications",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "certification:fiber_certification",
    "label": "Do you hold a fiber-optic technician certification?",
    "category": "Certifications",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "certification:comptia_network",
    "label": "Do you hold a current CompTIA Network+ certification?",
    "category": "Certifications",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "certification:comptia_security",
    "label": "Do you hold a current CompTIA Security+ certification?",
    "category": "Certifications",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "certification:ccna",
    "label": "Do you hold a current Cisco CCNA certification?",
    "category": "Certifications",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "certification:aws_certification",
    "label": "Do you hold an AWS professional certification?",
    "category": "Certifications",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "certification:commercial_driving_license",
    "label": "Do you hold a current commercial driver’s license?",
    "category": "Certifications",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "certification:lift_certification",
    "label": "Do you hold an aerial-lift or scissor-lift operator certification?",
    "category": "Certifications",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:fiber",
    "label": "Do you have hands-on experience with fiber installation?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "fiber installation",
      "fiber optic installation",
      "fiber optic"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:fiber",
    "label": "How many full years of dated experience with fiber installation are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:fiber",
    "label": "Describe the experience with fiber installation that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:fusion_splicing",
    "label": "Do you have hands-on experience with fusion splicing?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "fusion splicing",
      "fiber splicing"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:fusion_splicing",
    "label": "How many full years of dated experience with fusion splicing are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:fusion_splicing",
    "label": "Describe the experience with fusion splicing that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:otdr",
    "label": "Do you have hands-on experience with OTDR testing?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "otdr"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:otdr",
    "label": "How many full years of dated experience with OTDR testing are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:otdr",
    "label": "Describe the experience with OTDR testing that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:optical_power",
    "label": "Do you have hands-on experience with optical power-meter testing?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "optical power meter",
      "optical power"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:optical_power",
    "label": "How many full years of dated experience with optical power-meter testing are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:optical_power",
    "label": "Describe the experience with optical power-meter testing that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:ribbon_fiber",
    "label": "Do you have hands-on experience with ribbon fiber?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "ribbon fiber"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:ribbon_fiber",
    "label": "How many full years of dated experience with ribbon fiber are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:ribbon_fiber",
    "label": "Describe the experience with ribbon fiber that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:single_mode",
    "label": "Do you have hands-on experience with single-mode fiber?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "single mode"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:single_mode",
    "label": "How many full years of dated experience with single-mode fiber are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:single_mode",
    "label": "Describe the experience with single-mode fiber that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:copper",
    "label": "Do you have hands-on experience with copper termination and cabling?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "copper termination",
      "cat5",
      "cat6",
      "cat5 6"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:copper",
    "label": "How many full years of dated experience with copper termination and cabling are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:copper",
    "label": "Describe the experience with copper termination and cabling that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:structured_cabling",
    "label": "Do you have hands-on experience with structured cabling?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "structured cabling"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:structured_cabling",
    "label": "How many full years of dated experience with structured cabling are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:structured_cabling",
    "label": "Describe the experience with structured cabling that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:mtp_mpo",
    "label": "Do you have hands-on experience with MTP/MPO fiber systems?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "mtp",
      "mpo"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:mtp_mpo",
    "label": "How many full years of dated experience with MTP/MPO fiber systems are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:mtp_mpo",
    "label": "Describe the experience with MTP/MPO fiber systems that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:communications_cutovers",
    "label": "Do you have hands-on experience with communications cutovers?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "cutover",
      "cutovers"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:communications_cutovers",
    "label": "How many full years of dated experience with communications cutovers are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:communications_cutovers",
    "label": "Describe the experience with communications cutovers that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:acceptance_testing",
    "label": "Do you have hands-on experience with acceptance testing?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "acceptance testing"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:acceptance_testing",
    "label": "How many full years of dated experience with acceptance testing are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:acceptance_testing",
    "label": "Describe the experience with acceptance testing that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:drawings",
    "label": "Do you have hands-on experience with engineering drawings and wiring diagrams?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "engineering drawings",
      "wiring diagrams"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:drawings",
    "label": "How many full years of dated experience with engineering drawings and wiring diagrams are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:drawings",
    "label": "Describe the experience with engineering drawings and wiring diagrams that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:fault_isolation",
    "label": "Do you have hands-on experience with fault isolation and restoration?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "fault isolation",
      "service restoration"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:fault_isolation",
    "label": "How many full years of dated experience with fault isolation and restoration are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:fault_isolation",
    "label": "Describe the experience with fault isolation and restoration that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:dwdm",
    "label": "Do you have hands-on experience with DWDM systems?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "dwdm"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:dwdm",
    "label": "How many full years of dated experience with DWDM systems are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:dwdm",
    "label": "Describe the experience with DWDM systems that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:routing",
    "label": "Do you have hands-on experience with IP routing?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "ip routing",
      "bgp",
      "ospf"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:routing",
    "label": "How many full years of dated experience with IP routing are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:routing",
    "label": "Describe the experience with IP routing that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:javascript",
    "label": "Do you have hands-on experience with JavaScript?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "javascript"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:javascript",
    "label": "How many full years of dated experience with JavaScript are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:javascript",
    "label": "Describe the experience with JavaScript that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:vue",
    "label": "Do you have hands-on experience with Vue.js?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "vue",
      "vue js"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:vue",
    "label": "How many full years of dated experience with Vue.js are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:vue",
    "label": "Describe the experience with Vue.js that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:python",
    "label": "Do you have hands-on experience with Python?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "python"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:python",
    "label": "How many full years of dated experience with Python are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:python",
    "label": "Describe the experience with Python that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:c",
    "label": "Do you have hands-on experience with C programming?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "c programming",
      "in c",
      "using c"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:c",
    "label": "How many full years of dated experience with C programming are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:c",
    "label": "Describe the experience with C programming that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:bash",
    "label": "Do you have hands-on experience with Bash scripting?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "bash"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:bash",
    "label": "How many full years of dated experience with Bash scripting are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:bash",
    "label": "Describe the experience with Bash scripting that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:sql",
    "label": "Do you have hands-on experience with SQL?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "sql"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:sql",
    "label": "How many full years of dated experience with SQL are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:sql",
    "label": "Describe the experience with SQL that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:html",
    "label": "Do you have hands-on experience with HTML?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "html5",
      "html"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:html",
    "label": "How many full years of dated experience with HTML are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:html",
    "label": "Describe the experience with HTML that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:css",
    "label": "Do you have hands-on experience with CSS?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "css3",
      "css"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:css",
    "label": "How many full years of dated experience with CSS are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:css",
    "label": "Describe the experience with CSS that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:node",
    "label": "Do you have hands-on experience with Node.js?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "node js",
      "node"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:node",
    "label": "How many full years of dated experience with Node.js are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:node",
    "label": "Describe the experience with Node.js that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:flask",
    "label": "Do you have hands-on experience with Flask?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "flask"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:flask",
    "label": "How many full years of dated experience with Flask are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:flask",
    "label": "Describe the experience with Flask that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:django",
    "label": "Do you have hands-on experience with Django?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "django"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:django",
    "label": "How many full years of dated experience with Django are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:django",
    "label": "Describe the experience with Django that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:rest",
    "label": "Do you have hands-on experience with REST APIs?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "rest api",
      "rest apis"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:rest",
    "label": "How many full years of dated experience with REST APIs are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:rest",
    "label": "Describe the experience with REST APIs that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:postgres",
    "label": "Do you have hands-on experience with PostgreSQL?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "postgresql",
      "postgres"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:postgres",
    "label": "How many full years of dated experience with PostgreSQL are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:postgres",
    "label": "Describe the experience with PostgreSQL that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:mysql",
    "label": "Do you have hands-on experience with MySQL?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "mysql"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:mysql",
    "label": "How many full years of dated experience with MySQL are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:mysql",
    "label": "Describe the experience with MySQL that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:linux",
    "label": "Do you have hands-on experience with Linux?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "linux"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:linux",
    "label": "How many full years of dated experience with Linux are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:linux",
    "label": "Describe the experience with Linux that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:docker",
    "label": "Do you have hands-on experience with Docker?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "docker"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:docker",
    "label": "How many full years of dated experience with Docker are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:docker",
    "label": "Describe the experience with Docker that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:nginx",
    "label": "Do you have hands-on experience with Nginx?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "nginx"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:nginx",
    "label": "How many full years of dated experience with Nginx are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:nginx",
    "label": "Describe the experience with Nginx that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:aws",
    "label": "Do you have hands-on experience with AWS?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "aws",
      "amazon web services"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:aws",
    "label": "How many full years of dated experience with AWS are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:aws",
    "label": "Describe the experience with AWS that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:git",
    "label": "Do you have hands-on experience with Git?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "git",
      "gitlab"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:git",
    "label": "How many full years of dated experience with Git are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:git",
    "label": "Describe the experience with Git that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:elasticsearch",
    "label": "Do you have hands-on experience with Elasticsearch?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "elasticsearch"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:elasticsearch",
    "label": "How many full years of dated experience with Elasticsearch are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:elasticsearch",
    "label": "Describe the experience with Elasticsearch that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:ollama",
    "label": "Do you have hands-on experience with Ollama?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "ollama"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:ollama",
    "label": "How many full years of dated experience with Ollama are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:ollama",
    "label": "Describe the experience with Ollama that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:local_llm",
    "label": "Do you have hands-on experience with local language models?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "qwen",
      "local ai",
      "local llm",
      "local inference"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:local_llm",
    "label": "How many full years of dated experience with local language models are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:local_llm",
    "label": "Describe the experience with local language models that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:figma",
    "label": "Do you have hands-on experience with Figma?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "figma"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:figma",
    "label": "How many full years of dated experience with Figma are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:figma",
    "label": "Describe the experience with Figma that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:tailwind",
    "label": "Do you have hands-on experience with Tailwind CSS?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "tailwind"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:tailwind",
    "label": "How many full years of dated experience with Tailwind CSS are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:tailwind",
    "label": "Describe the experience with Tailwind CSS that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:bootstrap",
    "label": "Do you have hands-on experience with Bootstrap?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "bootstrap"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:bootstrap",
    "label": "How many full years of dated experience with Bootstrap are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:bootstrap",
    "label": "Describe the experience with Bootstrap that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:data_visualization",
    "label": "Do you have hands-on experience with data visualization?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "data visualization",
      "chart js",
      "d3 js",
      "apexcharts"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:data_visualization",
    "label": "How many full years of dated experience with data visualization are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:data_visualization",
    "label": "Describe the experience with data visualization that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:authentication",
    "label": "Do you have hands-on experience with application authentication?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "authentication"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:authentication",
    "label": "How many full years of dated experience with application authentication are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:authentication",
    "label": "Describe the experience with application authentication that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:pcb",
    "label": "Do you have hands-on experience with PCB design?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "pcb"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:pcb",
    "label": "How many full years of dated experience with PCB design are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:pcb",
    "label": "Describe the experience with PCB design that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:cad",
    "label": "Do you have hands-on experience with 3D CAD modeling?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "3d cad",
      "cad modeling"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:cad",
    "label": "How many full years of dated experience with 3D CAD modeling are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:cad",
    "label": "Describe the experience with 3D CAD modeling that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:electronics",
    "label": "Do you have hands-on experience with electronics prototyping?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "electronics prototyping",
      "electronics projects"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:electronics",
    "label": "How many full years of dated experience with electronics prototyping are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:electronics",
    "label": "Describe the experience with electronics prototyping that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:embedded",
    "label": "Do you have hands-on experience with embedded systems?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "embedded systems",
      "esp32",
      "commander x16"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:embedded",
    "label": "How many full years of dated experience with embedded systems are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:embedded",
    "label": "Describe the experience with embedded systems that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:github_actions",
    "label": "Do you have hands-on experience with GitHub Actions?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "github actions"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:github_actions",
    "label": "How many full years of dated experience with GitHub Actions are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:github_actions",
    "label": "Describe the experience with GitHub Actions that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:github_pages",
    "label": "Do you have hands-on experience with GitHub Pages?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "github pages"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:github_pages",
    "label": "How many full years of dated experience with GitHub Pages are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:github_pages",
    "label": "Describe the experience with GitHub Pages that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:agile",
    "label": "Do you have hands-on experience with Agile and Scrum teamwork?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "agile",
      "scrum"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:agile",
    "label": "How many full years of dated experience with Agile and Scrum teamwork are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:agile",
    "label": "Describe the experience with Agile and Scrum teamwork that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill:documentation",
    "label": "Do you have hands-on experience with technical documentation?",
    "category": "Technical skills",
    "options": [
      "Yes",
      "No"
    ],
    "type": "input_text",
    "aliases": [
      "technical documentation",
      "test documentation"
    ],
    "scope": "global"
  },
  {
    "key": "years_experience:documentation",
    "label": "How many full years of dated experience with technical documentation are documented by your resume?",
    "category": "Experience by skill",
    "options": [],
    "type": "input_text",
    "aliases": [],
    "scope": "global"
  },
  {
    "key": "skill_summary:documentation",
    "label": "Describe the experience with technical documentation that is supported by your resume.",
    "category": "Experience examples",
    "options": [],
    "type": "textarea",
    "aliases": [],
    "scope": "global"
  }
];
catalog.push({key:'cover_letter',label:'Which cover letter should be attached to this application?',category:'Contact',type:'input_file',options:[],aliases:['cover letter'],scope:'application'});
const skills=[["fiber","fiber installation",["fiber installation","fiber optic installation","fiber optic"]],["fusion_splicing","fusion splicing",["fusion splicing","fiber splicing"]],["otdr","OTDR testing",["otdr"]],["optical_power","optical power-meter testing",["optical power meter","optical power"]],["ribbon_fiber","ribbon fiber",["ribbon fiber"]],["single_mode","single-mode fiber",["single mode"]],["copper","copper termination and cabling",["copper termination","cat5","cat6","cat5 6"]],["structured_cabling","structured cabling",["structured cabling"]],["mtp_mpo","MTP/MPO fiber systems",["mtp","mpo"]],["communications_cutovers","communications cutovers",["cutover","cutovers"]],["acceptance_testing","acceptance testing",["acceptance testing"]],["drawings","engineering drawings and wiring diagrams",["engineering drawings","wiring diagrams"]],["fault_isolation","fault isolation and restoration",["fault isolation","service restoration"]],["dwdm","DWDM systems",["dwdm"]],["routing","IP routing",["ip routing","bgp","ospf"]],["javascript","JavaScript",["javascript"]],["vue","Vue.js",["vue","vue js"]],["python","Python",["python"]],["c","C programming",["c programming","in c","using c"]],["bash","Bash scripting",["bash"]],["sql","SQL",["sql"]],["html","HTML",["html5","html"]],["css","CSS",["css3","css"]],["node","Node.js",["node js","node"]],["flask","Flask",["flask"]],["django","Django",["django"]],["rest","REST APIs",["rest api","rest apis"]],["postgres","PostgreSQL",["postgresql","postgres"]],["mysql","MySQL",["mysql"]],["linux","Linux",["linux"]],["docker","Docker",["docker"]],["nginx","Nginx",["nginx"]],["aws","AWS",["aws","amazon web services"]],["git","Git",["git","gitlab"]],["elasticsearch","Elasticsearch",["elasticsearch"]],["ollama","Ollama",["ollama"]],["local_llm","local language models",["qwen","local ai","local llm","local inference"]],["figma","Figma",["figma"]],["tailwind","Tailwind CSS",["tailwind"]],["bootstrap","Bootstrap",["bootstrap"]],["data_visualization","data visualization",["data visualization","chart js","d3 js","apexcharts"]],["authentication","application authentication",["authentication"]],["pcb","PCB design",["pcb"]],["cad","3D CAD modeling",["3d cad","cad modeling"]],["electronics","electronics prototyping",["electronics prototyping","electronics projects"]],["embedded","embedded systems",["embedded systems","esp32","commander x16"]],["github_actions","GitHub Actions",["github actions"]],["github_pages","GitHub Pages",["github pages"]],["agile","Agile and Scrum teamwork",["agile","scrum"]],["documentation","technical documentation",["technical documentation","test documentation"]]];
const normalize=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9%]+/g,' ').replace(/\s+/g,' ').trim();
const escapeRE=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const includes=(hay,needle)=>new RegExp('(^| )'+escapeRE(normalize(needle))+'( |$)').test(normalize(hay));
const get=key=>catalog.find(q=>q.key===key)||null;
const yesNo=['Yes','No'];
function known(value,source,evidence=[]){return value===undefined||value===null||value===''?null:{known:true,value,source,derivedFrom:evidence};}
function paragraphs(p){return [...new Set(Object.values(p.resumeEvidence||{}).flat())];}
function summary(p,track){const lines=p.resumeEvidence?.[track]||[];const index=lines.findIndex(s=>/^professional summary$/i.test(s));return index>=0?lines[index+1]:'';}
function matchingEvidence(p,aliases){return paragraphs(p).filter(line=>aliases.some(a=>includes(line,a))).filter(line=>!/^JAMES WEEKS|@|https?:|linkedin\.com|github\.com/i.test(line));}
function yearsFromRoles(roles){
 const month=s=>{if(!/^\d{4}-\d{2}$/.test(s||''))return null;const [y,m]=s.split('-').map(Number);return y*12+m-1;};
 const now=new Date(),endNow=now.getUTCFullYear()*12+now.getUTCMonth();
 const intervals=roles.map(r=>[month(r.start_month||(r.start_year?r.start_year+'-12':'')),month(r.end_month||(r.end_year?r.end_year+'-01':''))]).filter(([a,b])=>a!==null&&b!==null&&b>a).map(([a,b])=>[a,Math.min(b,endNow)]).sort((a,b)=>a[0]-b[0]);
 if(!intervals.length)return null;const merged=[];for(const range of intervals){const last=merged.at(-1);if(last&&range[0]<=last[1])last[1]=Math.max(last[1],range[1]);else merged.push([...range]);}return Math.floor(merged.reduce((n,[a,b])=>n+b-a,0)/12);
}
function infer(key,ctx){
 const p=ctx.profile,source='From your resume',evidence=['Original resume'];
 if(['name','email','phone','linkedin','github','portfolio'].includes(key))return known(p[key],source,evidence);
 if(key==='first_name')return known(p.name?.trim().split(/\s+/)[0],source,evidence);
 if(key==='last_name')return known(p.name?.trim().split(/\s+/).slice(1).join(' '),source,evidence);
 if(key==='resume:technician'||key==='resume:software')return known(p.resumes[key.split(':')[1]]?.name,'Selected resume attachment',evidence);
 if(key==='work_bases')return known(p.bases?.join(' · '),'Confirmed available work bases',['Available work bases']);
 if(key==='professional_summary')return known(summary(p,'technician')||summary(p,'software'),source,evidence);
 if(key==='software_summary')return known(summary(p,'software'),source,evidence);
 if(key==='technician_summary')return known(summary(p,'technician'),source,evidence);
 if(key==='technical_skills')return known(p.skills?.join(', '),source,evidence);
 if(key==='most_recent_title'){const dated=(p.experience||[]).filter(r=>r.start_month).sort((a,b)=>b.start_month.localeCompare(a.start_month));return known(dated[0]?.role,source,evidence);}
 if(key==='previous_organizations')return known((p.experience||[]).map(r=>r.organization_label).filter(Boolean).join('; '),source,evidence);
 if(key==='employment_history')return known((p.experience||[]).map(r=>`${r.role}${r.organization_label?' — '+r.organization_label:''} (${r.start_month||r.start_year||'Start date not stated'} to ${r.end_month||r.end_year||'End date not stated'})`).join('\n'),source,evidence);
 if(key==='education_institution')return known(p.education?.institution,source,evidence);
 if(key==='education_study')return known(p.education?.study,source,evidence);
 if(key==='education_description')return known([p.education?.institution,p.education?.location,p.education?.study].filter(Boolean).join(' · '),source,evidence);
 if(key==='education_degree')return known(p.education?.completed_degree,source,evidence);
 if(key==='years_experience:total')return known(yearsFromRoles(p.experience||[]),'Calculated from dated resume roles; overlapping months counted once',evidence);
 const specific={fiber_experience:['fusion splicing','ribbon fiber','OTDR'],network_diagnostics:['fault isolation','optical events','OTDR trace'],government_project_experience:['FAA facilities','FAA personnel','air traffic control'],data_center_experience:['hyperscale','data center'],pcb_experience:['PCB design','3D CAD'],ai_experience:['Ollama','Qwen','local inference'],deployment_experience:['Docker','Nginx','GitHub Actions']};
 if(specific[key])return known(matchingEvidence(p,specific[key]).slice(0,4).map(s=>s.replace(/^•\s*/, '')).join('\n'),source,evidence);
 const skill=skills.find(s=>key==='skill:'+s[0]||key==='skill_summary:'+s[0]||key==='years_experience:'+s[0]);
 if(skill){const found=matchingEvidence(p,skill[2]),profileHas=(p.skills||[]).some(s=>skill[2].some(a=>includes(s,a)));if(!found.length&&!profileHas)return null;
  if(key.startsWith('skill:'))return known('Yes',source,found.slice(0,3));
  if(key.startsWith('skill_summary:'))return known(found.slice(0,4).map(s=>s.replace(/^•\s*/, '')).join('\n'),source,found.slice(0,3));
  // Mentioning a skill within a dated role does not establish its exact duration.
  return null;
 }
 if(key==='years_experience:software')return known(yearsFromRoles((p.experience||[]).filter(r=>/software/i.test(r.role))),'Calculated from dated software roles',evidence);
 if(key==='years_experience:field')return known(yearsFromRoles((p.experience||[]).filter(r=>/infrastructure|network|technician/i.test(r.role))),'Calculated from dated field roles',evidence);
 return null;
}
function match(label,job,options=[]){
 const l=normalize(label),exact=catalog.find(q=>q.aliases.some(a=>normalize(a)===l));if(exact)return {key:exact.key,inverted:false};
 if(/optical/.test(l)&&/vendor|platform/.test(l))return {key:'optical_vendor_experience',inverted:false};
 if(/dwdm|dense wavelength/.test(l)&&/experience|describe|working|hands on|background/.test(l))return {key:/years|how long/.test(l)?'years_experience:dwdm':'dwdm_experience',inverted:false};
 if(/tell (us|me) about yourself|summari[sz]e your (professional |work |career )?(experience|background)|professional summary/.test(l))return {key:'professional_summary',inverted:false};
 const candidates=skills.filter(s=>s[2].some(a=>includes(l,a))).sort((a,b)=>Math.max(...b[2].map(x=>x.length))-Math.max(...a[2].map(x=>x.length)));
 if(candidates.length===1&&/experience|proficien|familiar|knowledge|worked|work with|working|used|hands on|how long|skill/.test(l)){
  const skill=candidates[0],key=/years|how long/.test(l)?'years_experience:'+skill[0]:/describe|tell|summari|explain|example|outline|briefly/.test(l)?'skill_summary:'+skill[0]:'skill:'+skill[0];return {key,inverted:/lack experience|no experience|never (used|worked)/.test(l)};
 }
 if(/(?:which|what).*school|where did you (study|attend)|name of.*(college|university)/.test(l))return {key:'education_institution',inverted:false};
 if(/(?:which|what).*field of study|what did you study/.test(l))return {key:'education_study',inverted:false};
 if(/describe.*(education|coursework)/.test(l))return {key:'education_description',inverted:false};
 if(/(?:what|which).*degree|highest (level of )?education/.test(l))return {key:'education_degree',inverted:false};
 if(/when.*(start|available)|how soon.*start/.test(l))return {key:'start_date',inverted:false};
 if(/how (much|long).*notice|notice period/.test(l))return {key:'notice_period',inverted:false};
 return null;
}
function completePrompt(rawLabel,description,meaning,clean){
 const label=clean(rawLabel),detail=clean(description),interrogative=s=>/^(?:what|which|who|how|when|where|why|are|is|do|does|did|have|has|can|could|will|would|please|describe|tell|briefly|explain|summari[sz]e|select|choose|enter|upload|attach)\b/i.test(s)||s.includes('?');
 const def=get(meaning?.key),labelQuestion=interrogative(label),detailQuestion=interrogative(detail);
 if(detailQuestion&&!labelQuestion)return {questionText:detail,context:label,originalLabel:label,description:detail,promptOrigin:'Employer question and description',incomplete:false};
 if(labelQuestion)return {questionText:label,context:detail,originalLabel:label,description:detail,promptOrigin:'Employer question',incomplete:false};
 if(def)return {questionText:def.label,context:detail,originalLabel:label,description:detail,promptOrigin:'Expanded common field label',incomplete:false};
 if(detailQuestion)return {questionText:detail,context:label,originalLabel:label,description:detail,promptOrigin:'Employer description',incomplete:false};
 return {questionText:label,context:detail,originalLabel:label,description:detail,promptOrigin:'Employer field title only',incomplete:true};
}
function definitions(){return catalog.map(q=>({...q}));}
window.ApplicantKnowledge={catalog,skills,get,definitions,infer,match,completePrompt,normalize};

})();
