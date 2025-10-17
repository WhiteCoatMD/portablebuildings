# Customer Lead Management System - In Progress

## Progress So Far

### ✅ Completed
1. Reviewed existing database schema
2. Planned leads table structure with the following features:
   - Main `leads` table to track customer inquiries
   - `lead_activities` table for interaction history
   - Status pipeline: new → contacted → quoted → sold/lost
   - Follow-up reminders and date tracking
   - Notes and activity logging
   - Auto-triggers for status changes

### 🚧 Database Schema Design (Ready to implement)

**Tables to create:**
- `leads` - Main customer lead tracking
- `lead_activities` - All interactions and notes

**Key Features:**
- Link leads to specific buildings (optional)
- Track source (website, Facebook, phone, etc.)
- Priority levels (low, medium, high)
- Financial tracking (quoted amount, sold amount)
- Auto-logging of status changes and activities

### ⏳ Next Steps
1. Create database migration file (005_create_leads_system.sql)
2. Build API endpoints:
   - POST /api/leads/create
   - GET /api/leads/list
   - PUT /api/leads/update
   - DELETE /api/leads/delete
   - POST /api/leads/:id/activity (add note/activity)
   - GET /api/leads/:id/activities (get history)
3. Add "Leads" tab to admin panel
4. Add lead capture form to public building pages
5. Build lead status pipeline UI (kanban board style?)
6. Test complete workflow

### 💡 Feature Ideas
- Email notifications for new leads
- SMS reminders for follow-ups
- Lead conversion reports/analytics
- Bulk actions (mark multiple as contacted, etc.)

---

## On Hold - Paused to fix Facebook issue
**Issue:** Need to enable `pages_manage_posts` permission for Facebook posting to go live
**Next:** Help Mitch get Facebook working, then resume lead management
