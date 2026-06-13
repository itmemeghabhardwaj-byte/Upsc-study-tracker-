// ==================== Local Storage Manager ====================
class StorageManager {
    constructor() {
        this.PREFIX = 'upsc_tracker_';
    }

    save(key, data) {
        localStorage.setItem(this.PREFIX + key, JSON.stringify(data));
    }

    load(key, defaultValue = null) {
        const data = localStorage.getItem(this.PREFIX + key);
        return data ? JSON.parse(data) : defaultValue;
    }

    remove(key) {
        localStorage.removeItem(this.PREFIX + key);
    }

    clear() {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    }
}

const storage = new StorageManager();

// ==================== Theme Manager ====================
class ThemeManager {
    constructor() {
        this.loadTheme();
        document.getElementById('themeToggle').addEventListener('click', () => this.toggle());
    }

    loadTheme() {
        const isDark = storage.load('darkMode', false);
        if (isDark) {
            document.body.classList.add('dark-mode');
            document.getElementById('themeToggle').textContent = '☀️ Light Mode';
        }
    }

    toggle() {
        const isDark = document.body.classList.toggle('dark-mode');
        storage.save('darkMode', isDark);
        document.getElementById('themeToggle').textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    }
}

// ==================== Tab Navigation ====================
class TabManager {
    constructor() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

        document.getElementById(tabName).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        if (tabName === 'dashboard') {
            setTimeout(() => {
                updateDashboard();
                updateCharts();
            }, 100);
        }
    }
}

// ==================== Data Manager ====================
class DataManager {
    constructor() {
        this.initializeData();
    }

    initializeData() {
        if (!storage.load('studyData')) storage.save('studyData', []);
        if (!storage.load('testScores')) storage.save('testScores', []);
        if (!storage.load('revisionSchedule')) storage.save('revisionSchedule', []);
        if (!storage.load('gsProgress')) {
            storage.save('gsProgress', {
                'GS-I': { title: 'History & Culture', progress: 0 },
                'GS-II': { title: 'Polity & Governance', progress: 0 },
                'GS-III': { title: 'Economy & Tech', progress: 0 },
                'GS-IV': { title: 'Ethics', progress: 0 }
            });
        }
        if (!storage.load('targetHours')) storage.save('targetHours', 8);
        if (!storage.load('todayTargets')) storage.save('todayTargets', []);
        if (!storage.load('optionalSubject')) storage.save('optionalSubject', '');
        if (!storage.load('optionalProgress')) storage.save('optionalProgress', { title: '', progress: 0 });
    }

    addStudyEntry(date, subject, hours, notes) {
        const data = storage.load('studyData', []);
        data.push({id: Date.now(), date, subject, hours: parseFloat(hours), notes, timestamp: new Date().toISOString()});
        storage.save('studyData', data);
        return data;
    }

    getStudyData() { return storage.load('studyData', []); }
    deleteStudyEntry(id) { let data = storage.load('studyData', []); data = data.filter(e => e.id !== id); storage.save('studyData', data); return data; }

    addTestScore(name, date, score, percentile) {
        const tests = storage.load('testScores', []);
        tests.push({id: Date.now(), name, date, score: parseInt(score), percentile: parseFloat(percentile), timestamp: new Date().toISOString()});
        storage.save('testScores', tests);
        return tests;
    }

    getTestScores() { return storage.load('testScores', []); }

    addRevisionTopic(topic, daysUntilRevision) {
        const revisions = storage.load('revisionSchedule', []);
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + parseInt(daysUntilRevision));
        revisions.push({id: Date.now(), topic, daysUntilRevision: parseInt(daysUntilRevision), nextRevisionDate: nextDate.toISOString().split('T')[0], status: 'pending', createdDate: new Date().toISOString().split('T')[0]});
        storage.save('revisionSchedule', revisions);
        return revisions;
    }

    getRevisionSchedule() { return storage.load('revisionSchedule', []); }
    updateRevisionStatus(id, status) { let revisions = storage.load('revisionSchedule', []); revisions = revisions.map(r => r.id === id ? {...r, status} : r); storage.save('revisionSchedule', revisions); return revisions; }
    deleteRevision(id) { let revisions = storage.load('revisionSchedule', []); revisions = revisions.filter(r => r.id !== id); storage.save('revisionSchedule', revisions); return revisions; }

    updateGSProgress(subject, progress) { let gsData = storage.load('gsProgress', {}); if (gsData[subject]) { gsData[subject].progress = Math.min(100, Math.max(0, parseFloat(progress))); storage.save('gsProgress', gsData); } return gsData; }
    getGSProgress() { return storage.load('gsProgress', {}); }

    setTargetHours(hours) { storage.save('targetHours', parseInt(hours)); }
    getTargetHours() { return storage.load('targetHours', 8); }

    addTodayTarget(target) { const targets = storage.load('todayTargets', []); targets.push({id: Date.now(), target, completed: false, addedDate: new Date().toISOString().split('T')[0]}); storage.save('todayTargets', targets); return targets; }
    getTodayTargets() { return storage.load('todayTargets', []); }
    deleteTodayTarget(id) { let targets = storage.load('todayTargets', []); targets = targets.filter(t => t.id !== id); storage.save('todayTargets', targets); return targets; }

    setOptionalSubject(subject) { storage.save('optionalSubject', subject); if (subject) storage.save('optionalProgress', {title: subject, progress: 0}); }
    getOptionalSubject() { return storage.load('optionalSubject', ''); }
    getOptionalProgress() { return storage.load('optionalProgress', {title: '', progress: 0}); }
    updateOptionalProgress(progress) { let optional = storage.load('optionalProgress', {title: '', progress: 0}); optional.progress = Math.min(100, Math.max(0, parseFloat(progress))); storage.save('optionalProgress', optional); return optional; }
}

const dataManager = new DataManager();

// ==================== UI Renderers ====================

document.getElementById('setTargetBtn').addEventListener('click', () => {
    const hours = document.getElementById('targetHours').value;
    if (hours && hours > 0) {
        dataManager.setTargetHours(hours);
        renderTargetDisplay();
        showNotification('Target set successfully!', 'success');
    } else {
        showNotification('Please enter valid hours', 'error');
    }
});

function renderTargetDisplay() {
    const hours = dataManager.getTargetHours();
    const display = document.getElementById('targetDisplay');
    display.innerHTML = `<h4>Daily Target: <strong>${hours} hours</strong></h4><p>Set a daily study goal to keep yourself motivated!</p>`;
}

document.getElementById('addTargetBtn').addEventListener('click', () => {
    const target = document.getElementById('todayTarget').value.trim();
    if (target) {
        dataManager.addTodayTarget(target);
        document.getElementById('todayTarget').value = '';
        renderTodayTargetsList();
        showNotification('Target added!', 'success');
    } else {
        showNotification('Please enter a target', 'error');
    }
});

function renderTodayTargetsList() {
    const targets = dataManager.getTodayTargets();
    const list = document.getElementById('todayTargetsList');
    if (targets.length === 0) {
        list.innerHTML = '<li style="text-align: center; color: var(--text-color); opacity: 0.7;">No targets added yet</li>';
        return;
    }
    list.innerHTML = targets.map(t => `<li><span>${t.target}</span><button class="btn-danger" onclick="deleteTodayTarget(${t.id})">Remove</button></li>`).join('');
}

function deleteTodayTarget(id) { dataManager.deleteTodayTarget(id); renderTodayTargetsList(); showNotification('Target removed', 'success'); }

document.getElementById('logHoursBtn').addEventListener('click', () => {
    const date = document.getElementById('studyDate').value;
    const subject = document.getElementById('studySubject').value;
    const hours = document.getElementById('studyHours').value;
    const notes = document.getElementById('studyNotes').value;
    if (date && subject && hours) {
        dataManager.addStudyEntry(date, subject, hours, notes);
        document.getElementById('studyDate').value = '';
        document.getElementById('studyHours').value = '';
        document.getElementById('studyNotes').value = '';
        renderStudyHistory();
        updateDashboard();
        showNotification('Study hours logged successfully!', 'success');
    } else {
        showNotification('Please fill all required fields', 'error');
    }
});

function renderStudyHistory() {
    const studyData = dataManager.getStudyData();
    const container = document.getElementById('studyHistory');
    if (studyData.length === 0) {
        container.innerHTML = '<p style="text-align: center; opacity: 0.7;">No study entries yet</p>';
        return;
    }
    const sorted = studyData.sort((a, b) => new Date(b.date) - new Date(a.date));
    container.innerHTML = sorted.map(entry => `<div class="study-entry"><div class="study-entry-header"><div><span class="study-entry-subject">${entry.subject}</span><div class="study-entry-date">${new Date(entry.date).toLocaleDateString()}</div></div><div><span class="study-entry-hours">${entry.hours}h</span><button class="btn-danger" onclick="deleteStudyEntry(${entry.id})" style="margin-left: 0.5rem;">Delete</button></div></div>${entry.notes ? `<p style="margin-top: 0.5rem; opacity: 0.8; font-size: 0.9rem;">${entry.notes}</p>` : ''}</div>`).join('');
}

function deleteStudyEntry(id) { dataManager.deleteStudyEntry(id); renderStudyHistory(); updateDashboard(); showNotification('Entry deleted', 'success'); }

function renderGSProgress() {
    const gsData = dataManager.getGSProgress();
    const container = document.getElementById('gsProgressContainer');
    container.innerHTML = Object.entries(gsData).map(([key, subject]) => `<div class="progress-item"><h4>${subject.title}</h4><div class="progress-bar"><div class="progress-fill" style="width: ${subject.progress}%"></div></div><div style="display: flex; gap: 0.5rem; align-items: center;"><input type="range" min="0" max="100" value="${subject.progress}" class="progress-input" onchange="updateGSProgress('${key}', this.value)"><span style="min-width: 45px; text-align: right; font-weight: 600;">${subject.progress}%</span></div></div>`).join('');
}

function updateGSProgress(subject, progress) { dataManager.updateGSProgress(subject, progress); renderGSProgress(); updateDashboard(); showNotification('GS progress updated!', 'success'); }

document.getElementById('setOptionalBtn').addEventListener('click', () => {
    const subject = document.getElementById('optionalSubject').value;
    if (subject) {
        dataManager.setOptionalSubject(subject);
        renderOptionalProgress();
        showNotification('Optional subject set!', 'success');
    } else {
        showNotification('Please select a subject', 'error');
    }
});

function renderOptionalProgress() {
    const optional = dataManager.getOptionalProgress();
    const display = document.getElementById('optionalDisplay');
    const container = document.getElementById('optionalProgressContainer');
    if (optional.title) {
        display.innerHTML = `<h4>Selected: <strong>${optional.title}</strong></h4>`;
        container.innerHTML = `<div class="progress-item"><h4>${optional.title}</h4><div class="progress-bar"><div class="progress-fill" style="width: ${optional.progress}%"></div></div><div style="display: flex; gap: 0.5rem; align-items: center;"><input type="range" min="0" max="100" value="${optional.progress}" class="progress-input" onchange="updateOptionalProgress(this.value)"><span style="min-width: 45px; text-align: right; font-weight: 600;">${optional.progress}%</span></div></div>`;
    } else {
        display.innerHTML = '';
        container.innerHTML = '<p style="text-align: center; opacity: 0.7;">No optional subject selected</p>';
    }
}

function updateOptionalProgress(progress) { dataManager.updateOptionalProgress(progress); renderOptionalProgress(); updateDashboard(); showNotification('Optional progress updated!', 'success'); }

document.getElementById('addRevisionBtn').addEventListener('click', () => {
    const topic = document.getElementById('revisionTopic').value.trim();
    const schedule = document.getElementById('revisionSchedule').value;
    if (topic && schedule) {
        dataManager.addRevisionTopic(topic, schedule);
        document.getElementById('revisionTopic').value = '';
        document.getElementById('revisionSchedule').value = '';
        renderRevisionList();
        showNotification('Topic added to revision schedule!', 'success');
    } else {
        showNotification('Please fill all fields', 'error');
    }
});

function renderRevisionList() {
    const revisions = dataManager.getRevisionSchedule();
    const container = document.getElementById('revisionList');
    if (revisions.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; opacity: 0.7;">No revision topics added</p>';
        return;
    }
    container.innerHTML = revisions.map(rev => `<div class="revision-item"><div class="revision-item-info"><h4>${rev.topic}</h4><div class="revision-item-date">Next: ${new Date(rev.nextRevisionDate).toLocaleDateString()}</div><div class="revision-item-date">Added: ${rev.createdDate}</div></div><div style="display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-end;"><span class="revision-status ${rev.status}">${rev.status.toUpperCase()}</span><button class="btn-secondary" onclick="toggleRevisionStatus(${rev.id}, '${rev.status}')">${rev.status === 'pending' ? 'Mark Done' : 'Reset'}</button><button class="btn-danger" onclick="deleteRevision(${rev.id})">Delete</button></div></div>`).join('');
}

function toggleRevisionStatus(id, currentStatus) { const newStatus = currentStatus === 'pending' ? 'completed' : 'pending'; dataManager.updateRevisionStatus(id, newStatus); renderRevisionList(); showNotification(`Revision marked as ${newStatus}!`, 'success'); }
function deleteRevision(id) { dataManager.deleteRevision(id); renderRevisionList(); showNotification('Revision deleted', 'success'); }

document.getElementById('addTestBtn').addEventListener('click', () => {
    const name = document.getElementById('testName').value.trim();
    const date = document.getElementById('testDate').value;
    const score = document.getElementById('testScore').value;
    const percentile = document.getElementById('testPercentile').value;
    if (name && date && score && percentile) {
        dataManager.addTestScore(name, date, score, percentile);
        document.getElementById('testName').value = '';
        document.getElementById('testDate').value = '';
        document.getElementById('testScore').value = '';
        document.getElementById('testPercentile').value = '';
        renderTestRecords();
        updateCharts();
        showNotification('Test score added!', 'success');
    } else {
        showNotification('Please fill all fields', 'error');
    }
});

function renderTestRecords() {
    const tests = dataManager.getTestScores();
    const container = document.getElementById('testRecords');
    if (tests.length === 0) {
        container.innerHTML = '<p style="text-align: center; opacity: 0.7;">No test records yet</p>';
        return;
    }
    const sorted = tests.sort((a, b) => new Date(b.date) - new Date(a.date));
    const html = `<table class="test-table"><thead><tr><th>Test Name</th><th>Date</th><th>Score</th><th>Percentile</th></tr></thead><tbody>${sorted.map(test => `<tr><td>${test.name}</td><td>${new Date(test.date).toLocaleDateString()}</td><td><strong>${test.score}/1000</strong></td><td>${test.percentile}%</td></tr>`).join('')}</tbody></table>`;
    container.innerHTML = html;
}

function updateDashboard() {
    const studyData = dataManager.getStudyData();
    const today = new Date().toISOString().split('T')[0];
    const todayHours = studyData.filter(e => e.date === today).reduce((sum, e) => sum + e.hours, 0);
    document.getElementById('todayHours').textContent = todayHours.toFixed(1);
    const uniqueDays = new Set(studyData.map(e => e.date));
    document.getElementById('totalDays').textContent = uniqueDays.size;
    const avgHours = studyData.length > 0 ? (studyData.reduce((sum, e) => sum + e.hours, 0) / uniqueDays.size).toFixed(1) : 0;
    document.getElementById('avgHours').textContent = avgHours;
    const gsData = dataManager.getGSProgress();
    const gsAvg = Object.values(gsData).length > 0 ? (Object.values(gsData).reduce((sum, s) => sum + s.progress, 0) / Object.values(gsData).length).toFixed(0) : 0;
    document.getElementById('gsCompletion').textContent = gsAvg + '%';
}

let weeklyChart, subjectChart, scoreChart;

function initializeCharts() {
    const weeklyCtx = document.getElementById('weeklyChart');
    const subjectCtx = document.getElementById('subjectChart');
    const scoreCtx = document.getElementById('scoreChart');

    if (weeklyChart) weeklyChart.destroy();
    if (subjectChart) subjectChart.destroy();
    if (scoreChart) scoreChart.destroy();

    weeklyChart = new Chart(weeklyCtx, {type: 'bar', data: {labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], datasets: [{label: 'Study Hours', data: getWeeklyHours(), backgroundColor: 'rgba(99, 102, 241, 0.5)', borderColor: 'rgba(99, 102, 241, 1)', borderWidth: 2}]}, options: {responsive: true, maintainAspectRatio: true, plugins: {legend: {display: false}}, scales: {y: {beginAtZero: true}, x: {}}}});

    subjectChart = new Chart(subjectCtx, {type: 'doughnut', data: {labels: getSubjectLabels(), datasets: [{data: getSubjectHours(), backgroundColor: ['rgba(99, 102, 241, 0.7)', 'rgba(139, 92, 246, 0.7)', 'rgba(16, 185, 129, 0.7)', 'rgba(245, 158, 11, 0.7)', 'rgba(239, 68, 68, 0.7)', 'rgba(59, 130, 246, 0.7)']}]}, options: {responsive: true, maintainAspectRatio: true, plugins: {legend: {position: 'bottom'}}}});

    scoreCtx.style.display = dataManager.getTestScores().length > 0 ? 'block' : 'none';
    if (dataManager.getTestScores().length > 0) {
        scoreChart = new Chart(scoreCtx, {type: 'line', data: {labels: getTestLabels(), datasets: [{label: 'Score (out of 1000)', data: getTestScores(), borderColor: 'rgba(99, 102, 241, 1)', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderWidth: 2, fill: true, tension: 0.4}, {label: 'Percentile', data: getTestPercentiles(), borderColor: 'rgba(139, 92, 246, 1)', backgroundColor: 'rgba(139, 92, 246, 0.1)', borderWidth: 2, fill: true, tension: 0.4, yAxisID: 'y1'}]}, options: {responsive: true, maintainAspectRatio: true, interaction: {mode: 'index', intersect: false}, plugins: {legend: {position: 'top'}}, scales: {y: {type: 'linear', display: true, position: 'left', beginAtZero: true, max: 1000}, y1: {type: 'linear', display: true, position: 'right', beginAtZero: true, max: 100, grid: {drawOnChartArea: false}}}}});
    }
}

function updateCharts() {
    if (weeklyChart) { weeklyChart.data.datasets[0].data = getWeeklyHours(); weeklyChart.update(); }
    if (subjectChart) { subjectChart.data.labels = getSubjectLabels(); subjectChart.data.datasets[0].data = getSubjectHours(); subjectChart.update(); }
    if (scoreChart) { scoreChart.data.labels = getTestLabels(); scoreChart.data.datasets[0].data = getTestScores(); scoreChart.data.datasets[1].data = getTestPercentiles(); scoreChart.update(); }
}

function getWeeklyHours() {
    const studyData = dataManager.getStudyData();
    const weeklyData = Array(7).fill(0);
    const today = new Date();
    studyData.forEach(entry => {
        const entryDate = new Date(entry.date);
        const dayDiff = Math.floor((today - entryDate) / (1000 * 60 * 60 * 24));
        if (dayDiff >= 0 && dayDiff < 7) weeklyData[6 - dayDiff] += entry.hours;
    });
    return weeklyData;
}

function getSubjectLabels() { const studyData = dataManager.getStudyData(); return [...new Set(studyData.map(e => e.subject))]; }
function getSubjectHours() { const studyData = dataManager.getStudyData(); const subjects = getSubjectLabels(); return subjects.map(subject => studyData.filter(e => e.subject === subject).reduce((sum, e) => sum + e.hours, 0)); }
function getTestLabels() { return dataManager.getTestScores().map(t => t.name); }
function getTestScores() { return dataManager.getTestScores().map(t => t.score); }
function getTestPercentiles() { return dataManager.getTestScores().map(t => t.percentile * 10); }

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `position: fixed; top: 20px; right: 20px; padding: 1rem 1.5rem; background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'}; color: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); z-index: 1000; animation: slideIn 0.3s ease-out; font-weight: 600;`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 2500);
}

document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
    new TabManager();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('studyDate').value = today;
    document.getElementById('testDate').value = today;
    renderTargetDisplay();
    renderTodayTargetsList();
    renderStudyHistory();
    renderGSProgress();
    renderOptionalProgress();
    renderRevisionList();
    renderTestRecords();
    updateDashboard();
    setTimeout(() => { initializeCharts(); }, 100);
    const style = document.createElement('style');
    style.textContent = `@keyframes slideIn {from {transform: translateX(400px); opacity: 0;} to {transform: translateX(0); opacity: 1;}} @keyframes slideOut {from {transform: translateX(0); opacity: 1;} to {transform: translateX(400px); opacity: 0;}}`;
    document.head.appendChild(style);
    console.log('✅ UPSC Study Tracker initialized successfully!');
});