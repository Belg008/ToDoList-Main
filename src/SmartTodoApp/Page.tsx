/* Completed todo style */
.todo-card.completed {
  opacity: 0.6;
  background: #f0f0f3;
  text-decoration: line-through;
}

/* Icons */
.icon-check {
  color: #007aff;
  font-weight: 700;
  margin-right: 6px;
}

.icon-empty {
  color: rgba(0,0,0,0.3);
  margin-right: 6px;
}

/* Delete button */
.delete-button {
  background: transparent;
  border: none;
  color: #d40000;
  font-size: 14px;
  cursor: pointer;
  margin-left: auto;
  transition: transform 0.12s;
}

.delete-button:hover {
  transform: scale(1.2);
}

/* Fade-in animation for new todos */
.fade-in {
  animation: fadeIn 0.25s ease-out;
}

@keyframes fadeIn {
  0% { opacity: 0; transform: translateY(-10px); }
  100% { opacity: 1; transform: translateY(0); }
}
