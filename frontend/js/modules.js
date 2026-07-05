document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Create Modal HTML
    const modalHTML = `
        <div class="modal-overlay" id="app-modal">
            <div class="modal-content">
                <h3 id="modal-title" style="margin-bottom: 1.5rem;">Add</h3>
                <div id="modal-body"></div>
                <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
                    <button class="btn" id="modal-close" style="background: white; color: var(--text-main); border: 1px solid var(--border-color);">Cancel</button>
                    <button class="btn" id="modal-submit">Save</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('app-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalSubmit = document.getElementById('modal-submit');
    document.getElementById('modal-close').onclick = () => modal.classList.remove('active');

    let currentCases = [];
    try {
        const res = await fetch('https://investigation-managent.onrender.com/api/cases', { headers: { 'Authorization': `Bearer ${token}` } });
        currentCases = await res.json();
    } catch(err) { console.error(err); }

    const globalSelect = document.getElementById('global-case-select');
    if (globalSelect) {
        globalSelect.innerHTML = '<option value="">Select Case...</option>';
        currentCases.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c._id;
            opt.textContent = `FIR: ${c.firNumber} - ${c.sections}`;
            globalSelect.appendChild(opt);
        });

        const savedCase = localStorage.getItem('activeCaseId');
        if(savedCase && currentCases.find(x => x._id === savedCase)) {
            globalSelect.value = savedCase;
        }

        globalSelect.addEventListener('change', () => {
            localStorage.setItem('activeCaseId', globalSelect.value);
            renderCurrentPage();
        });
    }

    function renderCurrentPage() {
        const activeId = globalSelect?.value;
        const c = currentCases.find(x => x._id === activeId);

        // Case Overview
        if(document.getElementById('overview-stats')) {
            if(!c) return;
            document.getElementById('overview-stats').style.display = 'grid';
            document.getElementById('overview-details').style.display = 'block';
            document.getElementById('ov-fir').textContent = c.firNumber;
            document.getElementById('ov-status').textContent = c.status;
            document.getElementById('ov-date').textContent = new Date(c.incidentDate).toLocaleDateString();
            document.getElementById('ov-ps').textContent = "Kotwali City"; // Static for now
            document.getElementById('ov-sections').textContent = c.sections;
            document.getElementById('ov-victim').textContent = c.victimDetails;
            document.getElementById('ov-accused').textContent = c.accusedDetails;
        }

        // Timeline
        const tContainer = document.getElementById('timeline-container');
        if(tContainer) {
            if(!c) { tContainer.innerHTML = '<div style="padding: 2rem; text-align: center;">Select a case first</div>'; return; }
            tContainer.innerHTML = '';
            (c.timeline || []).forEach(t => {
                tContainer.innerHTML += `
                    <div class="timeline-item">
                        <div class="timeline-date">${new Date(t.date).toLocaleString()}</div>
                        <div class="timeline-title">${t.title}</div>
                        <p style="font-size: 0.9rem; color: var(--text-muted);">${t.description}</p>
                        <span class="task-badge green" style="display: inline-block; margin-top: 0.5rem;">${t.status}</span>
                    </div>
                `;
            });
        }

        // Helper to render documents
        const renderDocs = (containerId, categoryFilter, titleMsg) => {
            const container = document.getElementById(containerId);
            if(!container) return;
            if(!c) { container.innerHTML = '<div style="padding: 2rem; text-align: center;">Select a case first</div>'; return; }
            
            const docs = (c.documents || []).filter(d => d.category === categoryFilter);
            if(docs.length === 0) {
                container.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted);">कोई ${titleMsg} अपलोड नहीं किया गया है।</div>`;
                return;
            }
            
            container.innerHTML = docs.map(d => {
                const urlPath = '/' + d.filePath.replace(/\\/g, '/').replace(/^\//, '');
                return `
                <div class="task-item">
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <div style="font-size: 2rem; color: var(--primary-color);">
                            <i class="ph ph-file-pdf"></i>
                        </div>
                        <div>
                            <h4 style="margin-bottom: 0.25rem;">${d.fileName}</h4>
                            <p style="font-size: 0.85rem; color: var(--text-muted);">${new Date(d.uploadDate).toLocaleString()} • ${d.description || 'No description'}</p>
                        </div>
                    </div>
                    <a href="https://investigation-managent.onrender.com${urlPath}" target="_blank" class="task-badge green">View File</a>
                </div>
                `;
            }).join('');
        };

        // Render document-based modules
        renderDocs('parcha-container', 'Investigation Parchas', 'पर्चा');
        renderDocs('notice-container', 'Other Documents', 'नोटिस');
        renderDocs('medical-container', 'Medical', 'मेडिकल रिकॉर्ड');
        renderDocs('fsl-container', 'FSL', 'FSL रिपोर्ट');
        renderDocs('court-container', 'Court Orders', 'कोर्ट ऑर्डर');
        
        // Evidence (Also document based now)
        const eTbody = document.getElementById('evidence-tbody');
        if(eTbody) {
            if(!c) { eTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">Select a case first</td></tr>'; return; }
            const evDocs = (c.documents || []).filter(d => d.category === 'Evidence');
            if(evDocs.length === 0) {
                eTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">कोई साक्ष्य अपलोड नहीं किया गया है।</td></tr>';
            } else {
                eTbody.innerHTML = evDocs.map(d => {
                    const urlPath = '/' + d.filePath.replace(/\\/g, '/').replace(/^\//, '');
                    return `
                    <tr>
                        <td><strong>${d.fileName}</strong></td>
                        <td>${d.fileType}</td>
                        <td>${d.description || '-'}</td>
                        <td>${new Date(d.uploadDate).toLocaleDateString()}</td>
                        <td><a href="https://investigation-managent.onrender.com${urlPath}" target="_blank" class="task-badge green">View</a></td>
                    </tr>
                    `;
                }).join('');
            }
        }

        // Witnesses
        const wGrid = document.getElementById('witness-grid');
        if(wGrid) {
            if(!c) { wGrid.innerHTML = '<div style="padding: 2rem; text-align: center; grid-column: 1/-1;">Select a case first</div>'; return; }
            wGrid.innerHTML = '';
            (c.witnesses || []).forEach(w => {
                wGrid.innerHTML += `
                    <div class="profile-card">
                        <div class="profile-photo"><i class="ph ph-user"></i></div>
                        <div class="profile-info">
                            <h4>${w.name}</h4>
                            <p>${w.contact} • ${w.address}</p>
                            <p style="margin-top: 0.5rem;"><span class="task-badge green">${w.status || 'Added'}</span></p>
                        </div>
                    </div>
                `;
            });
        }

        // Accused
        const aGrid = document.getElementById('accused-grid');
        if(aGrid) {
            if(!c) { aGrid.innerHTML = '<div style="padding: 2rem; text-align: center; grid-column: 1/-1;">Select a case first</div>'; return; }
            aGrid.innerHTML = '';
            (c.accused || []).forEach(a => {
                aGrid.innerHTML += `
                    <div class="profile-card">
                        <div class="profile-photo" style="background: #fee2e2; color: #b91c1c;"><i class="ph ph-user-focus"></i></div>
                        <div class="profile-info">
                            <h4>${a.name}</h4>
                            <p>${a.personalDetails}</p>
                            <p style="margin-top: 0.5rem;"><span class="task-badge red">${a.arrestStatus || 'Wanted'}</span></p>
                        </div>
                    </div>
                `;
            });
        }
    }

    if(globalSelect) renderCurrentPage();

    // ==========================================
    // Modals Handling
    // ==========================================

    const attachJSONModal = (btnId, title, html, endpointSuffix, getData) => {
        const btn = document.getElementById(btnId);
        if(!btn) return;
        btn.addEventListener('click', () => {
            if(!globalSelect.value) return showNotification('Select a case first', 'error');
            modalTitle.textContent = title;
            modalBody.innerHTML = html;
            modal.classList.add('active');
            
            modalSubmit.onclick = async () => {
                const data = getData();
                const res = await fetch(`https://investigation-managent.onrender.com/api/cases/${globalSelect.value}/${endpointSuffix}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if(res.ok) {
                    const updated = await res.json();
                    currentCases[currentCases.findIndex(x => x._id === globalSelect.value)] = updated;
                    renderCurrentPage();
                    modal.classList.remove('active');
                    showNotification('Added successfully');
                }
            };
        });
    };

    const attachUploadModal = (btnId, title, category) => {
        const btn = document.getElementById(btnId);
        if(!btn) return;
        btn.addEventListener('click', () => {
            if(!globalSelect.value) return showNotification('Select a case first', 'error');
            modalTitle.textContent = title;
            modalBody.innerHTML = `
                <input type="text" id="doc-name" class="form-control" placeholder="Document Name (e.g., Parcha No. 1)" style="margin-bottom: 1rem;">
                <textarea id="doc-desc" class="form-control" placeholder="Short Description (Optional)" style="margin-bottom: 1rem;"></textarea>
                <input type="file" id="doc-file" class="form-control" accept="image/*,.pdf" style="margin-bottom: 1rem; padding: 0.5rem;">
                <div style="font-size: 0.8rem; color: var(--text-muted);"><i class="ph ph-info"></i> Only PDF or Images allowed. Offline documents should be scanned and uploaded here.</div>
            `;
            modal.classList.add('active');
            
            modalSubmit.onclick = async () => {
                const name = document.getElementById('doc-name').value;
                const fileInput = document.getElementById('doc-file');
                if(!name || !fileInput.files[0]) return alert("Please provide a name and select a file.");

                const formData = new FormData();
                formData.append('fileName', name);
                formData.append('description', document.getElementById('doc-desc').value);
                formData.append('category', category);
                formData.append('files', fileInput.files[0]); // Must be 'files' for multer

                try {
                    const res = await fetch(`https://investigation-managent.onrender.com/api/cases/${globalSelect.value}/documents`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: formData
                    });
                    if(res.ok) {
                        // Re-fetch all cases to get the updated document list properly
                        const casesRes = await fetch('https://investigation-managent.onrender.com/api/cases', { headers: { 'Authorization': `Bearer ${token}` } });
                        currentCases = await casesRes.json();
                        renderCurrentPage();
                        modal.classList.remove('active');
                        showNotification('Document uploaded successfully');
                    } else {
                        const err = await res.json();
                        alert("Error: " + (err.error || 'Failed to upload'));
                    }
                } catch(e) { console.error(e); alert("Network error"); }
            };
        });
    };

    attachJSONModal('add-timeline-btn', 'Add Timeline Event', `
        <input type="text" id="t-title" class="form-control" placeholder="Event Title" style="margin-bottom: 1rem;">
        <textarea id="t-desc" class="form-control" placeholder="Description" style="margin-bottom: 1rem;"></textarea>
    `, 'timeline', () => ({
        title: document.getElementById('t-title').value,
        description: document.getElementById('t-desc').value,
        status: 'Completed'
    }));

    attachJSONModal('add-witness-btn', 'Add Witness', `
        <input type="text" id="w-name" class="form-control" placeholder="Name" style="margin-bottom: 1rem;">
        <input type="text" id="w-contact" class="form-control" placeholder="Mobile" style="margin-bottom: 1rem;">
        <textarea id="w-address" class="form-control" placeholder="Address" style="margin-bottom: 1rem;"></textarea>
    `, 'witnesses', () => ({
        name: document.getElementById('w-name').value,
        contact: document.getElementById('w-contact').value,
        address: document.getElementById('w-address').value,
        status: 'Recorded'
    }));

    attachJSONModal('add-accused-btn', 'Add Accused', `
        <input type="text" id="a-name" class="form-control" placeholder="Name" style="margin-bottom: 1rem;">
        <textarea id="a-details" class="form-control" placeholder="Details" style="margin-bottom: 1rem;"></textarea>
        <select id="a-status" class="form-control">
            <option>Wanted</option><option>Arrested</option>
        </select>
    `, 'accused', () => ({
        name: document.getElementById('a-name').value,
        personalDetails: document.getElementById('a-details').value,
        arrestStatus: document.getElementById('a-status').value
    }));

    // Smart Search
    const searchBtn = document.getElementById('smart-search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const query = document.getElementById('smart-search-input').value.toLowerCase();
            const resultsDiv = document.getElementById('smart-search-results');
            if(!query) return;
            
            const results = currentCases.filter(c => {
                return (c.firNumber && c.firNumber.toLowerCase().includes(query)) ||
                       (c.sections && c.sections.toLowerCase().includes(query)) ||
                       (c.victimDetails && c.victimDetails.toLowerCase().includes(query)) ||
                       (c.accusedDetails && c.accusedDetails.toLowerCase().includes(query));
            });
            
            if(results.length === 0) {
                resultsDiv.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">कोई जानकारी नहीं मिली।</div>';
                return;
            }
            
            resultsDiv.innerHTML = results.map(c => `
                <div class="task-item" style="cursor:pointer; margin-bottom: 1rem;" onclick="document.getElementById('global-case-select').value = '${c._id}'; document.getElementById('global-case-select').dispatchEvent(new Event('change')); window.location.href='case-overview.html'">
                    <div>
                        <h4 style="color: var(--primary-color);">FIR: ${c.firNumber} <span class="task-badge">${c.status}</span></h4>
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">${c.sections}</p>
                        <p style="font-size: 0.85rem; margin-top: 0.25rem;"><strong>वादी:</strong> ${c.victimDetails || '-'} | <strong>आरोपी:</strong> ${c.accusedDetails || '-'}</p>
                    </div>
                </div>
            `).join('');
        });
    }

    // Universal File Upload Modals for Document-based modules
    attachUploadModal('add-parcha-btn', 'Upload Case Diary (Parcha)', 'Investigation Parchas');
    attachUploadModal('add-evidence-btn', 'Upload Evidence Document', 'Evidence');
    attachUploadModal('add-notice-btn', 'Upload Notice/Summons', 'Other Documents');
    attachUploadModal('add-medical-btn', 'Upload Medical Report', 'Medical');
    attachUploadModal('add-fsl-btn', 'Upload FSL Report', 'FSL');
    attachUploadModal('add-court-btn', 'Upload Court Order', 'Court Orders');

});
