//!Import helper functions from external modules
import { getTasks } from "./utils/taskFunctions.js";
import { createNewTask } from "./utils/taskFunctions.js";
import { patchTask } from "./utils/taskFunctions.js";
import { putTask } from "./utils/taskFunctions.js";
import { deleteTask} from "./utils/taskFunctions.js";

//!Import initial data 
import { initialData } from "./initialData.js";

/**Function to initialize data in localStorage if not already present.
*!Loads initialData if no tasks are found in localStorage.
 */
function initializeData() {
  if (!localStorage.getItem('tasks')) {
    localStorage.setItem('tasks', JSON.stringify(initialData)); 
    localStorage.setItem('showSideBar', 'true') // Store sidebar visibility
    localStorage.setItem('editTaskForm', 'false') // Store modal state (open/closed)
  } else {
    console.log('Data already exists in localStorage');
  }
}

//! Get necessary elements from DOM
const sideBarDiv = document.getElementById("side-bar-div");
const themeSwitch = document.getElementById("switch");
const hideSideBarBtn = document.getElementById("hide-side-bar-btn");
const showSideBarBtn = document.getElementById("show-side-bar-btn");
const headerBoardName = document.getElementById("header-board-name");
const addNewTaskBtn = document.getElementById("add-new-task-btn");
const newTaskModalWindow = document.getElementById("new-task-modal-window");
const createNewTaskBtn = document.getElementById("create-task-btn");
const editTaskForm = document.getElementById("edit-task-form");
const editTaskTitleInput = document.getElementById("edit-task-title-input");
const editTaskDescInput = document.getElementById("edit-task-desc-input");
const editSelectStatus = document.getElementById("edit-select-status");
const saveTaskChangesBtn = document.getElementById("save-task-changes-btn");
const deleteTaskBtn = document.getElementById("delete-task-btn");
const filterDiv = document.getElementById("filterDiv");
const columnDivs = document.querySelectorAll(".column-div");


//! Initialize board when the page is loaded
let activeBoard = initializeData(); 



/**
 *! Function to fetch and display boards and tasks from localStorage.
 *! Also sets the active board and refreshes the task UI.
 */
function fetchAndDisplayBoardsAndTasks() {
  const tasks = getTasks();
  const boards = tasks.map(task => task.board).filter(Boolean); //? note that tasks is already an array not a set 
  displayBoards(boards);  // Display boards in the UI
  if (boards.length > 0) {
    const localStorageBoard = JSON.parse(localStorage.getItem("activeBoard"))
    activeBoard = localStorageBoard ? localStorageBoard : boards[0]; //!fixed ternary
    headerBoardName.innerHTML = activeBoard; 
    styleActiveBoard(activeBoard); // Style the active board
    refreshTasksUI(); //Update the UI with the tasks for the active board
  }

}

/**
 *! Function to display boards in the sidebar.
 *! Filters out duplicate boards and adds a click event to each board button.
 */
function displayBoards(boards) {
  const boardsContainer = document.getElementById("boards-nav-links-div");
  boardsContainer.innerHTML = ''; // Clears the container

  //!Create a set of unique board names (remove duplicates)
  const existingBoards = [...new Set(boards.map(board => board.trim()))];
  existingBoards.forEach(board => { 
    const boardElement = document.createElement("button");
    boardElement.textContent = board;
    boardElement.classList.add("board-btn");

     //!Add event listener for clicking a board button
    boardElement.addEventListener('click', () => { 
      headerBoardName.textContent = board; // Update the board header
      filterAndDisplayTasksByBoard(board); // Filter and display tasks for the clicked board
      activeBoard = board; //assigns active board
      localStorage.setItem("activeBoard", JSON.stringify(activeBoard)); // Save active board to localStorage
      styleActiveBoard(activeBoard);// Style the active board
    });
    boardsContainer.appendChild(boardElement); // Add the board button to the container
  });

}

/**
 * !Filters tasks by board and displays them in the respective columns based on their status.
 * !The function takes a parameter called  boardName - The name of the board to filter tasks by.
 */
function filterAndDisplayTasksByBoard(boardName) {
  const tasks = getTasks(); // Fetch tasks from a simulated local storage function
  const filteredTasks = tasks.filter(task => task.board === boardName); // Filter tasks by board name
  console.log(tasks)
 
  columnDivs.forEach(column => {  // displays relevant tasks
    const status = column.getAttribute("data-status");
    // Reset column content while preserving the column title
    column.innerHTML = `<div class="column-head-div">
                          <span class="dot" id="${status}-dot"></span>
                          <h4 class="columnHeader">${status.toUpperCase()}</h4>
                        </div>`;

    const tasksContainer = document.createElement("div");
    column.appendChild(tasksContainer); // Append the task container to the html div

     // Filter tasks by status and display the task
    filteredTasks.filter(task => task.status === status).forEach(task => { 
      const taskElement = document.createElement("div"); //create a new element for added tasks
      taskElement.classList.add("task-div");
      taskElement.textContent = task.title;
      taskElement.setAttribute('data-task-id', task.id);

      // Listen for a click event on each task and open a modal
      taskElement.addEventListener("click", () => { 
        toggleModal(true,'edit') // Open the edit modal
        openEditTaskModal(task);  // Call the open edit function which populates modal with task details
      });//!addEventlistener

      tasksContainer.appendChild(taskElement); // Add task to the column
    });
  });
}

/**
 * !Refreshes the task UI by re-filtering and displaying tasks for the active board.
 */
function refreshTasksUI() {
  filterAndDisplayTasksByBoard(activeBoard);
}

/**
 * Adds 'active' styling to the selected board and removes it from others.
 * this function has a parameter called  boardName which is the name of the board to style as active.
 */
function styleActiveBoard(boardName) {
  const boardBtn = document.querySelectorAll('.board-btn');
  boardBtn.forEach(btn => { 
    // Apply active class to the selected board and remove it from others
    if(btn.textContent === boardName) {
      btn.classList.add('active') 
    }
    else {
      btn.classList.remove('active'); 
    }
  });
}

/**
 * Function to add a task to the UI in the correct status column.
 * The parameter for the function is the task object containing task details.
 */
function addTaskToUI(task) {
  const column = document.querySelector(`.column-div[data-status="${task.status}"]`); 
  if (!column) {
    console.error(`Column not found for status: ${task.status}`);
    return;
  }

  let tasksContainer = column.querySelector('.tasks-container');
  if (!tasksContainer) {
    console.warn(`Tasks container not found for status: ${task.status}, creating one.`);
    tasksContainer = document.createElement('div'); //creates a taskContainer element 
    tasksContainer.className = 'tasks-container'; // add the class to the newly created element 
    column.appendChild(tasksContainer); //add the task container to the column
  }

  const taskElement = document.createElement('div');
  taskElement.className = 'task-div';
  taskElement.textContent = task.title; // Set task title
  taskElement.setAttribute('data-task-id', task.id);// Store task ID
  
  tasksContainer.appendChild(taskElement); // Add taskElement to the task container
}


/**
 * Set up various event listeners on page load.
 */
function setupEventListeners() {
  // Cancel editing task event listener
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  cancelEditBtn.addEventListener('click', () => toggleModal(false, 'edit'));

  // Cancel adding new task event listener
  const cancelAddTaskBtn = document.getElementById('cancel-add-task-btn');
  cancelAddTaskBtn.addEventListener('click', () => {
    toggleModal(false, 'add');
    filterDiv.style.display = 'none'; // Also hide the filter overlay
  });

  // Clicking outside the modal to close it
  filterDiv.addEventListener('click', () => {
    toggleModal(false, 'add');
    filterDiv.style.display = 'none'; // Also hide the filter overlay
  });

  // Show sidebar event listener
  hideSideBarBtn.addEventListener('click', () => {toggleSidebar(false)});
  showSideBarBtn.addEventListener('click', () => toggleSidebar(true));

  // Theme switch event listener
  themeSwitch.addEventListener('change', toggleTheme);

  // Show Add New Task Modal event listener
  addNewTaskBtn.addEventListener('click', () => {
    toggleModal(true, 'add');
    filterDiv.style.display = 'block'; // Also show the filter overlay
  });

  // Add new task form submission event listener
  createNewTaskBtn.addEventListener('submit',  (event) => {
    addTask(event);
  });
}

/**
 * Toggles the visibility of the modals (add task or edit task) with two parameters
 *  The boolean show is true or false  to show or hide the modal.
 * The second parament is the modal type 'add' or 'edit'.
 */
function toggleModal(show, modalType) {
  if (modalType === 'add') {
    newTaskModalWindow.style.display = show ? 'block' : 'none';
  } else if (modalType === 'edit') {
    editTaskForm.style.display = show ? 'block' : 'none';
  }

  filterDiv.style.display = show ? 'block' : 'none'; // Show/hide filter overlay for both modals
}

/**
 * Adds a new task based on user input from the form.
 * Prevents the default form submission behavior.
 */
function addTask(event) {
  event.preventDefault(); 

  // Get user input values for the task details
  const title =document.getElementById("title-input").value;
  const descriptionInput = document.getElementById("desc-input").value;
  const status = document.getElementById("select-status").value;
  // Fetch the current list of tasks
  const tasks = getTasks()
  const lastTask = tasks[tasks.length-1]
   // Assign a new ID based on the last task's ID or set it to 1 if no tasks exist
  const taskId = lastTask ? lastTask.id + 1 : 1;
  // Create the task object
  const task = {id: taskId,
      title: title,
      description: descriptionInput,
      status: status,
      board: activeBoard,
    };
     // Add the task to storage and the UI
    const newTask = createNewTask(task);
    if (newTask) {
      addTaskToUI(newTask); // Add the task to the UI
      toggleModal(false, 'add'); // Close the modal
      filterDiv.style.display = 'none'; // Also hide the filter overlay
      event.target.reset(); //Reset the form
      refreshTasksUI();
    }
}

/**
 * Toggles the sidebar visibility based on the passed `show` parameter.
 */
function toggleSidebar(show) {
  const showSideBarBtn = document.getElementById("show-side-bar-btn");
    // Set the sidebar display based on the `show` parameter
  sideBarDiv.style.display = show ? "block" : "none";
  showSideBarBtn.style.display = show ? "none" : "block" //!displays sidebar
}

/**
 * !Toggles between light and dark themes.
 * !Updates the theme and stores the user's preference in localStorage.
 */
function toggleTheme() {
  const body = document.querySelector("body");
  const isChecked = this.checked;

  if (isChecked) {
    // Enable light theme and store the preference
    body.classList.add("light-theme");
    localStorage.setItem('light-theme', 'enabled');
  } else{
     // Disable light theme and store the preference
    body.classList.remove("light-theme");
    localStorage.setItem('light-theme', 'disabled');
    
  }
}


/**
 * Opens the modal to edit an existing task.
 * Prefills the task form with the selected task details and allows saving changes or deleting the task.
 */
function openEditTaskModal(task) {
  const storedTasks = getTasks()
  const storedTask = storedTasks.find(t => t.id === task.id);// Find the selected task

  // Prefill the modal form with task details if the task exists
  if (storedTask) { 
    editTaskTitleInput.value = storedTask.title;
    editTaskDescInput.value = storedTask.description;
    editSelectStatus.value = storedTask.status;
  }

  // Call saveTaskChanges upon click of Save Changes button
  saveTaskChangesBtn.onclick = function() {
    const editedTitle = editTaskTitleInput.value;
    const editedDescription = editTaskDescInput.value;
    const editedStatus = editSelectStatus.value;

    // Update the task object with new values
    task.title = editedTitle;
    task.description = editedDescription;
    task.status = editedStatus;

    const tasks = getTasks(); // Get the current list of tasks
    const taskIndex = tasks.findIndex(t => t.id === task.id);

    // If task exists, update it and save the changes
    if (taskIndex !== -1) {
      tasks[taskIndex] = task; // Update the task in the array
      patchTask(task.id, task); // Save the updated task list 
    }
    
    saveTaskChanges(task.id); // Save changes
    toggleModal(false,'edit'); // Close the modal after saving
    refreshTasksUI()
  }
  // Delete task using a helper function and close the task modal
  deleteTaskBtn.onclick = () => { 
    deleteTask(task.id); 
    toggleModal(false, 'edit'); // Close the modal
    refreshTasksUI();
  }
  toggleModal(true,'edit'); // Show the edit task modal
}

/**
 * Saves the changes made to an existing task.
 * Updates the task list and refreshes the UI.
 */
function saveTaskChanges(taskId) {
  // Get the updated task details from the form
  const newTitle = editTaskTitleInput.value;    // Assuming these input fields exist
  const newDescription = editTaskDescInput.value;
  const newStatus = editSelectStatus.value;
  // Get the list of current tasks and find the task by its ID
  const tasks = getTasks();
  const taskIndex = tasks.findIndex(task => task.id === taskId);

  // If task is found, update it with new details
  if (taskIndex >= 0) {
    const updatedTask = {
      ...tasks[taskIndex], // Keep previous task properties
      title: newTitle,       // Update with new inputs
      description: newDescription,
      status: newStatus
    };
    // Update task using a helper function
    putTask(taskId, updatedTask);
    
  } else {
    console.error("Task not found");
  }

  // Close the modal and refresh the UI to reflect the changes
  toggleModal(true, 'edit')
  refreshTasksUI();
}

/**
 * Initializes the application when the DOM content is fully loaded.
 * Sets up event listeners, handles theme and sidebar state, and displays boards and tasks.
 */
document.addEventListener('DOMContentLoaded', function() {
  init(); // init is called after the DOM is fully loaded
});

/**
 * Initializes app components.
 * Sets up event listeners, toggles sidebar and theme based on stored preferences, and fetches tasks and boards.
 */
function init() {
  setupEventListeners();// Attach event listeners to elements
  // Show or hide the sidebar based on localStorage preference
  const showSidebar = localStorage.getItem('showSideBar') === 'true';
  toggleModal(false, "edit"); // Ensure the edit modal is initially hidden
  toggleSidebar(showSidebar); // Show or hide the sidebar

  // Toggle theme based on stored preference
  const isLightTheme = localStorage.getItem('light-theme') === 'enabled';
  themeSwitch.checked = isLightTheme;
  document.body.classList.toggle('light-theme', isLightTheme);
  fetchAndDisplayBoardsAndTasks(); // Initial display of boards and tasks
}