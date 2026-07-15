# 📋 Kanban Board

A modern, dark-themed Kanban board built entirely with **Vanilla HTML, CSS, and JavaScript** — no frameworks, no libraries.

🔗 **Live Demo:** https://vermamayank0412-lgtm.github.io/kanban-board/

![Kanban Board Screenshot](kanban.png)

## ✨ Features

- **Three-column board** — To Do, In Progress, Done
- **Drag & Drop** — move tasks between columns using the native HTML5 Drag and Drop API, with live glow/highlight on hover
- **Modal-based task creation** — clean popup instead of a single input box
- **Edit tasks in place** — update a task's title/description without deleting it
- **Live task counters** — each column automatically shows how many tasks it holds
- **Persistent storage** — tasks are saved to `localStorage`, so your board survives a page refresh
- **Polished dark UI** — rounded cards, soft shadows, smooth hover/transition animations

## 🛠️ Built With

- HTML5
- CSS3 (Flexbox/Grid, transitions, custom properties)
- Vanilla JavaScript (ES6) — no frameworks or external libraries

## 🚀 Running Locally

1. Clone the repo:
```bash
   git clone https://github.com/vermamayank0412-lgtm/kanban-board.git
```
2. Open `index.html` directly in your browser — no build step or server required.

## 📁 Project Structure

kanban-board/
├── index.html   # Page structure (columns, modal)
├── style.css    # Dark theme, layout, animations
└── script.js    # Task logic, drag-and-drop, localStorage

## 📌 What This Project Demonstrates

- DOM manipulation without a framework (`createElement`, `querySelector`, `classList`, `dataset`)
- Event delegation for dynamically created elements
- The full HTML5 Drag and Drop API lifecycle (`dragstart`, `dragover`, `dragleave`, `drop`, `dragend`)
- Client-side data persistence with `localStorage`
- Clean, modular vanilla JS structure with small, single-purpose functions

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
