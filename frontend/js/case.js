document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    
    const urlParams = new URLSearchParams(window.location.search);
    const caseId = urlParams.get('id');
    const isEditMode = !!caseId;

    const form = document.getElementById('case-form');
    const pageTitle = document.getElementById('page-title');
    const statusGroup = document.getElementById('status-group');

    if (isEditMode) {
        pageTitle.textContent = 'Update Case';
        statusGroup.style.display = 'block';
        await loadCaseData(caseId);
    }

    async function loadCaseData(id) {
        try {
            const res = await apiFetch(`/cases/${id}`);
            if (res.ok) {
                const caseData = await res.json();
                
                document.getElementById('firNumber').value = caseData.firNumber;
                document.getElementById('caseId').value = caseData.caseId;
                document.getElementById('sections').value = caseData.sections;
                
                // Format date for input type="date"
                const dateObj = new Date(caseData.incidentDate);
                document.getElementById('incidentDate').value = dateObj.toISOString().split('T')[0];
                
                document.getElementById('victimDetails').value = caseData.victimDetails;
                document.getElementById('accusedDetails').value = caseData.accusedDetails;
                document.getElementById('investigationNotes').value = caseData.investigationNotes || '';
                
                if (document.getElementById('status')) {
                    document.getElementById('status').value = caseData.status;
                }

                // Render existing docs
                if (caseData.documents && caseData.documents.length > 0) {
                    const docsList = document.getElementById('existing-documents');
                    docsList.innerHTML = '<strong>Attached Documents:</strong><br/>';
                    caseData.documents.forEach(doc => {
                        const item = document.createElement('div');
                        item.className = 'document-item';
                        item.innerHTML = `
                            📄 <a href="/${doc.filePath}" target="_blank">${doc.fileName}</a>
                        `;
                        docsList.appendChild(item);
                    });
                }
            } else {
                showNotification('Failed to load case data', 'error');
            }
        } catch (error) {
            showNotification('Error loading case', 'error');
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('firNumber', document.getElementById('firNumber').value);
        formData.append('caseId', document.getElementById('caseId').value);
        formData.append('sections', document.getElementById('sections').value);
        formData.append('incidentDate', document.getElementById('incidentDate').value);
        formData.append('victimDetails', document.getElementById('victimDetails').value);
        formData.append('accusedDetails', document.getElementById('accusedDetails').value);
        formData.append('investigationNotes', document.getElementById('investigationNotes').value);
        
        if (isEditMode) {
            formData.append('status', document.getElementById('status').value);
        }

        const fileInput = document.getElementById('documents');
        for (let i = 0; i < fileInput.files.length; i++) {
            formData.append('documents', fileInput.files[i]);
        }

        try {
            const url = isEditMode ? `/cases/${caseId}` : '/cases';
            const method = isEditMode ? 'PUT' : 'POST';

            const res = await apiFetch(url, {
                method: method,
                body: formData // FormData sets its own content-type headers
            });

            if (res.ok) {
                showNotification(isEditMode ? 'Case updated successfully' : 'Case created successfully');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                const data = await res.json();
                showNotification(data.message || 'Error saving case', 'error');
            }
        } catch (error) {
            showNotification('Network error', 'error');
        }
    });
});
