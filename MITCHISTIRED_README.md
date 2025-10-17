# ShedSync - Portable Buildings Inventory & Lead Management Platform

## 🛠️ Complete Tech Stack

### Frontend
- **HTML5/CSS3** - Responsive UI with custom styling
- **Vanilla JavaScript** - No framework dependencies, lightweight and fast
- **Service Workers** - Progressive Web App (PWA) capabilities
- **Image Gallery** - Custom-built carousel with navigation
- **Modal System** - Custom modals for lead capture and details

### Backend
- **Node.js** - Runtime environment
- **Vercel Serverless Functions** - API endpoints and routing
- **pg (node-postgres)** - PostgreSQL database driver
- **dotenv** - Environment variable management
- **JWT (jsonwebtoken)** - Authentication and authorization
- **bcrypt** - Password hashing and security

### Database
- **PostgreSQL** - Hosted on Prisma (db.prisma.io)
- **Schema Features:**
  - User accounts with multi-tenant support
  - Inventory management with custom fields
  - Lead management with activity tracking
  - Demo request tracking
  - Image storage references
  - Facebook post tracking

### Authentication & Security
- **JWT Tokens** - Secure session management
- **bcrypt** - Password encryption
- **Super Admin System** - Role-based access control
- **Subdomain Routing** - Multi-tenant isolation

### External Services & APIs
- **Facebook Graph API** - OAuth login and marketplace posting
- **Playwright** - Web scraping for inventory sync
- **Custom Scraper** - GPB Sales inventory automation
- **Email System** - Lead notifications via mailto links
- **SMS Integration** - Share via text functionality

### Deployment & Hosting
- **Vercel** - Serverless deployment platform
- **GitHub** - Version control and CI/CD
- **Custom Domain Support** - User-customizable domains
- **Subdomain System** - Auto-provisioning per user

### Development Tools
- **Git** - Version control
- **SSH** - Server management
- **Migration Scripts** - Database schema versioning
- **Environment Variables** - .env.local configuration

### Key Features Built
1. **Multi-Tenant SaaS Platform** - Each dealer gets their own subdomain
2. **Inventory Management** - Sync from external sources, manual uploads
3. **Lead Management System** - Full CRM with pipeline and activity tracking
4. **Demo Request System** - ShedSync platform lead capture
5. **Facebook Integration** - Auto-post to marketplace
6. **Admin Panel** - Comprehensive dealer management
7. **Super Admin Panel** - Platform-wide control
8. **Public Site Builder** - Customizable dealer storefronts
9. **Image Upload System** - Multi-image gallery per building
10. **RTO Calculator** - Rent-to-own pricing display

---

# Customer Lead Management System - In Progress

## Progress So Far

### ✅ Completed
1. Facebook OAuth fixed and working!
2. Database schema design and migration created
3. Database tables created (`leads` and `lead_activities`)
4. API endpoints built:
   - POST /api/leads/create
   - GET /api/leads/list
   - PUT /api/leads/update
   - POST /api/leads/add-activity

### ⏳ Next Steps
1. Add "Leads" tab button to admin panel
2. Build Leads tab UI with:
   - Lead cards grouped by status
   - Quick add form
   - Lead detail modal
   - Activity timeline
3. Add lead capture form to public building pages
4. Test complete workflow

### 🎯 Lead System Features
- **Status Pipeline:** new → contacted → quoted → sold/lost
- **Activity Tracking:** Auto-logs status changes, supports manual notes
- **Follow-ups:** Date tracking and reminders
- **Building Link:** Optional connection to specific inventory
- **Source Tracking:** Website, Facebook, phone, etc.
- **Priority Levels:** Low, medium, high

### 💡 Future Enhancements
- Email notifications for new leads
- SMS reminders for follow-ups
- Lead conversion analytics
- Bulk status updates
