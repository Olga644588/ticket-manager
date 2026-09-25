import './css/style.css';

const API_URL = 'http://localhost:7070';

const list = document.getElementById('tickets-list');
const addTicketBtn = document.getElementById('add-ticket-btn');

const ticketModal = document.getElementById('ticket-modal');
const ticketForm = document.getElementById('ticket-form');
const modalTitle = document.getElementById('modal-title');
const nameInput = document.getElementById('ticket-name');
const descInput = document.getElementById('ticket-description');
const cancelTicketBtn = document.getElementById('cancel-ticket-btn');

const deleteModal = document.getElementById('delete-modal');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

let editingTicketId = null;
let deletingTicketId = null;

async function fetchAllTickets() {
  const response = await fetch(`${API_URL}?method=allTickets`);
  if (!response.ok) throw new Error(`Ошибка ${response.status}`);
  return response.json();
}

async function fetchTicketById(id) {
  const response = await fetch(`${API_URL}?method=ticketById&id=${id}`);
  if (!response.ok) throw new Error(`Ошибка ${response.status}`);
  return response.json();
}

async function fetchCreateTicket(data) {
  const response = await fetch(`${API_URL}?method=createTicket`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Ошибка ${response.status}`);
  return response.json();
}

async function fetchUpdateTicket(id, data) {
  const response = await fetch(`${API_URL}?method=updateById&id=${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Ошибка ${response.status}`);
  return response.json();
}

async function fetchDeleteTicket(id) {
  const response = await fetch(`${API_URL}?method=deleteById&id=${id}`);
  if (!response.ok && response.status !== 204) throw new Error(`Ошибка ${response.status}`);
}

async function loadTickets() {
  try {
    const tickets = await fetchAllTickets();
    renderTickets(tickets);
  } catch (e) {
    console.error('Не удалось загрузить тикеты:', e);
    const li = document.createElement('li');
    li.className = 'empty-state';
    li.textContent = 'Ошибка загрузки. Проверьте, запущен ли сервер.';
    list.innerHTML = ''; 
    list.append(li);
  }
}

function renderTickets(tickets) {
  list.replaceChildren();

  if (!tickets || tickets.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty-state';
    li.textContent = 'Тикетов пока нет';
    list.append(li);
    return;
  }

  tickets.forEach((ticket) => {
    const li = document.createElement('li');
    li.className = 'ticket-item';
    li.dataset.id = ticket.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'ticket-status';
    checkbox.checked = ticket.status;

    checkbox.addEventListener('change', async () => {
      try {
        await fetchUpdateTicket(ticket.id, { status: checkbox.checked });
        loadTickets();
      } catch (e) {
        console.error('Не удалось обновить статус:', e);
        checkbox.checked = !checkbox.checked;
      }
    });

    const body = document.createElement('div');
    body.className = 'ticket-body';

    const nameSpan = document.createElement('div');
    nameSpan.className = 'ticket-name' + (ticket.status ? ' done' : '');
    nameSpan.textContent = ticket.name;
    body.append(nameSpan);

    const descDiv = document.createElement('div');
    descDiv.className = 'ticket-description hidden';
    descDiv.style.width = '100%';
    descDiv.style.marginTop = '8px';

    let descLoaded = false;

    body.addEventListener('click', async (e) => {
      if (e.target.closest('.ticket-status') || e.target.closest('.icon-btn')) return;

      if (descDiv.classList.contains('hidden')) {
        descDiv.classList.remove('hidden');
        if (!descLoaded) {
          descDiv.textContent = 'Загрузка...';
          try {
            const full = await fetchTicketById(ticket.id);
            descDiv.textContent = full.description || 'Описание отсутствует';
            descLoaded = true;
          } catch (e) {
            console.error('Ошибка загрузки описания:', e);
            descDiv.textContent = 'Ошибка загрузки описания';
          }
        }
      } else {
        descDiv.classList.add('hidden');
      }
    });

    const dateSpan = document.createElement('div');
    dateSpan.className = 'ticket-date';

    if (ticket.created) {
      const dateObj = new Date(ticket.created);
      dateSpan.textContent = dateObj.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      dateSpan.textContent = '-';
    }

    const actions = document.createElement('div');
    actions.className = 'ticket-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'icon-btn edit-btn';
    editBtn.type = 'button';
    editBtn.textContent = '✎';
    editBtn.title = 'Редактировать';
    editBtn.addEventListener('click', () => openTicketModal(ticket));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'icon-btn delete-btn';
    deleteBtn.type = 'button';
    deleteBtn.textContent = '✕';
    deleteBtn.title = 'Удалить';
    deleteBtn.addEventListener('click', () => openDeleteModal(ticket.id));

    actions.append(editBtn, deleteBtn);

    const rightGroup = document.createElement('div');
    rightGroup.className = 'ticket-right-group';
    rightGroup.append(dateSpan, actions);

    li.append(checkbox, body, descDiv, rightGroup);
    list.append(li);
  });
}


function openTicketModal(ticket = null) {
  if (ticket) {
    editingTicketId = ticket.id;
    modalTitle.textContent = 'Редактировать тикет';
    nameInput.value = ticket.name;
    fetchTicketById(ticket.id).then((full) => {
      descInput.value = full.description || '';
    }).catch(() => {
      descInput.value = '';
    });
  } else {
    editingTicketId = null;
    modalTitle.textContent = 'Добавить тикет';
    ticketForm.reset();
  }
  ticketModal.classList.remove('hidden');
}

function closeTicketModal() {
  ticketModal.classList.add('hidden');
  editingTicketId = null;
  ticketForm.reset();
}

ticketForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  if (!name) return;
  const description = descInput.value.trim();

  try {
    if (editingTicketId) {
      await fetchUpdateTicket(editingTicketId, { name, description });
    } else {
      await fetchCreateTicket({ name, description, status: false });
    }
    closeTicketModal();
    loadTickets();
  } catch (e) {
    console.error('Ошибка сохранения:', e);
    alert('Не удалось сохранить тикет.');
  }
});

cancelTicketBtn.addEventListener('click', closeTicketModal);
ticketModal.querySelector('.modal-overlay').addEventListener('click', closeTicketModal);

function openDeleteModal(id) {
  deletingTicketId = id;
  deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
  deleteModal.classList.add('hidden');
  deletingTicketId = null;
}

confirmDeleteBtn.addEventListener('click', async () => {
  if (!deletingTicketId) return;
  try {
    await fetchDeleteTicket(deletingTicketId);
    closeDeleteModal();
    loadTickets();
  } catch (e) {
    console.error('Ошибка удаления:', e);
    alert('Не удалось удалить тикет.');
  }
});

cancelDeleteBtn.addEventListener('click', closeDeleteModal);
deleteModal.querySelector('.modal-overlay').addEventListener('click', closeDeleteModal);


addTicketBtn.addEventListener('click', () => openTicketModal());


document.addEventListener('DOMContentLoaded', loadTickets);

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
