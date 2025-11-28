import fs from 'fs';
import path from 'path';

export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: string;
  createdAt: string;
  dueDate?: string;
  assignee?: string;
  category?: string;
  tags: string[];
  comments: Comment[];
  estimatedHours?: number;
  actualHours?: number;
  status: string;
  subtasks: Subtask[];
}

interface TodoData {
  todos: Todo[];
  next_id: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const TODOS_FILE = path.join(DATA_DIR, 'todos.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function loadTodos(): TodoData {
  try {
    if (fs.existsSync(TODOS_FILE)) {
      const data = fs.readFileSync(TODOS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading todos:', error);
  }
  return { todos: [], next_id: 1 };
}

export function saveTodos(data: TodoData): void {
  try {
    fs.writeFileSync(TODOS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving todos:', error);
  }
}
