// --- STORAGE ---
const STORAGE_KEY = 'todo_app_tasks';
const taskListContainer = document.getElementById('task-list-container');
const listFilter = document.getElementById('list-filter');
let currentFilter = 'All';

// Load tasks
const loadTasks = () => {
    try {
        const storedTasks = localStorage.getItem(STORAGE_KEY);
        return storedTasks ? JSON.parse(storedTasks) : [];
    } catch (e) {
        return [];
    }
};

// Save tasks
const saveTasks = (tasks) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

// Format date & time
const formatDateTime = (date, time) => {
    if (!date) return 'No Due Date';
    let display = new Date(date.replace(/-/g, '/')).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });

    if (time) {
        const [h, m] = time.split(':');
        const d = new Date();
        d.setHours(h);
        d.setMinutes(m);
        const formattedTime = d.toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit', hour12: true
        });
        display += ` at ${formattedTime}`;
    }
    return display;
};

// Create task DOM
const createTaskElement = (task) => {
    const item = document.createElement('div');
    item.className =
        `task-item p-4 rounded-lg flex justify-between items-center shadow-md 
         ${task.completed ? 'bg-green-100 border-l-4 border-green-500'
                          : 'bg-white border-l-4 border-slate-300 hover:shadow-lg'}`;
    item.dataset.id = task.id;

    item.innerHTML = `
        <div class="flex-1">
            <p class="text-lg font-medium ${task.completed ? 'line-through text-green-700' : 'text-slate-800'}">
                ${task.text}
            </p>
            <div class="mt-1 text-sm text-slate-500">
                <span class="text-xs py-1 px-2 rounded-full bg-gray-200 mr-2">${task.list}</span>
                <span>${formatDateTime(task.date, task.time)}</span>
            </div>
        </div>

        <div class="flex space-x-2 ml-4">
            <button class="toggle-complete-btn p-2 rounded-full bg-green-500 text-white"
                    data-id="${task.id}">
                ${task.completed ? '↩️' : '✓'}
            </button>
            <button class="edit-btn p-2 rounded-full bg-yellow-500 text-white"
                    data-id="${task.id}">
                ✏️
            </button>
            <button class="delete-btn p-2 rounded-full bg-red-500 text-white"
                    data-id="${task.id}">
                🗑️
            </button>
        </div>
    `;

    return item;
};

// Render tasks
const renderTasks = () => {
    const allTasks = loadTasks();
    let list = allTasks;

    if (currentFilter !== 'All') list = list.filter(t => t.list === currentFilter);

    // Sort incomplete first → earliest date → newest
    list.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const da = new Date(a.date || '9999-12-31');
        const db = new Date(b.date || '9999-12-31');
        return da - db || b.id - a.id;
    });

    taskListContainer.innerHTML = '';

    const loadingMsg = document.getElementById('loading-message');
    if (loadingMsg) loadingMsg.classList.add('hidden');

    if (list.length === 0) {
        taskListContainer.innerHTML =
            `<p class="text-center text-slate-500 py-10">No tasks found.</p>`;
    } else {
        list.forEach(task => taskListContainer.appendChild(createTaskElement(task)));
    }

    updateListFilterOptions(allTasks);
};

// Update filter list
const updateListFilterOptions = (allTasks) => {
    const currentSelected = listFilter.value;
    const lists = new Set(['General', 'Work', 'Personal', 'Health', 'Study']);

    allTasks.forEach(t => lists.add(t.list));

    listFilter.innerHTML = '<option value="All">All Lists</option>';
    lists.forEach(l => {
        const opt = document.createElement('option');
        opt.value = l;
        opt.textContent = l;
        listFilter.appendChild(opt);
    });

    listFilter.value = currentSelected;
};

// Add Task
const addTask = () => {
    const text = document.getElementById('task-text').value.trim();
    const list = document.getElementById('task-list').value;
    const date = document.getElementById('task-date').value;
    const time = document.getElementById('task-time').value;

    if (text === '') return;

    const tasks = loadTasks();
    tasks.push({
        id: Date.now(),
        text, list, date, time,
        completed: false
    });

    saveTasks(tasks);
    renderTasks();

    document.getElementById('task-text').value = '';
};

// Toggle Complete
const toggleComplete = (id) => {
    const tasks = loadTasks();
    const i = tasks.findIndex(t => t.id === id);
    tasks[i].completed = !tasks[i].completed;
    saveTasks(tasks);
    renderTasks();
};

// Delete
const deleteTask = (id) => {
    const tasks = loadTasks().filter(t => t.id !== id);
    saveTasks(tasks);
    renderTasks();
};

// Modal Controls
const editModal = document.getElementById('edit-modal');
const showEditModal = () => editModal.classList.remove('hidden');
const hideEditModal = () => editModal.classList.add('hidden');

// Edit + Save
document.getElementById('edit-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const id = parseInt(document.getElementById('edit-task-id').value);
    const tasks = loadTasks();
    const i = tasks.findIndex(t => t.id === id);

    tasks[i].text = document.getElementById('edit-text').value.trim();
    tasks[i].list = document.getElementById('edit-list').value;
    tasks[i].date = document.getElementById('edit-date').value;
    tasks[i].time = document.getElementById('edit-time').value;

    saveTasks(tasks);
    hideEditModal();
    renderTasks();
});

// Click listeners
taskListContainer.addEventListener('click', (e) => {
    const id = parseInt(e.target.dataset.id);
    if (e.target.classList.contains('toggle-complete-btn')) toggleComplete(id);
    else if (e.target.classList.contains('delete-btn')) deleteTask(id);
    else if (e.target.classList.contains('edit-btn')) {
        const task = loadTasks().find(t => t.id === id);

        document.getElementById('edit-task-id').value = task.id;
        document.getElementById('edit-text').value = task.text;
        document.getElementById('edit-list').value = task.list;
        document.getElementById('edit-date').value = task.date;
        document.getElementById('edit-time').value = task.time;

        showEditModal();
    }
});

document.getElementById('cancel-edit-btn').onclick = hideEditModal;
document.getElementById('add-task-btn').onclick = addTask;
listFilter.onchange = (e) => {
    currentFilter = e.target.value;
    renderTasks();
};

window.onload = renderTasks;
