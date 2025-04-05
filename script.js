// Data and state management
let expenses = [];
let income = [];
let editingIndex = -1;
let editingType = '';
let expenseChart = null;
let incomeChart = null;
let currency = {
    symbol: '₹',
    code: 'INR',
    format: new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    })
};

// Currency formats
const currencyFormats = {
    INR: { symbol: '₹', format: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }) },
    USD: { symbol: '$', format: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }) },
    EUR: { symbol: '€', format: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }) },
};

// Filter state
let currentFilters = {
    type: 'all',
    category: 'all',
    month: null
};

// Initialize application
window.onload = function() {
    loadData();
    checkTheme();
    initializeFilters();
    renderAll();
    document.getElementById('currency').value = currency.code;
};

// Theme Functions
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    
    body.classList.toggle('dark-theme');
    
    if (body.classList.contains('dark-theme')) {
        themeToggle.textContent = '☀';
        localStorage.setItem('theme', 'dark');
    } else {
        themeToggle.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    }
    
    updateCharts();
}

function checkTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeToggle = document.getElementById('theme-toggle');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.textContent = '☀';
    } else {
        document.body.classList.remove('dark-theme');
        themeToggle.textContent = '🌙';
    }
}

// Local Storage Functions
function saveData() {
    const data = {
        expenses,
        income,
        currency: currency.code
    };
    localStorage.setItem('expenseTrackerData', JSON.stringify(data));
}

function loadData() {
    const data = JSON.parse(localStorage.getItem('expenseTrackerData'));
    if (data) {
        expenses = data.expenses || [];
        income = data.income || [];
        if (data.currency && currencyFormats[data.currency]) {
            currency = currencyFormats[data.currency];
        }
    }
}

// Currency Functions
function updateCurrency() {
    const currencySelect = document.getElementById('currency');
    const newCurrency = currencySelect.value;
    
    if (currencyFormats[newCurrency]) {
        currency = currencyFormats[newCurrency];
        saveData();
        renderAll();
    }
}

function formatCurrency(amount) {
    return currency.format.format(amount).replace(currency.symbol, '').trim();
}

// Tab Switching
function switchTab(tab) {
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.querySelector(`button[onclick="switchTab('${tab}')"]`).classList.add('active');
    document.getElementById(`${tab}-tab`).classList.add('active');
}

// Expense Functions
function addExpense() {
    const descInput = document.getElementById('desc');
    const amountInput = document.getElementById('amount');
    const categorySelect = document.getElementById('category');

    const desc = descInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;

    if (desc && !isNaN(amount) && amount > 0 && category) {
        if (editingIndex === -1 || editingType !== 'expense') {
            expenses.push({ desc, amount, category, date: new Date().toISOString() });
        } else {
            expenses[editingIndex] = { desc, amount, category, date: expenses[editingIndex].date };
            editingIndex = -1;
            editingType = '';
        }

        descInput.value = '';
        amountInput.value = '';
        categorySelect.value = 'Food';

        saveData();
        renderAll();
    }
}

function deleteExpense(index) {
    expenses.splice(index, 1);
    saveData();
    renderAll();
}

function editExpense(index) {
    const exp = expenses[index];
    document.getElementById('desc').value = exp.desc;
    document.getElementById('amount').value = exp.amount;
    document.getElementById('category').value = exp.category;
    editingIndex = index;
    editingType = 'expense';
    switchTab('expense');
}

// Income Functions
function addIncome() {
    const descInput = document.getElementById('incomeDesc');
    const amountInput = document.getElementById('incomeAmount');
    const categorySelect = document.getElementById('incomeCategory');

    const desc = descInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;

    if (desc && !isNaN(amount) && amount > 0 && category) {
        if (editingIndex === -1 || editingType !== 'income') {
            income.push({ desc, amount, category, date: new Date().toISOString() });
        } else {
            income[editingIndex] = { desc, amount, category, date: income[editingIndex].date };
            editingIndex = -1;
            editingType = '';
        }

        descInput.value = '';
        amountInput.value = '';
        categorySelect.value = 'Salary';

        saveData();
        renderAll();
    }
}

function deleteIncome(index) {
    income.splice(index, 1);
    saveData();
    renderAll();
}

function editIncome(index) {
    const inc = income[index];
    document.getElementById('incomeDesc').value = inc.desc;
    document.getElementById('incomeAmount').value = inc.amount;
    document.getElementById('incomeCategory').value = inc.category;
    editingIndex = index;
    editingType = 'income';
    switchTab('income');
}

// Filter Functions
function initializeFilters() {
    const categoryFilter = document.getElementById('filterCategory');
    const expenseCategories = ['Food', 'Travel', 'Entertainment', 'Housing', 'Utilities', 'Other'];
    const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];
    
    // Clear existing options except the first one
    while (categoryFilter.options.length > 1) {
        categoryFilter.remove(1);
    }
    
    // Add all unique categories
    const allCategories = [...new Set([...expenseCategories, ...incomeCategories])];
    allCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categoryFilter.appendChild(option);
    });
    
    // Set current month as default
    const now = new Date();
    document.getElementById('filterMonth').value = now.toISOString().slice(0, 7);
}

function applyFilters() {
    const filterType = document.getElementById('filterType').value;
    const filterCategory = document.getElementById('filterCategory').value;
    const filterMonth = document.getElementById('filterMonth').value;
    
    currentFilters = {
        type: filterType,
        category: filterCategory,
        month: filterMonth || null
    };
    
    renderAll();
}

function resetFilters() {
    document.getElementById('filterType').value = 'all';
    document.getElementById('filterCategory').value = 'all';
    document.getElementById('filterMonth').value = new Date().toISOString().slice(0, 7);
    
    currentFilters = {
        type: 'all',
        category: 'all',
        month: null
    };
    
    renderAll();
}

function filterTransactions(list, type) {
    return list.filter(item => {
        // Filter by type
        if (currentFilters.type !== 'all' && currentFilters.type !== type) {
            return false;
        }
        
        // Filter by category
        if (currentFilters.category !== 'all' && item.category !== currentFilters.category) {
            return false;
        }
        
        // Filter by month
        if (currentFilters.month) {
            const itemMonth = new Date(item.date).toISOString().slice(0, 7);
            if (itemMonth !== currentFilters.month) {
                return false;
            }
        }
        
        return true;
    });
}

// Rendering Functions
function renderAll() {
    renderExpenseList();
    renderIncomeList();
    updateStats();
    updateCharts();
}

function renderExpenseList() {
    const list = document.getElementById('expenseList');
    list.innerHTML = '';
    
    const filteredExpenses = filterTransactions(expenses, 'expense');
    
    if (filteredExpenses.length === 0) {
        list.innerHTML = '<li class="no-items">No expenses match the current filters</li>';
        return;
    }
    
    filteredExpenses.forEach((exp, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div>
                <strong>${exp.desc}</strong><br>
                <small>${new Date(exp.date).toLocaleDateString()} • ${exp.category}</small>
            </div>
            <div>
                <span>${currency.symbol}${formatCurrency(exp.amount)}</span>
                <span>
                    <button onclick="editExpense(${index})">Edit</button>
                    <button onclick="deleteExpense(${index})">X</button>
                </span>
            </div>
        `;
        list.appendChild(li);
    });
}

function renderIncomeList() {
    const list = document.getElementById('incomeList');
    list.innerHTML = '';
    
    const filteredIncome = filterTransactions(income, 'income');
    
    if (filteredIncome.length === 0) {
        list.innerHTML = '<li class="no-items">No income matches the current filters</li>';
        return;
    }
    
    filteredIncome.forEach((inc, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div>
                <strong>${inc.desc}</strong><br>
                <small>${new Date(inc.date).toLocaleDateString()} • ${inc.category}</small>
            </div>
            <div>
                <span>${currency.symbol}${formatCurrency(inc.amount)}</span>
                <span>
                    <button onclick="editIncome(${index})">Edit</button>
                    <button onclick="deleteIncome(${index})">X</button>
                </span>
            </div>
        `;
        list.appendChild(li);
    });
}

function updateStats() {
    const filteredExpenses = filterTransactions(expenses, 'expense');
    const filteredIncome = filterTransactions(income, 'income');
    
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalIncome = filteredIncome.reduce((sum, inc) => sum + inc.amount, 0);
    const balance = totalIncome - totalExpenses;

    document.getElementById('totalExpenses').textContent = 
        `${currency.symbol}${formatCurrency(totalExpenses)}`;
    document.getElementById('totalIncome').textContent = 
        `${currency.symbol}${formatCurrency(totalIncome)}`;
    document.getElementById('balance').textContent = 
        `${currency.symbol}${formatCurrency(balance)}`;
    
    // Color balance based on value
    const balanceElement = document.getElementById('balance');
    balanceElement.style.color = balance >= 0 ? '#27ae60' : '#e74c3c';
}

function updateCharts() {
    updateExpenseChart();
    updateIncomeChart();
}

function updateExpenseChart() {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    const categorySums = {};
    const isDarkTheme = document.body.classList.contains('dark-theme');

    // Initialize all expense categories with 0
    const expenseCategories = ['Food', 'Travel', 'Entertainment', 'Housing', 'Utilities', 'Other'];
    expenseCategories.forEach(cat => categorySums[cat] = 0);

    // Sum amounts by category for filtered expenses
    const filteredExpenses = filterTransactions(expenses, 'expense');
    filteredExpenses.forEach(exp => {
        categorySums[exp.category] += exp.amount;
    });

    // Prepare data for chart
    const labels = [];
    const data = [];
    const backgroundColors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
        '#9966FF', '#FF9F40', '#8E44AD', '#2ECC71'
    ];

    expenseCategories.forEach((cat, index) => {
        if (categorySums[cat] > 0) {
            labels.push(cat);
            data.push(categorySums[cat]);
        }
    });

    // Update or create chart
    if (expenseChart) {
        expenseChart.data.labels = labels;
        expenseChart.data.datasets[0].data = data;
        expenseChart.data.datasets[0].backgroundColor = backgroundColors.slice(0, labels.length);
        expenseChart.options.plugins.title.color = isDarkTheme ? '#fff' : '#666';
        expenseChart.options.plugins.legend.labels.color = isDarkTheme ? '#fff' : '#666';
        expenseChart.update();
    } else {
        expenseChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors.slice(0, labels.length),
                    borderColor: isDarkTheme ? '#333' : '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Expenses by Category',
                        font: { size: 16 },
                        color: isDarkTheme ? '#fff' : '#666'
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: isDarkTheme ? '#fff' : '#666'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percent = Math.round((value / total) * 100);
                                return `${label}: ${currency.symbol}${formatCurrency(value)} (${percent}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
}

function updateIncomeChart() {
    const ctx = document.getElementById('incomeChart').getContext('2d');
    const categorySums = {};
    const isDarkTheme = document.body.classList.contains('dark-theme');

    // Initialize all income categories with 0
    const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];
    incomeCategories.forEach(cat => categorySums[cat] = 0);

    // Sum amounts by category for filtered income
    const filteredIncome = filterTransactions(income, 'income');
    filteredIncome.forEach(inc => {
        categorySums[inc.category] += inc.amount;
    });

    // Prepare data for chart
    const labels = [];
    const data = [];
    const backgroundColors = [
        '#2ECC71', '#3498DB', '#9B59B6', '#F1C40F', 
        '#E67E22', '#E74C3C', '#1ABC9C', '#34495E'
    ];

    incomeCategories.forEach((cat, index) => {
        if (categorySums[cat] > 0) {
            labels.push(cat);
            data.push(categorySums[cat]);
        }
    });

    // Update or create chart
    if (incomeChart) {
        incomeChart.data.labels = labels;
        incomeChart.data.datasets[0].data = data;
        incomeChart.data.datasets[0].backgroundColor = backgroundColors.slice(0, labels.length);
        incomeChart.options.plugins.title.color = isDarkTheme ? '#fff' : '#666';
        incomeChart.options.plugins.legend.labels.color = isDarkTheme ? '#fff' : '#666';
        incomeChart.update();
    } else {
        incomeChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors.slice(0, labels.length),
                    borderColor: isDarkTheme ? '#333' : '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Income by Source',
                        font: { size: 16 },
                        color: isDarkTheme ? '#fff' : '#666'
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: isDarkTheme ? '#fff' : '#666'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percent = Math.round((value / total) * 100);
                                return `${label}: ${currency.symbol}${formatCurrency(value)} (${percent}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
}

// Export Functions
function exportData(format) {
    let dataToExport;
    const now = new Date();
    const filename = `expense-tracker-${now.toISOString().slice(0, 10)}`;
    
    // Prepare data based on current filters
    const filteredExpenses = filterTransactions(expenses, 'expense');
    const filteredIncome = filterTransactions(income, 'income');
    
    switch (format) {
        case 'csv':
            dataToExport = convertToCSV(filteredExpenses, filteredIncome);
            downloadFile(dataToExport, `${filename}.csv`, 'text/csv');
            break;
            
        case 'json':
            dataToExport = {
                expenses: filteredExpenses,
                income: filteredIncome,
                currency: currency.code,
                exportedAt: new Date().toISOString()
            };
            downloadFile(JSON.stringify(dataToExport, null, 2), `${filename}.json`, 'application/json');
            break;
            
        case 'text':
            dataToExport = convertToText(filteredExpenses, filteredIncome);
            downloadFile(dataToExport, `${filename}.txt`, 'text/plain');
            break;
    }
}

function convertToCSV(expenses, income) {
    let csv = 'Type,Description,Amount,Category,Date\n';
    
    expenses.forEach(exp => {
        csv += `Expense,${exp.desc},${exp.amount},${exp.category},${exp.date}\n`;
    });
    
    income.forEach(inc => {
        csv += `Income,${inc.desc},${inc.amount},${inc.category},${inc.date}\n`;
    });
    
    return csv;
}

function convertToText(expenses, income) {
    let text = 'EXPENSE TRACKER DATA EXPORT\n\n';
    text += `Generated on: ${new Date().toLocaleString()}\n`;
    text += `Currency: ${currency.code}\n\n`;
    
    text += '=== EXPENSES ===\n';
    expenses.forEach(exp => {
        text += `- ${exp.desc}: ${currency.symbol}${exp.amount} (${exp.category}, ${new Date(exp.date).toLocaleDateString()})\n`;
    });
    
    text += '\n=== INCOME ===\n';
    income.forEach(inc => {
        text += `- ${inc.desc}: ${currency.symbol}${inc.amount} (${inc.category}, ${new Date(inc.date).toLocaleDateString()})\n`;
    });
    
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);
    const balance = totalIncome - totalExpenses;
    
    text += '\n=== SUMMARY ===\n';
    text += `Total Expenses: ${currency.symbol}${totalExpenses}\n`;
    text += `Total Income: ${currency.symbol}${totalIncome}\n`;
    text += `Balance: ${currency.symbol}${balance}\n`;
    
    return text;
}

function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}