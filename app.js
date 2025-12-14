let expenses = [];
let previewData = [];
let currentFile = null;
let pieChart = null;
let lineChart = null;

const categoryPatterns = {
    'Food': ['restaurant', 'cafe', 'coffee', 'pizza', 'food', 'grocery', 'swiggy', 'zomato', 'dining', 'lunch', 'dinner', 'breakfast', 'snack', 'meal'],
    'Transport': ['uber', 'ola', 'taxi', 'gas', 'fuel', 'petrol', 'metro', 'bus', 'train', 'auto', 'cab', 'parking'],
    'Shopping': ['amazon', 'flipkart', 'myntra', 'store', 'shop', 'mall', 'clothing', 'purchase'],
    'Entertainment': ['netflix', 'spotify', 'movie', 'game', 'hotstar', 'prime', 'theatre', 'concert'],
    'Utilities': ['electric', 'water', 'internet', 'phone', 'mobile', 'recharge', 'bill', 'gas bill'],
    'Healthcare': ['pharmacy', 'doctor', 'hospital', 'medical', 'medicine', 'apollo', 'clinic'],
    'Other': []
};

const categoryColors = {
    'Food': '#3b82f6',
    'Transport': '#10b981',
    'Shopping': '#f59e0b',
    'Entertainment': '#ec4899',
    'Utilities': '#06b6d4',
    'Healthcare': '#8b5cf6',
    'Other': '#64748b'
};

const fileInput = document.getElementById('file-input');
const dropzone = document.getElementById('dropzone');
const filePreview = document.getElementById('file-preview');
const previewBody = document.getElementById('preview-body');
const fileName = document.getElementById('file-name');
const fileMeta = document.getElementById('file-meta');
const processBtn = document.getElementById('process-btn');
const clearFileBtn = document.getElementById('clear-file');
const clearBtn = document.getElementById('clear-btn');
const newBtn = document.getElementById('new-btn');
const uploadSection = document.getElementById('upload-section');
const resultsSection = document.getElementById('results-section');

fileInput.addEventListener('change', handleFileSelect);
dropzone.addEventListener('dragenter', handleDragEnter);
dropzone.addEventListener('dragleave', handleDragLeave);
dropzone.addEventListener('dragover', handleDragOver);
dropzone.addEventListener('drop', handleDrop);
processBtn.addEventListener('click', processFile);
clearFileBtn.addEventListener('click', clearFile);
clearBtn.addEventListener('click', clearFile);
newBtn.addEventListener('click', resetApp);

function handleDragEnter(e) {
    e.preventDefault();
    dropzone.classList.add('dragging');
}

function handleDragLeave(e) {
    e.preventDefault();
    dropzone.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    dropzone.classList.remove('dragging');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) handleFile(file);
}

function handleFile(file) {
    if (!file.name.endsWith('.csv')) {
        alert('Please upload a CSV file');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        const parsed = parseCSV(content);
        
        if (parsed.length === 0) {
            alert('Could not parse CSV. Make sure it has date, description, and amount columns.');
            return;
        }

        currentFile = file;
        previewData = parsed;
        showPreview();
    };
    reader.readAsText(file);
}

function parseCSV(content) {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];

    const result = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
        if (cols.length >= 3) {
            const amount = Math.abs(parseFloat(cols[2].replace(/[₹$,]/g, '')));
            if (!isNaN(amount) && amount > 0) {
                result.push({
                    date: cols[0],
                    description: cols[1],
                    amount: amount,
                    category: categorize(cols[1])
                });
            }
        }
    }
    return result;
}

function categorize(description) {
    const lower = description.toLowerCase();
    for (const [category, keywords] of Object.entries(categoryPatterns)) {
        if (category === 'Other') continue;
        for (const keyword of keywords) {
            if (lower.includes(keyword)) return category;
        }
    }
    return 'Other';
}

function formatRupees(amount) {
    return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function showPreview() {
    dropzone.style.display = 'none';
    filePreview.style.display = 'block';
    
    fileName.textContent = currentFile.name;
    fileMeta.textContent = `${previewData.length} rows • ${(currentFile.size / 1024).toFixed(1)} KB`;
    
    const preview = previewData.slice(0, 5);
    previewBody.innerHTML = preview.map(row => `
        <tr>
            <td style="font-family: 'JetBrains Mono', monospace; font-size: 0.8rem;">${row.date}</td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${row.description}</td>
            <td class="text-right">${formatRupees(row.amount)}</td>
        </tr>
    `).join('');
}

function clearFile() {
    currentFile = null;
    previewData = [];
    fileInput.value = '';
    dropzone.style.display = 'block';
    filePreview.style.display = 'none';
}

function processFile() {
    expenses = previewData;
    showResults();
}

function showResults() {
    uploadSection.style.display = 'none';
    resultsSection.style.display = 'block';
    newBtn.style.display = 'flex';

    updateSummary();
    updateCharts();
    updateInsights();
    updateTable();
    updateCategoryTable();
}

function updateSummary() {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const avg = total / expenses.length;
    
    const categoryTotals = {};
    expenses.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });
    
    const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const topCategory = sorted[0];
    const topPercent = topCategory ? ((topCategory[1] / total) * 100).toFixed(0) : 0;

    document.getElementById('total-spent').textContent = formatRupees(total);
    document.getElementById('transaction-count').textContent = expenses.length.toLocaleString();
    document.getElementById('average-spent').textContent = formatRupees(avg);
    document.getElementById('top-category').textContent = topCategory ? topCategory[0] : '-';
    document.getElementById('top-percent').textContent = topCategory ? `${topPercent}%` : 'No data';
}

function updateCharts() {
    const categoryTotals = {};
    expenses.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const categories = Object.keys(categoryTotals);
    const amounts = Object.values(categoryTotals);
    const colors = categories.map(c => categoryColors[c] || '#64748b');

    if (pieChart) pieChart.destroy();
    pieChart = new Chart(document.getElementById('pie-chart'), {
    type: 'doughnut',
    data: {
        labels: categories,
        datasets: [{
            data: amounts,
            backgroundColor: colors,
            borderWidth: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#ffffff', 
                    padding: 16,
                    usePointStyle: true,
                    font: { family: 'Inter', size: 12 }
                }
            }
        }
    }
    });

    const dailyTotals = {};
    expenses.forEach(e => {
        dailyTotals[e.date] = (dailyTotals[e.date] || 0) + e.amount;
    });

    const dates = Object.keys(dailyTotals).sort();
    const dailyAmounts = dates.map(d => dailyTotals[d]);

    if (lineChart) lineChart.destroy();
    lineChart = new Chart(document.getElementById('line-chart'), {
    type: 'line',
    data: {
        labels: dates,
        datasets: [{
            label: 'Spending',
            data: dailyAmounts,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#3b82f6'
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: '#f1f5f9' },
                ticks: {
                    color: '#ffffff', // Add this for white text
                    font: { family: 'Inter', size: 11 },
                    callback: value => '₹' + value.toLocaleString('en-IN')
                }
            },
            x: {
                grid: { display: false },
                ticks: { 
                    color: '#ffffff', // Add this for white text
                    font: { family: 'Inter', size: 11 } 
                }
            }
        }
    }
});
}

function updateInsights() {
    const insights = [];
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const avg = total / expenses.length;

    const categoryTotals = {};
    expenses.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    
    if (sorted.length > 0) {
        const [topCat, topAmt] = sorted[0];
        const percent = ((topAmt / total) * 100).toFixed(0);
        insights.push({
            type: 'info',
            title: `Most spent on ${topCat}`,
            desc: `You spent ${formatRupees(topAmt)} here - that's ${percent}% of your total!`
        });
    }


    if (categoryTotals['Food']) {
        const foodPercent = ((categoryTotals['Food'] / total) * 100).toFixed(0);
        if (foodPercent > 30) {
            insights.push({
                type: 'warning',
                title: 'High food spending',
                desc: `${foodPercent}% goes to food. Maybe try cooking more?`
            });
        }
    }

    if (categoryTotals['Entertainment']) {
        const entPercent = ((categoryTotals['Entertainment'] / total) * 100).toFixed(0);
        if (entPercent < 15) {
            insights.push({
                type: 'success',
                title: 'Entertainment spending in check',
                desc: `Only ${entPercent}% on entertainment - good balance!`
            });
        }
    }

    document.getElementById('insights-list').innerHTML = insights.map(i => `
        <div class="insight-item ${i.type}">
            <div class="insight-title">${i.title}</div>
            <div class="insight-desc">${i.desc}</div>
        </div>
    `).join('');
}

function updateTable() {
    document.getElementById('table-body').innerHTML = expenses.slice(0, 15).map(e => `
        <tr>
            <td style="font-family: 'JetBrains Mono', monospace; font-size: 0.8rem;">${e.date}</td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${e.description}</td>
            <td><span class="category-badge">${e.category}</span></td>
            <td class="text-right amount">${formatRupees(e.amount)}</td>
        </tr>
    `).join('');
}

function updateCategoryTable() {
    const categoryTotals = {};
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Calculate totals per category
    expenses.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    // Convert to table rows
    const rows = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1]) // Sort highest first
        .map(([category, amount]) => {
            const percent = ((amount / total) * 100).toFixed(1);
            return `
                <tr>
                    <td>${category}</td>
                    <td class="text-right">₹${amount.toLocaleString("en-IN")}</td>
                    <td class="text-right">${percent}%</td>
                </tr>
            `;
        })
        .join('');

    document.getElementById("category-body").innerHTML = rows;
}


function resetApp() {
    expenses = [];
    previewData = [];
    currentFile = null;
    fileInput.value = '';
    dropzone.style.display = 'block';
    filePreview.style.display = 'none';
    resultsSection.style.display = 'none';
    uploadSection.style.display = 'block';
    newBtn.style.display = 'none';
}