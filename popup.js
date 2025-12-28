document.addEventListener('DOMContentLoaded', () => {
    // Views
    const mainView = document.getElementById('main-view');
    const trackingView = document.getElementById('tracking-view');
    const settingsView = document.getElementById('settings-view');

    // Normal View
    const recordBtn = document.getElementById('record-btn');
    const totalCountEl = document.getElementById('total-count');
    const totalDurationEl = document.getElementById('total-duration');
    const pieChartEl = document.getElementById('pie-chart');
    const legendEl = document.getElementById('legend');
    const exportBtn = document.getElementById('export-btn');

    // Header Actions
    const settingsBtn = document.getElementById('settings-btn');

    // Modal
    const categoryModal = document.getElementById('category-modal');
    const cancelModalBtn = document.getElementById('cancel-btn');
    const categoryListContainer = document.getElementById('category-list-container');

    // Tracking View
    const currentCategoryEl = document.getElementById('current-category');
    const timerEl = document.getElementById('timer');
    const taskTypeSelect = document.getElementById('task-type');
    const taskMemoInput = document.getElementById('task-memo');
    const completeBtn = document.getElementById('complete-btn');
    const discardBtn = document.getElementById('discard-btn');

    // Settings View
    const settingsListEl = document.getElementById('settings-list');
    const settingsTypeListEl = document.getElementById('settings-type-list');

    const newCategoryInput = document.getElementById('new-category-input');
    const addCategoryBtn = document.getElementById('add-category-btn');

    const newTypeInput = document.getElementById('new-type-input');
    const addTypeBtn = document.getElementById('add-type-btn');

    const closeSettingsBtn = document.getElementById('close-settings-btn');


    // Storage Keys
    const LOGS_KEY = 'interruption_logs';
    const CURRENT_KEY = 'current_interruption';
    const CATEGORIES_KEY = 'categories';
    const TASK_TYPES_KEY = 'task_types';

    // Defaults
    const DEFAULT_CATEGORIES = ['📞 電話', '🗣️ 相談', '📧 メール', '🔥 至急案件', '🤔 その他'];
    const DEFAULT_TYPES = ['要件定義', '設計', '実装', 'テスト', 'MTG', '調査', 'その他'];

    // State
    let logs = [];
    let categories = [];
    let taskTypes = [];
    let currentInterruption = null; // { category, startTime, memo, taskType }
    let timerInterval = null;

    // Initialize
    init();

    function init() {
        chrome.storage.local.get([LOGS_KEY, CURRENT_KEY, CATEGORIES_KEY, TASK_TYPES_KEY], (result) => {
            logs = result[LOGS_KEY] || [];
            currentInterruption = result[CURRENT_KEY] || null;
            categories = result[CATEGORIES_KEY] || DEFAULT_CATEGORIES;
            taskTypes = result[TASK_TYPES_KEY] || DEFAULT_TYPES;

            if (currentInterruption) {
                showTrackingView();
            } else {
                showMainView();
            }
            updateStatsUI();
        });
    }

    // --- Event Listeners ---

    // Record Flow
    recordBtn.addEventListener('click', () => {
        renderCategoryButtons();
        categoryModal.classList.remove('hidden');
    });

    cancelModalBtn.addEventListener('click', () => {
        categoryModal.classList.add('hidden');
    });

    // Tracking Flow
    completeBtn.addEventListener('click', completeInterruption);
    discardBtn.addEventListener('click', discardInterruption);

    // Auto-save Fields
    taskTypeSelect.addEventListener('change', () => {
        if (currentInterruption) {
            currentInterruption.taskType = taskTypeSelect.value;
            chrome.storage.local.set({ [CURRENT_KEY]: currentInterruption });
        }
    });

    taskMemoInput.addEventListener('input', () => {
        if (currentInterruption) {
            currentInterruption.memo = taskMemoInput.value;
            chrome.storage.local.set({ [CURRENT_KEY]: currentInterruption });
        }
    });

    // Settings Flow
    settingsBtn.addEventListener('click', () => {
        renderSettingsLists();
        showSettingsView();
    });

    closeSettingsBtn.addEventListener('click', () => {
        showMainView();
        updateStatsUI();
    });

    addCategoryBtn.addEventListener('click', addNewCategory);
    addTypeBtn.addEventListener('click', addNewTaskType);

    // Export
    exportBtn.addEventListener('click', exportToCSV);


    // --- Core Functions: Interruption ---

    function startInterruption(category) {
        // Default task type is the first one available
        const defaultType = taskTypes.length > 0 ? taskTypes[0] : '';

        currentInterruption = {
            category: category,
            startTime: Date.now(),
            memo: '',
            taskType: defaultType
        };
        chrome.storage.local.set({ [CURRENT_KEY]: currentInterruption }, () => {
            showTrackingView();
        });
    }

    function completeInterruption() {
        if (!currentInterruption) return;

        const now = Date.now();
        const duration = Math.floor((now - currentInterruption.startTime) / 1000); // seconds

        const memo = taskMemoInput.value.trim();
        const taskType = taskTypeSelect.value;

        const newLog = {
            timestamp: currentInterruption.startTime,
            category: currentInterruption.category,
            duration: duration,
            memo: memo,
            taskType: taskType
        };

        logs.push(newLog);

        chrome.storage.local.set({
            [LOGS_KEY]: logs,
            [CURRENT_KEY]: null
        }, () => {
            currentInterruption = null;
            showMainView();
            updateStatsUI();
        });
    }

    function discardInterruption() {
        chrome.storage.local.set({ [CURRENT_KEY]: null }, () => {
            currentInterruption = null;
            showMainView();
        });
    }

    // --- Core Functions: Settings (Categories & Types) ---

    function renderCategoryButtons() {
        categoryListContainer.innerHTML = '';
        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'category-btn';
            btn.textContent = cat;
            btn.addEventListener('click', () => {
                startInterruption(cat);
                categoryModal.classList.add('hidden');
            });
            categoryListContainer.appendChild(btn);
        });
    }

    // --- DnD Functions ---
    let draggedItem = null;
    let draggedIndex = null;
    let draggedListType = null; // 'category' or 'taskType'

    function renderSettingsLists() {
        // Categories
        settingsListEl.innerHTML = '';
        categories.forEach((cat, index) => {
            const row = createSettingsItem(cat, index, 'category', () => deleteCategory(index));
            settingsListEl.appendChild(row);
        });

        // Task Types
        settingsTypeListEl.innerHTML = '';
        taskTypes.forEach((type, index) => {
            const row = createSettingsItem(type, index, 'taskType', () => deleteTaskType(index));
            settingsTypeListEl.appendChild(row);
        });
    }

    function createSettingsItem(text, index, type, deleteCallback) {
        const row = document.createElement('div');
        row.className = 'settings-item';
        row.draggable = true;
        row.dataset.index = index;
        row.dataset.type = type;

        const handle = document.createElement('span');
        handle.className = 'drag-handle';
        handle.textContent = '≡';

        const name = document.createElement('span');
        name.textContent = text;
        name.className = 'item-name';

        const del = document.createElement('button');
        del.className = 'delete-btn';
        del.textContent = '×';
        del.title = '削除';
        del.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteCallback();
        });

        row.appendChild(handle);
        row.appendChild(name);
        row.appendChild(del);

        // DnD Events
        row.addEventListener('dragstart', handleDragStart);
        row.addEventListener('dragover', handleDragOver);
        row.addEventListener('drop', handleDrop);
        row.addEventListener('dragend', handleDragEnd);
        row.addEventListener('dragenter', handleDragEnter);
        row.addEventListener('dragleave', handleDragLeave);

        return row;
    }

    function handleDragStart(e) {
        draggedItem = this;
        draggedIndex = parseInt(this.dataset.index);
        draggedListType = this.dataset.type;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedIndex);
        setTimeout(() => this.classList.add('dragging'), 0);
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    function handleDragEnter(e) {
        if (this !== draggedItem && this.dataset.type === draggedListType) {
            this.classList.add('over');
        }
    }

    function handleDragLeave(e) {
        this.classList.remove('over');
    }

    function handleDrop(e) {
        e.stopPropagation();
        const targetType = this.dataset.type;

        if (draggedItem !== this && draggedListType === targetType) {
            const targetIndex = parseInt(this.dataset.index);

            if (targetType === 'category') {
                reorderArray(categories, draggedIndex, targetIndex);
                saveCategories();
            } else if (targetType === 'taskType') {
                reorderArray(taskTypes, draggedIndex, targetIndex);
                saveTaskTypes();
            }
            renderSettingsLists();
        }
        return false;
    }

    function handleDragEnd(e) {
        this.classList.remove('dragging');
        document.querySelectorAll('.settings-item').forEach(item => {
            item.classList.remove('over');
        });
        draggedItem = null;
        draggedIndex = null;
        draggedListType = null;
    }

    function reorderArray(arr, fromIndex, toIndex) {
        const component = arr.splice(fromIndex, 1)[0];
        arr.splice(toIndex, 0, component);
    }

    function addNewCategory() {
        const val = newCategoryInput.value.trim();
        if (!val) return;
        if (categories.includes(val)) {
            alert('既に同じカテゴリが存在します');
            return;
        }
        categories.push(val);
        saveCategories();
        newCategoryInput.value = '';
        renderSettingsLists();
    }

    function addNewTaskType() {
        const val = newTypeInput.value.trim();
        if (!val) return;
        if (taskTypes.includes(val)) {
            alert('既に同じ工程が存在します');
            return;
        }
        taskTypes.push(val);
        saveTaskTypes();
        newTypeInput.value = '';
        renderSettingsLists();
    }

    function deleteCategory(index) {
        if (confirm(`カテゴリ「${categories[index]}」を削除しますか？`)) {
            categories.splice(index, 1);
            saveCategories();
            renderSettingsLists();
        }
    }

    function deleteTaskType(index) {
        if (confirm(`工程「${taskTypes[index]}」を削除しますか？`)) {
            taskTypes.splice(index, 1);
            saveTaskTypes();
            renderSettingsLists();
        }
    }

    function saveCategories() {
        chrome.storage.local.set({ [CATEGORIES_KEY]: categories });
    }

    function saveTaskTypes() {
        chrome.storage.local.set({ [TASK_TYPES_KEY]: taskTypes });
    }

    // --- View Handling ---

    function showMainView() {
        mainView.classList.remove('hidden');
        trackingView.classList.add('hidden');
        settingsView.classList.add('hidden');

        exportBtn.style.display = 'inline-block';
        settingsBtn.style.visibility = 'visible';

        if (timerInterval) clearInterval(timerInterval);
    }

    function showTrackingView() {
        mainView.classList.add('hidden');
        trackingView.classList.remove('hidden');
        settingsView.classList.add('hidden');

        exportBtn.style.display = 'none';
        settingsBtn.style.visibility = 'hidden';

        currentCategoryEl.textContent = currentInterruption.category;

        // Populate Task Type Dropdown
        renderTaskTypeOptions();

        // Restore values
        if (currentInterruption.taskType) {
            taskTypeSelect.value = currentInterruption.taskType;
        }
        taskMemoInput.value = currentInterruption.memo || '';

        updateTimerDisplay();
        timerInterval = setInterval(updateTimerDisplay, 1000);
    }

    function renderTaskTypeOptions() {
        taskTypeSelect.innerHTML = '';
        taskTypes.forEach(type => {
            const opt = document.createElement('option');
            opt.value = type;
            opt.textContent = type;
            taskTypeSelect.appendChild(opt);
        });
    }

    function showSettingsView() {
        mainView.classList.add('hidden');
        trackingView.classList.add('hidden');
        settingsView.classList.remove('hidden');

        exportBtn.style.display = 'none';
        settingsBtn.style.visibility = 'hidden';
    }

    function updateTimerDisplay() {
        if (!currentInterruption) return;
        const now = Date.now();
        const diffSeconds = Math.floor((now - currentInterruption.startTime) / 1000);

        const h = Math.floor(diffSeconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((diffSeconds % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(diffSeconds % 60).toString().padStart(2, '0');

        timerEl.textContent = `${h}:${m}:${s}`;
    }

    // --- Stats & Visualizations ---

    function updateStatsUI() {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        const todaysLogs = logs.filter(log => log.timestamp >= startOfDay);
        const totalDuration = todaysLogs.reduce((acc, log) => acc + (log.duration || 0), 0);

        totalCountEl.textContent = todaysLogs.length;

        const totalMinutes = Math.floor(totalDuration / 60);
        const displayH = Math.floor(totalMinutes / 60);
        const displayM = totalMinutes % 60;
        totalDurationEl.textContent = displayH > 0 ? `${displayH}h ${displayM}m` : `${displayM}m`;

        const categoryCounts = {};
        todaysLogs.forEach(log => {
            categoryCounts[log.category] = (categoryCounts[log.category] || 0) + 1;
        });

        const categoryColors = {};
        const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#6b7280'];

        Object.keys(categoryCounts).forEach((cat, idx) => {
           if (cat.includes('電話')) categoryColors[cat] = palette[0];
           else if (cat.includes('相談')) categoryColors[cat] = palette[1];
           else if (cat.includes('メール')) categoryColors[cat] = palette[2];
           else if (cat.includes('至急')) categoryColors[cat] = palette[3];
           else if (cat.includes('その他')) categoryColors[cat] = palette[9];
           else {
               const hash = cat.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
               categoryColors[cat] = palette[hash % palette.length];
           }
        });

        renderChart(todaysLogs.length, categoryCounts, categoryColors);
    }

    function renderChart(total, counts, colors) {
        if (total === 0) {
            pieChartEl.style.background = 'conic-gradient(#e5e7eb 0% 100%)';
            legendEl.innerHTML = '<span style="color:#9ca3af; text-align:center;">記録なし</span>';
            return;
        }

        let currentDeg = 0;
        let gradientStr = '';
        let legendHtml = '';

        for (const [category, count] of Object.entries(counts)) {
            const percentage = (count / total) * 100;
            const degrees = (count / total) * 360;
            const color = colors[category] || '#9ca3af';

            gradientStr += `${color} ${currentDeg}deg ${currentDeg + degrees}deg, `;
            currentDeg += degrees;

            legendHtml += `
                <div class="legend-item">
                    <div style="display:flex; align-items:center; gap:6px;">
                        <span class="color-box" style="background-color:${color}"></span>
                        <span>${category}</span>
                    </div>
                    <span>${count} (${Math.round(percentage)}%)</span>
                </div>
            `;
        }

        gradientStr = gradientStr.slice(0, -2);
        pieChartEl.style.background = `conic-gradient(${gradientStr})`;
        legendEl.innerHTML = legendHtml;
    }

    function exportToCSV() {
        if (logs.length === 0) {
            alert('記録されたデータがありません');
            return;
        }

        // CSV Header
        let csvContent = "Timestamp,Date,Time,Category,TaskType,Memo,Duration(sec),Duration(fmt)\n";

        logs.forEach(log => {
            const dateObj = new Date(log.timestamp);
            const dateStr = dateObj.toLocaleDateString();
            const timeStr = dateObj.toLocaleTimeString();
            const duration = log.duration || 0;
            const memo = log.memo ? log.memo.replace(/"/g, '""') : "";
            const taskType = log.taskType ? log.taskType.replace(/"/g, '""') : "";

            const m = Math.floor(duration / 60);
            const s = duration % 60;
            const durFmt = `${m}m${s}s`;

            csvContent += `${log.timestamp},${dateStr},${timeStr},"${log.category}","${taskType}","${memo}",${duration},"${durFmt}"\n`;
        });

        // Use Blob for robust download handling
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]); // UTF-8 BOM
        const blob = new Blob([bom, csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);

        const now = new Date();
        const fileName = `interruption_logs_${now.getFullYear()}${String(now.getMonth()+1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.csv`;

        // Use chrome.downloads API to ensure filename is respected
        chrome.downloads.download({
            url: url,
            filename: fileName,
            saveAs: true
        }, (downloadId) => {
             // Revoke URL after download starts
             setTimeout(() => {
                 URL.revokeObjectURL(url);
             }, 1000);
        });
    }
});
