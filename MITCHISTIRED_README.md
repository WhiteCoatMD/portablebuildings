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

---

# 🚨 CRITICAL BUG - INQUIRE BUTTONS NOT CLICKABLE (2025-01-17)

## Problem Description
The "Inquire About This Building" buttons on dealer sites (e.g., patriot-buildings.us) are **NOT clickable**:
- Buttons respond to hover (move/transform on hover) ✅
- CSS styling works perfectly ✅
- Right-click does NOT show context menu (means something is blocking clicks) ❌
- Left-click does NOTHING - no console errors, no response ❌

## What We've Tried (All Failed)
1. ✅ Fixed function parameter mismatch:
   - Changed from: `onclick="openInquiryModal(event, '${building.serialNumber}')"`
   - Changed to: `onclick="openInquiryModal('${building.serialNumber}')"`
   - File: `app.js` line 573
   - Status: Code is correct, but buttons still don't work

2. ✅ Verified function signature matches:
   - Function definition in `site.html`: `function openInquiryModal(serialNumber)`
   - Function call in `app.js`: `onclick="openInquiryModal('${building.serialNumber}')"`
   - Status: Perfect match, but still no clicks

3. ✅ Removed unnecessary CSS that might block clicks:
   - Removed: `z-index: 100`
   - Removed: `pointer-events: auto`
   - Removed emoji from button text
   - File: `styles.css` lines 652-667
   - Status: No effect on clickability

4. ✅ Made buttons square (border-radius: 6px instead of 12px)
   - User requested this visual change
   - Status: Visual change worked, but still not clickable

5. ✅ Fixed demo form duplicate issue on shed-sync.com
   - Removed duplicate form at bottom
   - Kept single form at top
   - Status: Demo form fixed, but inquire buttons still broken

6. ✅ Cleared Vercel CDN cache (3x empty commits)
   - Forced multiple redeployments
   - Status: Changes deployed, but buttons still don't work

## Current Code State

### app.js (line 573-575) - Button HTML:
```javascript
<button class="inquire-btn" onclick="openInquiryModal('${building.serialNumber}')">
    Inquire About This Building
</button>
```

### styles.css (lines 652-667) - Button Styles:
```css
/* Inquire Button */
.inquire-btn {
    width: 75%;
    padding: 1rem;
    margin: 0.75rem auto;
    display: block;
    background: #28a745;
    color: var(--white);
    border: none;
    border-radius: 6px;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.inquire-btn:hover {
    background: #218838;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(40, 167, 69, 0.4);
}
```

### site.html (line 270+) - Modal Function:
```javascript
function openInquiryModal(serialNumber) {
    const building = window.PROCESSED_INVENTORY.find(b => b.serialNumber === serialNumber);
    if (!building) return;

    currentInquiryBuilding = building;
    document.getElementById('inquiry-building-serial').value = serialNumber;
    document.getElementById('inquiry-modal-title').textContent = `Inquire About: ${building.title}`;

    // Reset form
    document.getElementById('inquiry-form').reset();
    document.getElementById('inquiry-form').style.display = 'block';
    document.getElementById('inquiry-success').style.display = 'none';

    // Show modal
    document.getElementById('inquiry-modal').style.display = 'flex';
}
```

## Key Observations
1. **Hover works** - This means CSS is reaching the button
2. **No right-click menu** - This is THE KEY CLUE! Something is overlaying/blocking the button
3. **RTO buttons work** - These are in the SAME building card and work perfectly:
   ```javascript
   <button class="rto-button" onclick="toggleRTO(event, '${building.serialNumber}')">
       Rent to Own Options
   </button>
   ```
4. **No console errors** - JavaScript isn't throwing errors, clicks just don't register

## Potential Causes to Investigate (AM)
1. **Overlaying Element:**
   - Check if `.share-buttons` div (rendered AFTER inquire button) is positioned absolute and covering it
   - Check if `.building-serial` div is overlaying the button
   - Use browser DevTools to inspect z-index stacking context
   - Check if `.building-info` container has overflow or pointer-events issues

2. **Event Propagation Issues:**
   - Check if parent `.building-card` has `pointer-events: none` or similar
   - Check if any click event listeners on parent are calling `preventDefault()` or `stopPropagation()`
   - Look for global click handlers that might be blocking

3. **Template String Issues:**
   - Verify `${building.serialNumber}` is rendering correctly
   - Check for quotes breaking the onclick attribute
   - Inspect actual rendered HTML in browser DevTools

4. **Modal Already Open:**
   - Check if `#inquiry-modal` is already displayed and blocking clicks
   - Check modal z-index and positioning

5. **CSS Issues:**
   - Check if `.building-card` or parent containers have `pointer-events: none`
   - Check for negative z-index on button
   - Check if button is being rendered behind another element

## Debug Steps for Morning

### Step 1: Inspect Rendered HTML
```javascript
// In browser console on patriot-buildings.us:
document.querySelectorAll('.inquire-btn').forEach(btn => {
    console.log('Button:', btn);
    console.log('onclick:', btn.onclick);
    console.log('getAttribute onclick:', btn.getAttribute('onclick'));
});
```

### Step 2: Check for Overlays
```javascript
// In browser console:
document.querySelectorAll('.inquire-btn').forEach(btn => {
    const rect = btn.getBoundingClientRect();
    const element = document.elementFromPoint(rect.x + rect.width/2, rect.y + rect.height/2);
    console.log('Element at button center:', element);
    console.log('Is it the button?', element === btn);
});
```

### Step 3: Check Computed Styles
```javascript
// In browser console:
document.querySelectorAll('.inquire-btn').forEach(btn => {
    const styles = window.getComputedStyle(btn);
    console.log('pointer-events:', styles.pointerEvents);
    console.log('z-index:', styles.zIndex);
    console.log('position:', styles.position);
});
```

### Step 4: Test Manual Click
```javascript
// In browser console:
document.querySelectorAll('.inquire-btn')[0].click();
// Does this open the modal? If yes, problem is event capture. If no, problem is function.
```

### Step 5: Check Building Card HTML
- Use DevTools Elements tab to inspect the full `.building-card` structure
- Look for any elements positioned absolute that might overlay the button
- Check the order of elements - make sure nothing after `.inquire-btn` is covering it

## Files to Review in Morning
1. `app.js` - Building card HTML generation (lines 548-600)
2. `styles.css` - Check `.building-card`, `.building-info`, `.share-buttons`, `.building-serial` styles
3. `site.html` - Check for global event listeners, modal positioning
4. `index.html` on dealer sites - Inspect live DOM in browser

## Comparison to Working RTO Button
The RTO button works perfectly and is in the same card:
- Location: `app.js` line 521
- onclick: `toggleRTO(event, '${building.serialNumber}')` (takes event parameter!)
- Position: ABOVE the inquire button in the same `.building-details` container

**Why does RTO button work but inquire button doesn't?**
- Both are in same parent container
- Both use onclick handlers
- RTO takes `event` parameter, inquire doesn't (but this shouldn't prevent clicks)
- **Need to inspect actual rendered position and z-index of both buttons**

## Deployment Status
- All code changes committed: ✅
- Pushed to GitHub: ✅
- Vercel deployed (3x cache clears): ✅
- Demo form fixed on shed-sync.com: ✅
- Inquire buttons still broken: ❌

## Next Session Action Plan
1. Open patriot-buildings.us in browser
2. Open DevTools Console
3. Run all debug steps above
4. Identify the blocking element or CSS issue
5. Fix and test immediately
6. Deploy and verify fix works

**DO NOT WASTE TIME ON COMPLEX SOLUTIONS - THIS IS LIKELY A SIMPLE OVERLAY OR CSS ISSUE!**
