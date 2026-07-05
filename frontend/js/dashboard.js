document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    let allCases = [];

    // Fetch and display dashboard stats and cases
    async function loadDashboard() {
        try {
            const res = await apiFetch('/cases');
            if (res.ok) {
                allCases = await res.json();
                updateStats(allCases);
                renderCases(allCases);
            }
        } catch (error) {
            showNotification('Failed to load dashboard data', 'error');
        }
    }

    function updateStats(cases) {
        const total = cases.length;
        const pending = cases.filter(c => c.status === 'Pending').length;
        const completed = cases.filter(c => c.status === 'Completed').length;

        document.getElementById('stat-total').textContent = total;
        document.getElementById('stat-pending').textContent = pending;
        document.getElementById('stat-completed').textContent = completed;
    }

    function renderCases(cases) {
        const tbody = document.getElementById('cases-table-body');
        tbody.innerHTML = '';

        if (cases.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No cases found.</td></tr>';
            return;
        }

        cases.forEach(c => {
            const date = new Date(c.incidentDate).toLocaleDateString();
            const badgeClass = c.status === 'Pending' ? 'badge-pending' : 'badge-completed';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${c.firNumber}</td>
                <td><a href="case-management.html?id=${c._id}" style="font-weight: 500;">${c.caseId}</a></td>
                <td>${c.sections}</td>
                <td>${date}</td>
                <td><span class="badge ${badgeClass}">${c.status}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Search and filter logic
    const searchInput = document.getElementById('search-input');
    const filterStatus = document.getElementById('filter-status');

    function applyFilters() {
        const query = searchInput.value.toLowerCase();
        const status = filterStatus.value;

        const filtered = allCases.filter(c => {
            const matchSearch = c.firNumber.toLowerCase().includes(query) || c.caseId.toLowerCase().includes(query);
            const matchStatus = status ? c.status === status : true;
            return matchSearch && matchStatus;
        });

        renderCases(filtered);
    }

    searchInput.addEventListener('input', applyFilters);
    filterStatus.addEventListener('change', applyFilters);

    loadDashboard();
});
