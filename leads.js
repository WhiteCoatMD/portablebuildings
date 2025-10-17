/**
 * Lead Management JavaScript
 */

let currentLeads = [];
let selectedLead = null;

// Load leads on page load (only if on leads tab)
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the admin page
    if (document.getElementById('leads-tab')) {
        // Listen for tab switches - load leads when switching to leads tab
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.dataset.tab === 'leads') {
                    loadLeads();
                }
            });
        });
    }
});

/**
 * Add a new lead
 */
async function addNewLead() {
    const name = document.getElementById('new-lead-name').value.trim();
    const phone = document.getElementById('new-lead-phone').value.trim();
    const email = document.getElementById('new-lead-email').value.trim();
    const source = document.getElementById('new-lead-source').value;
    const priority = document.getElementById('new-lead-priority').value;
    const buildingSerial = document.getElementById('new-lead-building').value.trim();
    const notes = document.getElementById('new-lead-notes').value.trim();

    // Validation
    if (!name) {
        showToast('❌ Customer name is required');
        return;
    }

    if (!phone && !email) {
        showToast('❌ Either phone or email is required');
        return;
    }

    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/leads/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                customerName: name,
                customerPhone: phone || null,
                customerEmail: email || null,
                source: source,
                priority: priority,
                buildingSerial: buildingSerial || null,
                notes: notes || null
            })
        });

        const data = await response.json();

        if (data.success) {
            showToast('✅ Lead added successfully!');

            // Clear form
            document.getElementById('new-lead-name').value = '';
            document.getElementById('new-lead-phone').value = '';
            document.getElementById('new-lead-email').value = '';
            document.getElementById('new-lead-source').value = 'website';
            document.getElementById('new-lead-priority').value = 'medium';
            document.getElementById('new-lead-building').value = '';
            document.getElementById('new-lead-notes').value = '';

            // Reload leads
            loadLeads();
        } else {
            showToast(`❌ Error: ${data.error}`);
        }
    } catch (error) {
        console.error('Error adding lead:', error);
        showToast('❌ Failed to add lead');
    }
}

/**
 * Load all leads from API
 */
async function loadLeads() {
    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/leads/list', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            currentLeads = data.leads;
            renderLeads();
        } else {
            showToast(`❌ Error loading leads: ${data.error}`);
        }
    } catch (error) {
        console.error('Error loading leads:', error);
        showToast('❌ Failed to load leads');
    }
}

/**
 * Render leads into compact table view
 */
function renderLeads() {
    // Count leads by status
    const leadsByStatus = {
        new: 0,
        contacted: 0,
        quoted: 0,
        sold: 0,
        lost: 0
    };

    currentLeads.forEach(lead => {
        if (leadsByStatus.hasOwnProperty(lead.status)) {
            leadsByStatus[lead.status]++;
        }
    });

    // Update counts
    document.getElementById('new-count').textContent = leadsByStatus.new;
    document.getElementById('contacted-count').textContent = leadsByStatus.contacted;
    document.getElementById('quoted-count').textContent = leadsByStatus.quoted;
    document.getElementById('sold-count').textContent = leadsByStatus.sold;
    document.getElementById('lost-count').textContent = leadsByStatus.lost;

    // Render table rows
    const tbody = document.getElementById('leads-table-body');
    const emptyMessage = document.getElementById('empty-leads-message');

    if (currentLeads.length === 0) {
        tbody.innerHTML = '';
        emptyMessage.style.display = 'block';
    } else {
        emptyMessage.style.display = 'none';
        tbody.innerHTML = currentLeads.map(renderLeadRow).join('');
    }
}

/**
 * Render a single lead as a table row
 */
function renderLeadRow(lead) {
    const priorityColors = {
        high: '#f44336',
        medium: '#ff9800',
        low: '#4caf50'
    };

    const statusConfig = {
        new: { color: '#2196f3', icon: '🆕', label: 'New' },
        contacted: { color: '#ff9800', icon: '📞', label: 'Contacted' },
        quoted: { color: '#9c27b0', icon: '💰', label: 'Quoted' },
        sold: { color: '#4caf50', icon: '✅', label: 'Sold' },
        lost: { color: '#f44336', icon: '❌', label: 'Lost' }
    };

    const priorityColor = priorityColors[lead.priority] || '#999';
    const status = statusConfig[lead.status] || { color: '#999', icon: '●', label: lead.status };

    const contactInfo = [
        lead.customerPhone ? `📞 ${lead.customerPhone}` : null,
        lead.customerEmail ? `📧 ${lead.customerEmail}` : null
    ].filter(Boolean).join(' • ');

    const createdDate = new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return `
        <tr style="border-bottom: 1px solid #e0e0e0; cursor: pointer; transition: background 0.2s;"
            onclick="viewLeadDetails(${lead.id})"
            onmouseover="this.style.background='#f8f9fa'"
            onmouseout="this.style.background='white'">
            <td style="padding: 0.875rem 1rem;">
                <span style="display: inline-flex; align-items: center; gap: 0.375rem; background: ${status.color}; color: white; padding: 0.375rem 0.75rem; border-radius: 16px; font-size: 0.8rem; font-weight: 600;">
                    ${status.icon} ${status.label}
                </span>
            </td>
            <td style="padding: 0.875rem 1rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <strong style="color: #333; font-size: 0.95rem;">${lead.customerName}</strong>
                    <span style="width: 8px; height: 8px; border-radius: 50%; background: ${priorityColor}; display: inline-block;" title="${lead.priority} priority"></span>
                </div>
            </td>
            <td style="padding: 0.875rem 1rem; font-size: 0.875rem; color: #666;">
                ${contactInfo || '—'}
            </td>
            <td style="padding: 0.875rem 1rem; font-size: 0.875rem; color: #666;">
                ${lead.buildingSerial ? `🏠 ${lead.buildingSerial}` : '—'}
            </td>
            <td style="padding: 0.875rem 1rem; font-size: 0.875rem; color: #666;">
                ${createdDate}
            </td>
            <td style="padding: 0.875rem 1rem; font-size: 0.875rem; color: #666; text-transform: capitalize;">
                ${lead.source}
            </td>
        </tr>
    `;
}

/**
 * View lead details in modal
 */
async function viewLeadDetails(leadId) {
    const lead = currentLeads.find(l => l.id === leadId);
    if (!lead) return;

    selectedLead = lead;

    // Build modal content
    const modalContent = `
        <div style="margin-bottom: 1.5rem;">
            <h3 style="margin: 0 0 1rem 0; color: #333;">${lead.customerName}</h3>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                <div>
                    <div style="font-size: 0.75rem; color: #999; margin-bottom: 0.25rem;">Phone</div>
                    <div style="font-weight: 600;">${lead.customerPhone || '—'}</div>
                </div>
                <div>
                    <div style="font-size: 0.75rem; color: #999; margin-bottom: 0.25rem;">Email</div>
                    <div style="font-weight: 600;">${lead.customerEmail || '—'}</div>
                </div>
                <div>
                    <div style="font-size: 0.75rem; color: #999; margin-bottom: 0.25rem;">Source</div>
                    <div style="font-weight: 600; text-transform: capitalize;">${lead.source}</div>
                </div>
                <div>
                    <div style="font-size: 0.75rem; color: #999; margin-bottom: 0.25rem;">Priority</div>
                    <div style="font-weight: 600; text-transform: capitalize;">${lead.priority}</div>
                </div>
            </div>

            ${lead.buildingSerial ? `
            <div style="margin-bottom: 1rem;">
                <div style="font-size: 0.75rem; color: #999; margin-bottom: 0.25rem;">Interested Building</div>
                <div style="font-weight: 600;">${lead.buildingSerial}</div>
            </div>
            ` : ''}

            ${lead.notes ? `
            <div style="margin-bottom: 1rem;">
                <div style="font-size: 0.75rem; color: #999; margin-bottom: 0.25rem;">Notes</div>
                <div style="background: #f8f9fa; padding: 0.75rem; border-radius: 4px;">${lead.notes}</div>
            </div>
            ` : ''}

            <div style="margin-bottom: 1rem;">
                <div style="font-size: 0.75rem; color: #999; margin-bottom: 0.25rem;">Created</div>
                <div>${new Date(lead.createdAt).toLocaleString()}</div>
            </div>
        </div>

        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
            <h4 style="margin: 0 0 0.75rem 0;">Update Status</h4>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button class="btn btn-sm" onclick="updateLeadStatus(${lead.id}, 'new')" style="background: #2196f3; color: white;">New</button>
                <button class="btn btn-sm" onclick="updateLeadStatus(${lead.id}, 'contacted')" style="background: #ff9800; color: white;">Contacted</button>
                <button class="btn btn-sm" onclick="updateLeadStatus(${lead.id}, 'quoted')" style="background: #9c27b0; color: white;">Quoted</button>
                <button class="btn btn-sm" onclick="updateLeadStatus(${lead.id}, 'sold')" style="background: #4caf50; color: white;">Sold</button>
                <button class="btn btn-sm" onclick="updateLeadStatus(${lead.id}, 'lost')" style="background: #f44336; color: white;">Lost</button>
            </div>
        </div>

        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px;">
            <h4 style="margin: 0 0 0.75rem 0;">Add Note/Activity</h4>
            <textarea id="activity-note" class="form-control" rows="3" placeholder="Add a note, call log, or update..."></textarea>
            <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                <button class="btn btn-primary btn-sm" onclick="addActivity('note')">Add Note</button>
                <button class="btn btn-secondary btn-sm" onclick="addActivity('call')">Log Call</button>
                <button class="btn btn-secondary btn-sm" onclick="addActivity('email')">Log Email</button>
            </div>
        </div>
    `;

    document.getElementById('lead-modal-title').textContent = `Lead: ${lead.customerName}`;
    document.getElementById('lead-modal-content').innerHTML = modalContent;
    document.getElementById('lead-modal').style.display = 'flex';
}

/**
 * Close lead modal
 */
function closeLeadModal() {
    document.getElementById('lead-modal').style.display = 'none';
    selectedLead = null;
}

/**
 * Update lead status
 */
async function updateLeadStatus(leadId, newStatus) {
    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/leads/update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                leadId: leadId,
                status: newStatus
            })
        });

        const data = await response.json();

        if (data.success) {
            showToast(`✅ Status updated to ${newStatus}`);
            closeLeadModal();
            loadLeads();
        } else {
            showToast(`❌ Error: ${data.error}`);
        }
    } catch (error) {
        console.error('Error updating lead status:', error);
        showToast('❌ Failed to update status');
    }
}

/**
 * Add activity/note to lead
 */
async function addActivity(activityType) {
    const note = document.getElementById('activity-note').value.trim();

    if (!note) {
        showToast('❌ Please enter a note');
        return;
    }

    if (!selectedLead) return;

    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/leads/add-activity', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                leadId: selectedLead.id,
                activityType: activityType,
                description: note
            })
        });

        const data = await response.json();

        if (data.success) {
            showToast(`✅ ${activityType} added`);
            document.getElementById('activity-note').value = '';

            // Reload to get updated last_contacted_at
            loadLeads();
        } else {
            showToast(`❌ Error: ${data.error}`);
        }
    } catch (error) {
        console.error('Error adding activity:', error);
        showToast('❌ Failed to add activity');
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('lead-modal');
    if (modal && e.target === modal) {
        closeLeadModal();
    }
});
