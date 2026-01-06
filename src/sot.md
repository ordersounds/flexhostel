# Flex Hostel — Source of Truth (Complete v1)

**Status:** Canonical Product Document  
**Version:** 1.0 — Flagship Building Launch (Okitipupa)  
**Purpose:** This document is the *single source of truth* for building Flex Hostel. Any AI, developer, or designer working on this product must rely on this document above all else.  
**Audience:** AI builders, developers, product designers, system architects  
**Philosophy:** Simple, premium, mobile‑first, decisive. No over‑engineering.

---

## 1. Product Vision

Flex Hostel is a **student‑focused housing platform** that enables:

* Students to **apply, pay, and live** in hostel accommodation with confidence
* Landlords to **approve tenants, collect rent, and communicate clearly**
* Agents to **manage rooms and issues efficiently**

The product must feel:

* **Intuitive** — "of course this is how it works"
* **Premium** — calm, confident, modern
* **Official** — the single platform students trust
* **Growing** — flagship building with expansion planned

Visual benchmark: *Meta‑level clarity, Instagram‑fluid interactions, Stripe‑like calmness.*

---

## 2. Core Constraints (Non‑Negotiable)

* **Single landlord** managing multiple buildings
* **v1 Launch:** Flagship building in Okitipupa, Ondo State (50 self-contained rooms)
* Architecture & UI support multi-building from day 1:
  - Building name visible throughout app
  - URLs include building location (`/okitipupa`)
  - Database schema supports multiple buildings
  - Design system includes building-specific branding
  - Growth signals ("expanding", "more locations coming") in marketing copy
* Each building: Up to 50 self-contained rooms
* **Room naming convention:** All 50 U.S. state names (Alabama, Alaska, Arizona... Wyoming)
* Tenancy duration: **12 months only**
* **Rent is yearly only** (no monthly rent, no partial payment)
* Full payment required before tenancy starts
* Payments handled strictly via **Paystack**
* Mobile‑first design
* No dark mode
* One agent assigned per room (agents can manage multiple rooms)

---

## 3. User Roles

### 3.1 Visitor (Unauthenticated)

* Can browse buildings and rooms
* Can see prices and room details
* Can apply for rooms

### 3.2 Applicant

* Has submitted one or more room applications
* Cannot access tenant features
* Awaits approval or rejection from landlord

### 3.3 Tenant

* Approved and has fully paid yearly rent
* Assigned to exactly one room
* Active for 12 months
* Archived after tenancy ends
* Cannot change rooms during tenancy

### 3.4 Agent

* Assigned to specific rooms (one agent per room)
* Can manage multiple rooms across buildings
* Communicates with tenants and landlord
* Typical load: 10-20 rooms per agent

### 3.5 Landlord (Admin)

* Single account
* Full control over buildings, rooms, applications, payments, announcements
* Can view all data across all buildings
* Assigns agents to rooms

---

## 4. High‑Level User Journey

### 4.1 Discovery (Flagship Building Approach)

**Homepage Flow:**

1. User lands on Flex Hostel homepage
   - **Hero Section:**
     - "Flex Hostel — Okitipupa"
     - Subheading: "Our Flagship Location" or "Premium Student Living in Okitipupa"
     - Building cover image (full-width hero, 60vh on mobile)
     - CTA: "Explore Rooms"

2. **Building Highlights Section** (same page, scroll down)
   - 3-column grid:
     - "Prime Location in Okitipupa" (map pin icon)
     - "50 Premium Self-Contained Rooms" (door icon)
     - "24/7 Security & Support" (shield icon)
   - Building address + embedded mini map
   - "About This Building" link → `/okitipupa`

3. **Building Gallery Section**
   - Heading: "Tour Our Okitipupa Building"
   - 4-8 images (swipeable carousel on mobile, grid on desktop)
   - Exterior shots, common areas, security gate, surroundings

4. **Available Rooms Section**
   - Heading: "Choose Your Room"
   - Filter bar: Gender (All/Male/Female), Price Range, Availability Status
   - Room cards grid (all 50 rooms, paginated if needed)
   - Each room card shows:
     - Room cover image
     - Room name (e.g., "Alabama")
     - Building badge: "Okitipupa Building" (small, top-left overlay)
     - Price: "₦450,000/year" (prominent)
     - Amenities count: "5 amenities"
     - Status badge: "Available" (green)
     - CTA button: "View Details"

5. **Location & Access Section**
   - Embedded Google Map
   - "Near: [List nearby universities/institutions]"
   - Transport links and landmarks

6. **Coming Soon Section** (optional)
   - Heading: "Expanding Across Nigeria"
   - 2-3 placeholder cards (blurred or teaser style):
     - "Akure — Coming Soon"
     - "Ado-Ekiti — 2026"
   - Newsletter signup: "Be first to know about new locations"

**Dedicated Building Detail Page** (`/okitipupa`):

- Full building spotlight (makes 1 building feel substantial)
- Hero: Building name + full-width cover image
- Description (500-word marketing copy about the building)
- Complete gallery (8-12 professional images)
- Building-level amenities list:
  - 24/7 Security Personnel
  - Backup Power Generator
  - CCTV Coverage
  - Secure Perimeter Fencing
  - Proximity to campus
  - Waste Management
- Detailed location information with map
- "View Available Rooms" CTA → `/okitipupa/rooms`
- Testimonials section (Phase 2)

**Room Detail Page** (`/okitipupa/rooms/alabama`):

- Room name as hero heading: "Alabama"
- Building context: "Flex Hostel — Okitipupa Building"
- Room gallery: Cover image + 3-6 additional images (swipeable)
- Price display (prominent, sticky on mobile): "₦450,000/year"
- Room-specific amenities (icon badges):
  - Air Conditioning
  - Private Bathroom
  - Study Desk
  - Wardrobe
  - Reading Lamp
  - etc.
- Gender requirement badge (if applicable)
- Room description (~300 characters)
- Agent info card (name, photo, "Your assigned agent")
- Sticky "Apply Now" CTA button (bottom on mobile, sidebar on desktop)

---

### 4.2 Application Flow

**Trigger:** Student clicks "Apply Now" from room detail page

**Application Form Fields:**

**Personal Information:**
- Full name
- Email address
- Phone number
- Photo upload (2MB max, JPG/PNG)

**School Details:**
- Institution name
- Faculty
- Department
- Matric/Student ID number
- School ID upload (5MB max, JPG/PNG)

**Roommate Information (Optional):**
- Checkbox: "I will have a roommate"
- Limit: Maximum 1 roommate per room
- If checked, collect roommate details:
  - Full name
  - Email
  - Phone number
  - Institution name
  - Matric/Student ID number
  - Photo upload (2MB max, JPG/PNG)
  - School ID upload (5MB max, JPG/PNG)
- Roommate is NOT a separate user account
- Roommate info stored with applicant's application data only

**Additional Information:**
- Do you have pets? (Yes/No)
- If yes, describe pet(s)
- Additional notes/requests (textarea, 500 chars max)

**Application Rules:**

- Applicant may apply to multiple rooms simultaneously
- Only ONE account per room (the primary applicant)
- Roommate is informational only (not a separate user/account)
- Rejection does not block reapplication to same or different rooms
- Landlord approval is binary (approve or reject)
- No conditional approvals or negotiations
- Application timeout: If approved but unpaid after **7 days**, application status → `expired`, room status → `available` again

**Form Submission:**
- Review page showing all entered data
- "Submit Application" button
- On submit: Application status → `pending`
- Room status remains `available` (multiple pending applications allowed)
- Confirmation email sent to applicant
- Notification sent to landlord

---

### 4.3 Approval → Payment

**Landlord Approval Process:**

1. Landlord reviews application in admin dashboard
2. Clicks "Approve" or "Reject"
3. If rejected: Optional rejection reason (stored but not shown to student)
4. If approved:
   - Application status → `approved`
   - Room status → `pending`
   - `approved_at` timestamp recorded
   - Email sent to applicant: "Your application for [Room Name] has been approved! Pay now to secure your room."

**Payment Initiation:**

- Applicant logs in (or clicks email link)
- Dashboard shows: "Payment Required for [Room Name]"
- "Pay Now" button visible
- Payment page displays:
  - Room details with image
  - Building: "Flex Hostel — Okitipupa"
  - Rent amount: "₦450,000/year"
  - Tenancy duration: "12 months from payment date"
  - Payment method: Paystack logo

**Payment Flow:**

1. Student clicks "Pay Now"
2. System creates payment record:
   ```
   status: 'pending'
   paystack_reference: generated
   amount: room.price
   ```
3. Redirect to Paystack payment page
4. Student completes payment on Paystack
5. Paystack webhook received by system:
   - Payment status → `success`
   - `paid_at` timestamp recorded
   - Create tenancy record:
     ```
     room_id: [room]
     tenant_id: [user]
     start_date: today
     end_date: today + 12 months
     status: 'active'
     ```
   - Room status → `occupied`
   - User role → `tenant`
   
6. Notifications sent:
   - Email to tenant: "Welcome to Flex Hostel! Your tenancy has started."
   - Email to landlord: "[Student Name] has paid for [Room Name]"
   - Email to assigned agent: "New tenant assigned to your room: [Room Name]"

**Payment Edge Cases:**

- **Webhook timeout (24 hours):** Payment remains `pending`, landlord can manually verify via Paystack dashboard and mark as paid
- **Payment fails:** Status → `failed`, student can retry, application remains `approved`
- **Duplicate payment (race condition):** Database constraint prevents double-assignment, second payment auto-refunded by Paystack

---

### 4.4 Active Tenancy

**Tenant Dashboard:**

**Overview Tab:**
- Welcome message: "Welcome to your room, [Name]!"
- Room card:
  - Room image thumbnail
  - "Your Room: Alabama, Okitipupa Building"
  - Room address
  - Tenancy dates: "Start: Jan 1, 2026 | End: Dec 31, 2026"
  - Days remaining counter
- Quick actions:
  - View Room Details
  - Message Agent
  - Message Landlord
  - View Payments

**Payments Tab:**
- Payment history table:
  - Date | Description | Amount | Status
  - "Rent - Alabama Room" | ₦450,000 | Paid | Jan 1, 2026
  - "Okitipupa Building - Cleaning Fee" | ₦5,000 | Paid | Jan 1, 2026
- Upcoming charges (if any recurring monthly charges exist):
  - "Okitipupa Building - Cleaning Fee" | ₦5,000 | Due: Feb 1, 2026
  - "Pay Now" button for each

**Messages Tab:**
- Three conversation threads:
  1. **"Your Agent - [Agent Name]"** (1-to-1 chat)
  2. **"Landlord"** (1-to-1 chat)
  3. **"Okitipupa Building House Chat"** (group chat)
- Real-time messaging (Supabase Realtime)
- Message limits:
  - Text: 5000 characters max
  - Images: 5MB max
  - No videos (Phase 2)
- Read receipts (optional)
- Full message history retained

**Announcements Tab:**
- List of announcements from landlord
- Each announcement shows:
  - Title
  - Content
  - Posted date
  - Building context: "[Okitipupa Building] Maintenance Notice"

**Tenant Restrictions:**

- Cannot change rooms during active tenancy
- Cannot DM other tenants privately (only group chat)
- Cannot see other tenants' payment status
- Cannot delete messages
- Cannot mute group chat (Phase 1)

---

## 5. Communication System

### 5.1 Allowed Channels

**1-to-1 Messaging:**
- Tenant ↔ Agent (any tenant can message their assigned agent)
- Tenant ↔ Landlord (any tenant can message landlord directly)
- Agent ↔ Landlord (agents can message landlord)

**Group Chat:**
- **"Okitipupa Building House Chat"**
- Participants: All active tenants in Okitipupa building + all agents assigned to Okitipupa rooms + landlord
- Purpose: Community announcements, neighbor coordination, building-wide discussions
- Visible to all participants in real-time

### 5.2 Disallowed

- Tenant ↔ Tenant DMs (tenants can only interact in group chat)
- Message deletion (messages are permanent)
- Muting group chat (Phase 1 — may add in Phase 2)
- Message editing (send new message to correct)

### 5.3 Announcements

**Landlord Can:**
- Post announcements visible to all tenants and agents
- Target specific building (when multiple buildings exist) OR all buildings
- Include: Title (required), Content (rich text, ~1000 chars), optional image

**Display:**
- Announcements appear in tenant/agent dashboards under "Announcements" tab
- Push notification sent when new announcement posted
- Labeled with building context: "[Okitipupa Building] Power Outage Notice"

### 5.4 Message Storage

**Database Schema:**
```sql
MESSAGES:
- id
- sender_id (FK to users)
- receiver_id (nullable - null if group message)
- building_id (nullable - null if DM, set if group chat)
- content (text, max 5000 chars)
- image_url (nullable)
- created_at (timestamp)

Logic:
- If building_id IS NOT NULL → Group chat message
- If receiver_id IS NOT NULL → Direct message
```

**Real-time Delivery:**
- Supabase Realtime subscriptions
- Messages appear instantly for online users
- Offline users see messages on next login

---

## 6. Payments & Charges

### 6.1 Rent Payment

**Rules:**
- Yearly payment only
- Amount: Set per room (e.g., ₦450,000/year)
- Paid once at tenancy start
- Required to activate tenancy
- No partial payments
- No monthly installments
- No discounts

**Payment Method:**
- Paystack only
- Student redirected to Paystack hosted page
- System receives webhook on success/failure

### 6.2 Other Charges (Building-Level)

**Types:**
- Cleaning fee
- Security levy
- Waste management
- Generator maintenance
- Any other building-wide operational costs

**Rules:**
- Tied to specific building (e.g., "Okitipupa Building - Cleaning Fee")
- Can be **monthly** or **yearly**
- Frequency set by landlord when creating charge
- All tenants in that building must pay
- No discounts
- Payment choice locks once payment is made (if charge offers yearly option with discount, student can't change after paying monthly once)

**Display in Tenant Dashboard:**
- "Okitipupa Building - Cleaning Fee: ₦5,000/month"
- "Pay Now" button for upcoming/due charges
- Payment history shows all past charge payments

### 6.3 Refund Policy

**No refunds if:**
- Tenant leaves early (before 12-month tenancy ends)
- Tenant violates rules and is evicted
- Tenant changes their mind after payment

**Refunds considered only if:**
- Landlord cancels tenancy before start date (full refund)
- System error results in duplicate payment (auto-refund via Paystack)

### 6.4 Payment State Management

**Rent Payment States:**
- `initiated`: Paystack reference created, redirect sent
- `pending`: Awaiting webhook confirmation (timeout: 24 hours)
- `success`: Webhook received, tenancy created
- `failed`: Paystack declined/cancelled
- `expired`: 24-hour timeout reached, no webhook (landlord can manually verify)

**Verification Process:**
- Webhook handler updates payment status automatically
- If webhook fails: Landlord can verify manually via Paystack dashboard
- "Verify Payment" button in landlord dashboard for pending payments
- No automatic cleanup of expired payments (audit trail preserved)

---

## 7. Data Model (Supabase Schema)

### 7.1 Users Table
```sql
users:
- id (uuid, PK)
- role (text: 'visitor'|'applicant'|'tenant'|'agent'|'landlord')
- name (text, required)
- email (text, unique, required)
- phone_number (text, required)
- school_id (text, nullable - for students)
- photo_url (text, nullable)
- status (text: 'active'|'suspended'|'archived')
- created_at (timestamp)
- updated_at (timestamp)
```

### 7.2 Buildings Table
```sql
buildings:
- id (uuid, PK)
- name (text, required) — e.g., "Flex Hostel Okitipupa"
- slug (text, unique) — e.g., "okitipupa"
- address (text, required)
- description (text, ~500 chars - marketing copy)
- cover_image_url (text, required)
- gallery_images (jsonb, array of image URLs)
- landlord_id (uuid, FK to users)
- status (text: 'active'|'inactive')
- created_at (timestamp)
- updated_at (timestamp)
```

**Image Requirements:**
- Cover image: 1920×1080, WebP/JPG, <500KB
- Gallery: 4-8 images, 1200×800, <300KB each

### 7.3 Rooms Table
```sql
rooms:
- id (uuid, PK)
- building_id (uuid, FK to buildings)
- room_name (text, required, unique per building) — US state names
- price (numeric, required) — yearly rent in NGN
- description (text, ~300 chars)
- gender (text: 'male'|'female'|'any')
- cover_image_url (text, required)
- gallery_images (jsonb, array of image URLs)
- amenities (jsonb, array of strings) — ['AC', 'Private Bathroom', 'Wardrobe', ...]
- agent_id (uuid, nullable, FK to users)
- status (text: 'available'|'pending'|'occupied')
- created_at (timestamp)
- updated_at (timestamp)
```

**Room Names (All 50 US States):**
Alabama, Alaska, Arizona, Arkansas, California, Colorado, Connecticut, Delaware, Florida, Georgia, Hawaii, Idaho, Illinois, Indiana, Iowa, Kansas, Kentucky, Louisiana, Maine, Maryland, Massachusetts, Michigan, Minnesota, Mississippi, Missouri, Montana, Nebraska, Nevada, New Hampshire, New Jersey, New Mexico, New York, North Carolina, North Dakota, Ohio, Oklahoma, Oregon, Pennsylvania, Rhode Island, South Carolina, South Dakota, Tennessee, Texas, Utah, Vermont, Virginia, Washington, West Virginia, Wisconsin, Wyoming

**Room Status Logic:**
- `available`: Can receive applications
- `pending`: Has approved application(s) awaiting payment
- `occupied`: Has active tenancy

**Image Requirements:**
- Cover image: 1200×800, WebP/JPG, <300KB
- Gallery: 3-6 images, 800×600, <200KB each

**Standard Amenities List (Predefined Checkboxes):**
- Air Conditioning
- Private Bathroom
- Study Desk
- Wardrobe
- Reading Lamp
- Power Backup
- WiFi Access
- Security Door
- Window View
- Ceiling Fan

### 7.4 Applications Table
```sql
applications:
- id (uuid, PK)
- room_id (uuid, FK to rooms)
- user_id (uuid, FK to users)
- status (text: 'pending'|'approved'|'rejected'|'expired')
- submitted_data (jsonb) — stores all form data including roommate info
- rejection_reason (text, nullable)
- approved_by (uuid, nullable, FK to users - landlord)
- created_at (timestamp)
- approved_at (timestamp, nullable)
- updated_at (timestamp)
```

**submitted_data structure:**
```json
{
  "personal": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "08012345678",
    "photo_url": "..."
  },
  "school": {
    "institution": "University of XYZ",
    "faculty": "Sciences",
    "department": "Computer Science",
    "matric_number": "170101001",
    "id_card_url": "..."
  },
  "roommate": {
    "has_roommate": true,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "08087654321",
    "institution": "University of XYZ",
    "matric_number": "170202002",
    "photo_url": "...",
    "id_card_url": "..."
  },
  "additional": {
    "has_pets": false,
    "pet_description": null,
    "notes": "I prefer a quiet room"
  }
}
```

**Important Notes:**
- Roommate data is for landlord reference only
- No separate user account created for roommate
- Only the primary applicant becomes a user/tenant
- Only primary applicant pays (one payment covers the room)
- Only primary applicant gets dashboard access
- Roommate info visible to landlord in application review

### 7.5 Tenancies Table
```sql
tenancies:
- id (uuid, PK)
- room_id (uuid, FK to rooms)
- tenant_id (uuid, FK to users)
- payment_id (uuid, FK to payments - the rent payment)
- start_date (date, required)
- end_date (date, required) — always start_date + 12 months
- status (text: 'active'|'archived')
- created_at (timestamp)
- archived_at (timestamp, nullable)
```

**Tenancy Rules:**
- One active tenancy per room at a time (DB constraint)
- Duration always exactly 12 months
- Status → `archived` after end_date passes (cron job or manual)

### 7.6 Charges Table
```sql
charges:
- id (uuid, PK)
- building_id (uuid, FK to buildings)
- name (text, required) — e.g., "Cleaning Fee"
- amount (numeric, required) — in NGN
- frequency (text: 'monthly'|'yearly')
- status (text: 'active'|'inactive')
- created_at (timestamp)
- updated_at (timestamp)
```

### 7.7 Payments Table
```sql
payments:
- id (uuid, PK)
- user_id (uuid, FK to users)
- tenancy_id (uuid, nullable, FK to tenancies - null for charge payments)
- charge_id (uuid, nullable, FK to charges - null for rent payments)
- amount (numeric, required)
- status (text: 'pending'|'success'|'failed'|'expired')
- paystack_reference (text, unique, required)
- payment_method (text: 'card'|'bank_transfer'|'ussd')
- currency (text, default: 'NGN')
- created_at (timestamp)
- paid_at (timestamp, nullable)
- updated_at (timestamp)
```

**Payment Types:**
- Rent payment: `tenancy_id` set, `charge_id` null
- Charge payment: `charge_id` set, `tenancy_id` set (links to tenant's tenancy)

### 7.8 Messages Table
```sql
messages:
- id (uuid, PK)
- sender_id (uuid, FK to users)
- receiver_id (uuid, nullable, FK to users) — null if group message
- building_id (uuid, nullable, FK to buildings) — null if DM
- content (text, max 5000 chars)
- image_url (text, nullable)
- created_at (timestamp)
```

**Message Type Logic:**
- DM: `receiver_id` NOT NULL, `building_id` NULL
- Group chat: `building_id` NOT NULL, `receiver_id` NULL

### 7.9 Announcements Table
```sql
announcements:
- id (uuid, PK)
- building_id (uuid, nullable, FK to buildings) — null = global announcement
- title (text, required)
- content (text, required, ~1000 chars)
- image_url (text, nullable)
- created_by (uuid, FK to users - landlord)
- created_at (timestamp)
- updated_at (timestamp)
```

---

## 8. Authorization & Security

### 8.1 Supabase Row Level Security (RLS) Policies

**Applications Table:**
```sql
- INSERT: authenticated users (anyone can apply)
- SELECT: 
  - Own applications (user_id = auth.uid())
  - All applications (if role = 'landlord')
- UPDATE: role = 'landlord' only
```

**Tenancies Table:**
```sql
- SELECT:
  - Own tenancy (tenant_id = auth.uid())
  - All tenancies (if role = 'landlord' or role = 'agent')
- INSERT/UPDATE: role = 'landlord' only
```

**Payments Table:**
```sql
- SELECT:
  - Own payments (user_id = auth.uid())
  - All payments (if role = 'landlord')
- INSERT: authenticated users (system creates on payment initiation)
- UPDATE: webhook only (validated Paystack signature)
```

**Messages Table:**
```sql
- SELECT:
  - Sent messages (sender_id = auth.uid())
  - Received messages (receiver_id = auth.uid())
  - Group messages (user is tenant/agent in building_id)
- INSERT: authenticated users
- DELETE: not allowed (messages permanent)
```

**Buildings, Rooms, Charges:**
```sql
- SELECT: public (anyone can view)
- INSERT/UPDATE/DELETE: role = 'landlord' only
```

**Announcements:**
```sql
- SELECT: 
  - All announcements (if user is tenant/agent)
  - Building-specific (if user is tenant/agent in that building)
- INSERT: role = 'landlord' only
```

### 8.2 Authorization Matrix

| Resource | Visitor | Applicant | Tenant | Agent | Landlord |
|----------|---------|-----------|--------|-------|----------|
| Browse buildings | ✓ | ✓ | ✓ | ✓ | ✓ |
| View room details | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create application | ✓ | ✓ | - | - | - |
| View own applications | - | ✓ | ✓ | - | - |
| View all applications | - | - | - | - | ✓ |
| Approve/reject application | - | - | - | - | ✓ |
| View own tenancy | - | - | ✓ | - | ✓ |
| View all tenancies | - | - | - | ✓ | ✓ |
| Initiate payment | - | ✓ | ✓ | - | - |
| View own payments | - | ✓ | ✓ | - | - |
| View all payments | - | - | - | - | ✓ |
| Message agent | - | - | ✓ | - | ✓ |
| Message tenants | - | - | - | ✓ | ✓ |
| View group chat | - | - | ✓ | ✓ | ✓ |
| Post announcement | - | - | - | - | ✓ |
| Manage buildings | - | - | - | - | ✓ |
| Manage rooms | - | - | - | - | ✓ |
| Assign agents | - | - | - | - | ✓ |

---

## 9. Media Management

### 9.1 Image Upload System

**Storage:**
- Supabase Storage buckets:
  - `/buildings/{building_id}/cover.webp`
  - `/buildings/{building_id}/gallery/{timestamp}.webp`
  - `/rooms/{room_id}/cover.webp`
  - `/rooms/{room_id}/gallery/{timestamp}.webp`
  - `/users/{user_id}/photo.jpg`
  - `/applications/{application_id}/school_id.jpg`

**Upload Limits:**
- Building cover: 5MB max before processing
- Building gallery: 8 images max, 5MB each
- Room cover: 5MB max before processing
- Room gallery: 6 images max, 5MB each
- User photo: 2MB max
- School ID: 5MB max
- Accepted formats: JPG, PNG, WebP

**Image Processing (Recommended):**
- Auto-resize on upload using Supabase Edge Function or Sharp.js
- Convert to WebP for web delivery
- Generate 3 sizes:
  - Full: Original quality, optimized
  - Medium: 600w for mobile
  - Thumbnail: 300w for cards
- Keep original as backup
- Serve via Supabase CDN

**Performance Strategy:**
- Homepage: Load building cover (full), lazy-load gallery
- Rooms grid: Load thumbnails only
- Room detail: Load cover immediately, lazy-load gallery
- Responsive images using `srcset`:
```html
<img 
  srcset="thumb.webp 300w, medium.webp 600w, full.webp 1200w"
  sizes="(max-width: 600px) 300px, (max-width: 1200px) 600px, 1200px"
/>
```

### 9.2 Landlord Media Management

**Capabilities:**
- Upload/replace building cover and gallery
- Upload/replace room cover and gallery
- Reorder gallery images (drag & drop)
- Delete individual gallery images
- Preview how building/room appears to students
- Bulk upload for room galleries (Phase 2)

---

## 10. Edge Cases & Rules

### 10.4 Agent Assignment Edge Cases

**No agent assigned to room:**
- Allowed during room creation
- Tenant can still move in
- Landlord handles issues directly
- Agent can be assigned later

**Agent manages too many rooms:**
- No system limit enforced
- Landlord responsible for workload balance
- Recommended: 10-20 rooms per agent

---

## 11. UX Principles (Enforced)

### 11.1 Visual Design

**Mobile-First:**
- All interfaces designed for mobile first
- Desktop as enhancement, not primary
- Touch-friendly tap targets (min 44px)
- Thumb-zone optimization for CTAs

**Typography:**
- Clear hierarchy: H1 (32px), H2 (24px), H3 (18px), Body (16px)
- Building names: Semibold, 20-24px
- Room names (states): Bold, 18-20px
- Consistent pairing with logo

**Color System:**
- Primary brand color (TBD)
- Building-specific accent: Okitipupa = Teal (#0D9488)
- Success green: #10B981
- Error red: #EF4444
- Warning yellow: #F59E0B
- Neutral grays: Tailwind gray palette

**Spacing:**
- Generous white space (premium feel)
- Consistent padding: 16px (mobile), 24px (tablet), 32px (desktop)
- Card spacing: 16px gap minimum

### 11.2 Interaction Patterns

**Building Cards:**
- Large cover image (fills card, 16:9 ratio)
- Text overlay with gradient for readability
- Building name + location
- Hover effect: Slight image zoom (1.05x scale)
- Click: Navigate to building detail

**Room Cards:**
- Cover image (16:9 ratio, fills top of card)
- Building badge overlay (top-left, semi-transparent)
- Room name (large, bold): "Alabama"
- Price badge (top-right, solid background): "₦450k/yr"
- Amenities row: Icon count badge
- Status badge (bottom-right): "Available" (green)
- CTA button: "View Details" (full-width)
- Hover: Subtle shadow lift

**CTAs:**
- Primary action: Solid button, brand color
- Secondary: Outline button
- Sticky on mobile: "Apply Now" on room detail pages
- Loading states: Spinner + disabled state
- Success states: Checkmark + green flash

**Image Galleries:**
- Mobile: Horizontal swipe carousel with dots indicator
- Desktop: Grid with lightbox modal on click
- Blur-up placeholder while loading (LQIP)
- Lazy loading for off-screen images

### 11.3 User Feedback

**Loading States:**
- Skeleton loaders for initial page load
- Spinner for action buttons
- Progress bars for file uploads
- "Saving..." text for form submissions

**Success Feedback:**
- Toast notifications (top-right on desktop, top on mobile)
- Green checkmark icon
- Auto-dismiss after 3 seconds
- Examples: "Application submitted!", "Payment successful!"

**Error Handling:**
- Red toast for errors
- Inline error messages below form fields
- Clear, actionable error text (no technical jargon)
- Retry buttons where applicable

**Empty States:**
- Friendly illustrations
- Clear explanation of why empty
- CTA to take action
- Example: "No rooms available" → "Check back soon!"

### 11.4 Content Tone

**Throughout App:**
- Professional but warm
- Conversational, not corporate
- Student-friendly language
- No jargon or technical terms

**Building References:**
- Always full brand name: "Flex Hostel Okitipupa"
- Never just "the building" or "our location"
- Building name paired with action: "Apply to Flex Hostel Okitipupa"

**Room References:**
- State name + building: "Alabama at Flex Hostel Okitipupa"
- In tenant dashboard: "Your room: Alabama"

**Growth Signals:**
- Footer: "Currently serving Okitipupa, Ondo State"
- About page: "Expanding across Nigeria"
- Newsletter: "Be first to know about new locations"
- Email signatures: "Sent from Flex Hostel Okitipupa"

**Do NOT Say:**
- "Our only building"
- "Current location"
- "The hostel"
- "Available property"

**DO Say:**
- "Our flagship location in Okitipupa"
- "Flex Hostel Okitipupa"
- "Part of the Flex Hostel family"
- "Join 50 students at Flex Okitipupa"

### 11.5 Minimal Actions Per Screen

**Application form:**
- Multi-step: Personal → School → Roommate (optional) → Review
- Max 5 fields per step
- Progress indicator (1 of 4)
- Save draft (Phase 2)

**Payment page:**
- Single screen, all info visible
- No unnecessary confirmation pages
- Clear summary before Paystack redirect

**Messaging:**
- Single text input + send button
- Image upload (optional) as icon button
- No complex formatting tools

### 11.6 Animations

**Subtle, Premium:**
- Page transitions: Fade (200ms)
- Card hover: Scale + shadow (150ms ease-out)
- Button press: Scale down (100ms)
- Toast slide-in: From top (250ms ease)
- No jarring or bouncy animations
- No excessive motion (respect prefers-reduced-motion)

---

## 12. Marketing & Positioning

### 12.1 Homepage Messaging

**Hero Section:**
- Headline: "Premium Student Living in Okitipupa"
- Subheadline: "50 self-contained rooms. 24/7 security. Your home away from home."
- CTA: "Explore Available Rooms"

**Value Propositions:**
- "Safe & Secure" — 24/7 security personnel, CCTV
- "Modern Comfort" — AC, private bathrooms, study desks
- "Student-Focused" — Flexible communication, reliable support

### 12.2 About Page Content

**Section 1: Our Mission**
- "Flex Hostel is redefining student accommodation across Nigeria. We started with our flagship location in Okitipupa, creating a safe, comfortable, and community-focused living experience for students."

**Section 2: Where We Are**
- Card: **Flex Hostel Okitipupa** (large, detailed)
  - Image, stats, "View Rooms" CTA
- Placeholder cards (2-3, greyed/blurred):
  - "Akure — Coming Soon"
  - "Ado-Ekiti — 2026"
  - "Want us in your city? Let us know →"

**Section 3: Why Students Choose Us**
- Trust: Official platform, secure payments
- Quality: Well-maintained rooms, modern amenities
- Support: Responsive agents, clear communication

**Section 4: Meet Our Team** (optional Phase 2)
- Landlord photo + bio
- Agent team photos

### 12.3 SEO & Metadata

**Homepage:**
- Title: "Flex Hostel — Premium Student Housing in Okitipupa"
- Meta description: "Book your self-contained room at Flex Hostel Okitipupa. 50 rooms, 24/7 security, modern amenities. Official booking platform."

**Building Page:**
- Title: "Flex Hostel Okitipupa — 50 Self-Contained Rooms"
- Description: "Explore Flex Hostel's flagship building in Okitipupa, Ondo State. View available rooms, amenities, and apply online."

**Room Pages:**
- Title: "Room [State Name] — Flex Hostel Okitipupa"
- Description: "₦[Price]/year. [Amenities]. Apply now for Room [State Name] at Flex Hostel Okitipupa."

### 12.4 Social Proof (Phase 2)

- Student testimonials with photos
- "50 students call Flex Okitipupa home"
- Instagram feed integration
- Before/after room photos

---

## 13. Technical Stack

**Frontend:**
- Next.js 14+ (App Router)
- React 18+
- TypeScript
- Tailwind CSS
- Shadcn/ui components

**Backend:**
- Supabase (PostgreSQL + Auth + Storage + Realtime)
- Supabase Edge Functions (for webhooks)

**Payments:**
- Paystack API
- Webhook verification

**Hosting:**
- Vercel (frontend)
- Supabase Cloud (backend)

**Email:**
- Resend or Postmark (TBD)
- Transactional emails: application status, payment confirmations, announcements

**SMS:**
- Termii or Twilio (optional, Phase 2)
- Payment reminders, urgent notifications

**Media:**
- Supabase Storage
- Supabase CDN for image delivery
- Sharp.js or Supabase Edge Function for image processing

**Analytics:**
- Google Analytics or Plausible (privacy-focused)
- Track: Applications, payments, room views

---

## 14. Multi-Building Architecture (Built-In)

### 14.1 Current State (v1)

**Single building mode:**
- `SINGLE_BUILDING_MODE = true` in config
- Building concept visible in UI (not hidden)
- URLs include building slug: `/okitipupa`
- Database schema supports multiple buildings
- All UI components support building context

**Feature flags:**
```typescript
// config/features.ts
export const FEATURES = {
  MULTI_BUILDING_UI: false, // Show building selector, comparison
  BUILDING_COMPARISON: false,
  ADVANCED_FILTERS: false,
};
```

### 14.2 Multi-Building Transition (v2)

**When building #2 is added:**

1. **Database:**
   - Insert new building record
   - Insert 50 new rooms (with state names)
   - Assign agents

2. **Config:**
   - Set `MULTI_BUILDING_UI = true`
   - Remove `PRIMARY_BUILDING_ID` references

3. **Frontend changes (automatic):**
   - Homepage: Shows buildings list (2 cards)
   - Navigation: "Buildings" link appears
   - Room cards: Building badge becomes functional filter
   - Filters: Add "All Buildings" vs specific building
   - Group chat: Building selector for landlord/agents
   - Announcements: Building selector for landlord

4. **URL structure (no breaking changes):**
   - `/` → Buildings list
   - `/okitipupa` → Building 1 (existing URLs work)
   - `/akure` → Building 2 (new)
   - Existing tenant URLs unaffected

5. **Zero data migration needed:**
   - All tenancies remain valid
   - Messages preserved
   - Payments intact

---

## 15. Deployment & Operations

### 15.1 Deployment Pipeline

**Environments:**
- Development: Local + Supabase local dev
- Staging: Vercel preview + Supabase staging project
- Production: Vercel production + Supabase production project

**CI/CD:**
- GitHub → Vercel auto-deploy on push
- Supabase migrations via CLI
- Environment variables in Vercel dashboard

### 15.2 Database Migrations

**Process:**
- All schema changes via Supabase migrations (SQL files)
- Never manual SQL in production
- Migrations tested in staging first
- Rollback plan required for each migration

**Deletion Policies:**
- Buildings: Cannot delete if has active tenancies
- Rooms: Soft delete (status=`inactive`)
- Users: Anonymize, don't hard delete (for audit trail)
- Messages: Retain indefinitely (legal requirement)

### 15.3 Monitoring (Phase 2)

**Logging:**
- All payment events → dedicated log table
- Application state changes → audit trail
- Failed webhook calls → alert to landlord

**Alerts:**
- Payment webhook failure → Email to landlord
- Supabase connection issues → Slack/Email
- Storage quota warnings → Email

**Metrics to track:**
- Payment success rate (target: >98%)
- Application approval time (target: <24hrs)
- Average tenancy booking time (application → payment)

---

## 16. What This Document Is

This document is:

* The **final authority** on product behavior
* The **reference** for AI decisions
* The **baseline** for all schemas, flows, and UI
* A **living document** (update as product evolves)

If a question arises that is not answered here, the system should default to:
**simplicity, clarity, and authority.**

---

## 17. Out of Scope for v1

**Not building in Phase 1:**
- Room comparison feature
- Advanced search/filters (beyond gender + price)
- Student-to-student DMs
- Message editing/deletion
- Push notifications (web push)
- Mobile apps (native iOS/Android)
- Payment plans/installments
- Roommate matching algorithm
- Building reviews/ratings
- Agent performance metrics
- Maintenance request tracking (use messaging)
- Key handover workflow
- Lease document e-signing
- Multi-currency support
- Referral program

**Consider for v2:**
- Second building in Akure
- Mobile app (React Native)
- Advanced tenant portal
- Agent performance dashboard
- Maintenance ticket system
- In-app notifications
- Student testimonials section
- Virtual room tours (360° photos)
- Room reservation (hold without payment)
- Payment reminders (email/SMS)

---

**End of Document**

---

## Quick Reference

**Room Names:** All 50 US state names  
**First Building:** Okitipupa, Ondo State  
**Max Buildings:** 10  
**Rooms per Building:** 50  
**Tenancy Duration:** 12 months only  
**Rent Payment:** Yearly only, via Paystack  
**Database:** Supabase (PostgreSQL)  
**Frontend:** Next.js 14+ / React / TypeScript / Tailwind  
**Image Storage:** Supabase Storage + CDN  

**Critical URLs:**
- `/` — Homepage (building hero + rooms)
- `/okitipupa` — Building detail page
- `/okitipupa/rooms` — Rooms grid
- `/okitipupa/rooms/alabama` — Room detail
- `/apply/alabama` — Application form
- `/dashboard` — Tenant/applicant dashboard
- `/landlord` — Landlord admin

**Support:** All questions about product behavior should reference this document first..1 Application Edge Cases

**Multiple applications from same user:**
- Allowed: User can apply to multiple rooms
- Each application tracked separately
- If multiple approved: User chooses which to pay for
- Unpaid approvals expire after 7 days

**Roommate applications:**
- Roommate info stored in `submitted_data` JSON
- Both applicants must apply separately to same room
- Landlord approves/rejects each individually
- System does not auto-link roommate applications

**Application timeout:**
- Approved applications expire after 7 days if unpaid
- Status → `expired`
- Room status → `available` again
- User can reapply immediately

### 10.2 Payment Edge Cases

**Webhook failure:**
- Payment stays `pending` for 24 hours
- Landlord receives alert (email)
- Landlord can manually verify via Paystack dashboard
- "Verify Payment" button in admin creates tenancy manually

**Duplicate payment attempt (race condition):**
- Database constraint: One active tenancy per room
- Second payment fails at tenancy creation
- User sees error: "Room already occupied"
- Refund initiated automatically via Paystack

**Student pays for wrong room:**
- No automatic reversal
- Student contacts landlord
- Landlord manually reverses in Paystack
- Application status reset to `approved` for correct room

### 10.3 Tenancy Edge Cases

**Tenant refuses to leave after 12 months:**
- Tenancy status remains `active` (no auto-archival)
- Landlord manually archives tenancy
- Room status manually changed to `available`
- Handle via external legal process

**Agent quits mid-tenancy:**
- Landlord reassigns room to different agent
- Tenant notified of new agent
- Message history preserved
- New agent sees full context

**Room damage or disputes:**
- Handle via messaging between tenant, agent, landlord
- No in-app dispute resolution (Phase 1)
- Document in messages for record

### 10