/* ==============================================================
   KANBAN BOARD - script.js
   Beginner-friendly Vanilla JavaScript (no classes, no frameworks)
   ============================================================== */

/* --------------------------------------------------------------
   1. SELECTING ELEMENTS WE WILL NEED AGAIN AND AGAIN
   -------------------------------------------------------------- */
const addTaskBtn = document.getElementById("addTaskBtn");     // "+ Add New Task" button in header
const modalOverlay = document.getElementById("modalOverlay"); // the dark overlay + modal box
const cancelBtn = document.getElementById("cancelBtn");       // "Cancel" button inside modal
const confirmAddBtn = document.getElementById("confirmAddBtn"); // "Add Task" button inside modal
const taskTitleInput = document.getElementById("taskTitleInput");
const taskDescInput = document.getElementById("taskDescInput");
const errorText = document.getElementById("errorText");
const modalTitle = document.getElementById("modalTitle");

// Tracks which mode the modal is currently in.
// - null            -> we are ADDING a brand-new task
// - a card's id      -> we are EDITING that existing task
// This one variable is what lets us reuse the SAME modal/inputs
// for both adding and editing, instead of building a second UI.
let editingTaskId = null;

// We keep every column's task-list <div> in one object so we can
// look them up by status name instead of writing repetitive code.
const taskLists = {
  todo: document.getElementById("list-todo"),
  inprogress: document.getElementById("list-inprogress"),
  done: document.getElementById("list-done"),
};

// Same idea for the little counter badges at the top of each column.
const taskCounts = {
  todo: document.getElementById("count-todo"),
  inprogress: document.getElementById("count-inprogress"),
  done: document.getElementById("count-done"),
};

// A simple counter to give every new task a unique ID.
// (In a real app this might come from a database, but for a
// beginner project a growing number is perfectly fine.)
let nextTaskId = 1;

// The key we use to store our tasks inside the browser's localStorage.
// Using a named constant (instead of typing the string everywhere)
// avoids typos like "kanbanTask" vs "kanbanTasks" causing silent bugs.
const STORAGE_KEY = "kanbanTasks";


/* --------------------------------------------------------------
   0. SAVING & LOADING (localStorage persistence)
   -------------------------------------------------------------- */

// Looks at every task-card currently on the board, in every column,
// and saves them as one array of plain objects into localStorage.
// We call this after ANY change: add, delete, or move.
function saveTasksToStorage() {
  const allTasks = []; // will hold one object per task-card

  // Object.keys() gives us ["todo", "inprogress", "done"] so we can
  // loop over all three columns without repeating code three times.
  Object.keys(taskLists).forEach(function (status) {
    const cardsInColumn = taskLists[status].querySelectorAll(".task-card");

    cardsInColumn.forEach(function (card) {
      allTasks.push({
        id: card.dataset.id,
        title: card.querySelector("h3").textContent,
        description: card.querySelector("p").textContent,
        status: status, // which column this card currently belongs to
      });
    });
  });

  // localStorage can only store STRINGS, so we convert our array
  // of objects into a JSON string with JSON.stringify().
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allTasks));
}

// Runs once when the page first loads. Reads whatever was saved
// last time and rebuilds those cards on the board.
function loadTasksFromStorage() {
  const savedData = localStorage.getItem(STORAGE_KEY);

  // If nothing has ever been saved before, savedData will be null.
  // In that case there's nothing to load, so we just stop here.
  if (!savedData) {
    return;
  }

  // JSON.parse() converts the saved string back into a real array of objects.
  const savedTasks = JSON.parse(savedData);

  savedTasks.forEach(function (task) {
    const card = createTaskCard(task.id, task.title, task.description);
    taskLists[task.status].appendChild(card);

    // Make sure future new tasks get an ID higher than any saved one,
    // so we never accidentally create two cards with the same id.
    const numericId = parseInt(task.id, 10);
    if (numericId >= nextTaskId) {
      nextTaskId = numericId + 1;
    }
  });

  updateAllCounters();
}


/* --------------------------------------------------------------
   2. OPENING AND CLOSING THE MODAL
   -------------------------------------------------------------- */

// Runs when the user clicks "+ Add New Task"
function openModal() {
  editingTaskId = null;                    // null means we're adding, not editing
  modalTitle.textContent = "Add New Task"; // make sure the heading says "Add"
  confirmAddBtn.textContent = "Add Task";  // make sure the button says "Add Task"
  modalOverlay.classList.remove("hidden"); // show the overlay (CSS handles the fade-in)
  taskTitleInput.focus();                  // put the cursor straight into the title field
}

// Runs when the user clicks the "Edit" button on an existing card.
// It's almost identical to openModal(), except it PRE-FILLS the inputs
// with the card's current title/description, and remembers which
// card we're editing so handleAddTask() knows to update instead of create.
function openEditModal(card) {
  editingTaskId = card.dataset.id; // remember which card we're editing

  // Read the card's current text straight out of the DOM and put it
  // into the inputs, so the user edits starting from the existing values.
  taskTitleInput.value = card.querySelector("h3").textContent;
  taskDescInput.value = card.querySelector("p").textContent;

  modalTitle.textContent = "Edit Task";     // change the heading
  confirmAddBtn.textContent = "Save Changes"; // change the button label
  modalOverlay.classList.remove("hidden");
  taskTitleInput.focus();
}

// Runs when the user clicks "Cancel" (or after successfully adding/editing a task)
function closeModal() {
  modalOverlay.classList.add("hidden"); // hide the overlay again
  taskTitleInput.value = "";            // clear the inputs so the next task starts fresh
  taskDescInput.value = "";
  errorText.classList.add("hidden");    // hide any leftover error message
  editingTaskId = null;                 // always leave the modal back in a clean "add" state
}

addTaskBtn.addEventListener("click", openModal);
cancelBtn.addEventListener("click", closeModal);


/* --------------------------------------------------------------
   3. CREATING A NEW TASK CARD (DOM ELEMENT)
   -------------------------------------------------------------- */

// Builds and returns a <div class="task-card"> filled with the
// title, description and a delete button.
function createTaskCard(id, title, description) {
  // createElement() makes a brand-new, empty element in memory
  // (it is NOT on the page yet until we appendChild() it somewhere).
  const card = document.createElement("div");
  card.classList.add("task-card");

  // dataset lets us attach a custom "data-id" attribute to the card.
  // We'll use this later to find the exact card to delete or move.
  card.dataset.id = id;

  // A card must be "draggable" for the HTML5 Drag and Drop API to work.
  card.setAttribute("draggable", "true");

  // Build the inner HTML of the card.
  // (For a beginner project, innerHTML is simple to read and reason about.)
  card.innerHTML = `
    <h3>${title}</h3>
    <p>${description}</p>
    <div class="card-actions">
      <button class="edit-btn">Edit</button>
      <button class="delete-btn">Delete</button>
    </div>
  `;

  return card;
}


/* --------------------------------------------------------------
   4. UPDATING THE TASK COUNTER FOR ONE COLUMN
   -------------------------------------------------------------- */

// Counts how many .task-card elements exist inside a given column
// and writes that number into its counter badge.
function updateCounter(status) {
  const listElement = taskLists[status];
  const countElement = taskCounts[status];

  // querySelectorAll() returns a NodeList of all matching elements.
  // Its .length property tells us exactly how many cards are inside.
  const taskCards = listElement.querySelectorAll(".task-card");
  countElement.textContent = taskCards.length;
}

// Updates ALL three counters at once. We call this after every
// add / delete / move so the numbers are always accurate.
function updateAllCounters() {
  updateCounter("todo");
  updateCounter("inprogress");
  updateCounter("done");
}


/* --------------------------------------------------------------
   5. ADDING A NEW TASK (triggered by the modal's "Add Task" button)
   -------------------------------------------------------------- */

function handleAddTask() {
  // .trim() removes extra spaces the user might have typed accidentally.
  const title = taskTitleInput.value.trim();
  const description = taskDescInput.value.trim();

  // Basic validation: a task must have a title.
  if (title === "") {
    errorText.classList.remove("hidden"); // show "Please enter a task title."
    return; // stop the function here, don't add an empty task
  }

  // editingTaskId tells us which mode we're in:
  if (editingTaskId !== null) {
    // --- EDIT MODE: find the existing card and update its text in place ---
    const cardBeingEdited = document.querySelector(
      `.task-card[data-id="${editingTaskId}"]`
    );

    if (cardBeingEdited) {
      cardBeingEdited.querySelector("h3").textContent = title;
      cardBeingEdited.querySelector("p").textContent = description;
    }
  } else {
    // --- ADD MODE: build a brand-new card into the "To Do" column ---
    const newCard = createTaskCard(nextTaskId, title, description);
    taskLists.todo.appendChild(newCard);
    nextTaskId++; // make sure the next task gets a different ID
  }

  updateAllCounters();       // the "To Do" counter needs to go up by 1 (only matters in add mode)
  saveTasksToStorage();      // persist the change so it survives a refresh
  closeModal();              // hide the modal, clear inputs, and reset editingTaskId
}

confirmAddBtn.addEventListener("click", handleAddTask);


/* --------------------------------------------------------------
   6. DELETING A TASK (event delegation)
   -------------------------------------------------------------- */

// Instead of adding a "click" listener to every single delete button
// (which would be wasteful, especially for cards created later),
// we add ONE listener to the whole board and check WHAT was clicked.
// This pattern is called "event delegation".
const board = document.querySelector(".board");

board.addEventListener("click", function (event) {
  // event.target is the exact element the user clicked on.
  // .classList.contains() checks if it's a delete button.
  if (event.target.classList.contains("delete-btn")) {
    // .closest() walks UP the DOM tree from the button until it
    // finds the nearest ancestor that matches ".task-card".
    const card = event.target.closest(".task-card");
    const column = card.closest(".column"); // remember which column it was in

    card.remove(); // removes the card from the DOM completely

    // We only need to refresh the counter for the column that lost a card.
    updateCounter(column.dataset.status);
    saveTasksToStorage(); // persist the deletion so it survives a refresh
  }

  // Same delegation pattern, but for the new Edit button.
  if (event.target.classList.contains("edit-btn")) {
    const card = event.target.closest(".task-card");
    openEditModal(card); // opens the modal, pre-filled, in "edit" mode
  }
});


/* --------------------------------------------------------------
   7. DRAG AND DROP (HTML5 Drag and Drop API)
   -------------------------------------------------------------- */

// --- 7a. Starting a drag ---
// "dragstart" fires on the element being picked up (the task card).
// We again use event delegation on the board so this works even
// for cards that get added AFTER the page has loaded.
board.addEventListener("dragstart", function (event) {
  if (event.target.classList.contains("task-card")) {
    // Store the dragged card's unique id inside the "data transfer" object.
    // This is how the Drag and Drop API passes information from the
    // drag source (the card) to the drop target (a column) later on.
    event.dataTransfer.setData("text/plain", event.target.dataset.id);

    // Give the card a slightly transparent look while it's being dragged.
    // We use a tiny delay (setTimeout) so the "ghost" image the browser
    // shows while dragging is captured BEFORE we change the opacity.
    setTimeout(() => {
      event.target.classList.add("dragging");
    }, 0);
  }
});

// --- 7b. Ending a drag ---
// "dragend" fires on the card once the drag finishes (dropped or cancelled).
board.addEventListener("dragend", function (event) {
  if (event.target.classList.contains("task-card")) {
    event.target.classList.remove("dragging"); // remove the transparency
  }

  // Safety net: if the drag was cancelled (dropped outside any column,
  // or the user pressed Escape), the "drop" event never fires on the
  // column, which means its .drag-over highlight would normally get
  // stuck forever. Clearing it from EVERY column here guarantees the
  // glow always disappears once the drag is truly over.
  allColumns.forEach(function (column) {
    column.classList.remove("drag-over");
  });
});

// --- 7c. Hovering over a column while dragging ---
// We attach dragover/dragleave/drop to EACH column individually,
// because we need to know exactly which column is being interacted with.
const allColumns = document.querySelectorAll(".column");

allColumns.forEach(function (column) {
  // "dragover" fires continuously while a dragged item is over the column.
  column.addEventListener("dragover", function (event) {
    // Browsers block dropping by default, so we MUST call preventDefault()
    // to tell the browser "yes, this is a valid drop target".
    event.preventDefault();

    // Add the glowing dashed-border highlight defined in style.css.
    column.classList.add("drag-over");
  });

  // "dragleave" fires when the dragged item leaves the column's area.
  column.addEventListener("dragleave", function () {
    column.classList.remove("drag-over"); // remove the highlight
  });

  // "drop" fires when the user releases the mouse button over the column.
  column.addEventListener("drop", function (event) {
    event.preventDefault();
    column.classList.remove("drag-over"); // always clean up the highlight

    // Retrieve the id we stored earlier in dragstart.
    const taskId = event.dataTransfer.getData("text/plain");

    // Find the actual card element anywhere on the board using that id.
    // The [data-id="..."] part is an "attribute selector".
    const draggedCard = document.querySelector(`.task-card[data-id="${taskId}"]`);

    if (draggedCard) {
      // Figure out which column the card is being dropped into,
      // then find that column's .task-list div and move the card there.
      const targetStatus = column.dataset.status;
      const targetList = taskLists[targetStatus];
      targetList.appendChild(draggedCard); // moves the existing element (doesn't duplicate it)

      // Both the old column and the new column need their counters refreshed.
      updateAllCounters();
      saveTasksToStorage(); // persist the new column so it survives a refresh
    }
  });
});


/* --------------------------------------------------------------
   8. INITIAL SETUP
   -------------------------------------------------------------- */

// Try to restore any tasks that were saved during a previous visit.
loadTasksFromStorage();

// Make sure all counters correctly reflect what's on the board
// (either restored tasks, or "0" if this is a first-ever visit).
updateAllCounters();