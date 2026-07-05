document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    const caseSelect = document.getElementById('case-select');
    const tbody = document.getElementById('vault-table-body');
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('file-input');

    let currentCases = [];

    // Fetch cases
    try {
        const res = await fetch('http://localhost:5001/api/cases', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        currentCases = await res.json();
        
        caseSelect.innerHTML = '<option value="">Select Case...</option>';
        currentCases.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c._id;
            opt.textContent = `FIR: ${c.firNumber} - ${c.sections}`;
            caseSelect.appendChild(opt);
        });
    } catch (err) {
        console.error(err);
    }

    // Handle case selection
    caseSelect.addEventListener('change', () => {
        const selectedId = caseSelect.value;
        if (!selectedId) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">Select a case to view documents</td></tr>';
            return;
        }

        const selectedCase = currentCases.find(c => c._id === selectedId);
        renderDocuments(selectedCase.documents || []);
    });

    function renderDocuments(docs) {
        if (docs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">No documents found for this case.</td></tr>';
            return;
        }

        tbody.innerHTML = docs.map(d => `
            <tr>
                <td><strong>${d.fileName}</strong></td>
                <td><span class="task-badge">${d.fileType || 'Unknown'}</span></td>
                <td>${new Date(d.uploadDate || Date.now()).toLocaleDateString()}</td>
                <td>${d.uploadedBy || 'System'}</td>
                <td>${d.fileSize || '-'}</td>
                <td><a href="http://localhost:5001/${d.filePath.replace(/\\\\/g, '/')}" target="_blank" class="btn" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; margin: 0;">View</a></td>
            </tr>
        `).join('');
    }

    // Handle Upload
    uploadBtn.addEventListener('click', () => {
        if (!caseSelect.value) {
            showNotification('Please select a case first', 'error');
            return;
        }
        fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
        if (!e.target.files.length) return;
        
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('files', file);
        formData.append('category', 'Digital Vault Document');

        uploadBtn.textContent = 'Uploading...';
        uploadBtn.disabled = true;

        try {
            const res = await fetch(`http://localhost:5001/api/cases/${caseSelect.value}/documents`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            
            if (res.ok) {
                showNotification('Document uploaded successfully!');
                // Refresh case docs
                const updatedCaseRes = await fetch(`http://localhost:5001/api/cases/${caseSelect.value}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const updatedCase = await updatedCaseRes.json();
                
                // Update local array
                const idx = currentCases.findIndex(c => c._id === caseSelect.value);
                if (idx > -1) currentCases[idx] = updatedCase;
                
                renderDocuments(updatedCase.documents || []);
            } else {
                showNotification('Upload failed', 'error');
            }
        } catch (err) {
            showNotification('Network error', 'error');
        } finally {
            uploadBtn.textContent = 'Upload Document';
            uploadBtn.disabled = false;
            fileInput.value = '';
        }
    });
});
