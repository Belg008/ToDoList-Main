import React, { useState, useEffect, useCallback } from 'react';
import {
  Trash2, Plus, CheckCircle2, Circle, AlertCircle, Calendar,
  Clock, Users, Save, RefreshCw, Settings, Filter,
  ChevronDown, Edit2, Eye, EyeOff, Send
} from 'lucide-react';
import './Page.css';

// URL-en til din backend
const API_BASE_URL = 'http://localhost:8000'; // Eller URL-en du bruker for FastAPI

// --- Interfaces (Datamodeller) ---

interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'set priority' | 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  dueDate?: string;
  assignee?: string;
  category?: string;
  tags?: string[];
  attachments?: string[];
  comments?: Comment[];
  estimatedHours?: number;
  actualHours?: number;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  subtasks?: Subtask[];
}

// --- Hovedkomponent ---

const Page: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'set priority' | 'low' | 'medium' | 'high' | 'urgent'>('set priority');
  const [dueDate, setDueDate] = useState('');
  const [assignee, setAssignee] = useState('');
  const [category, setCategory] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newComment, setNewComment] = useState('');
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [filter, setFilter] = useState<'all' | 'todo' | 'in-progress' | 'review' | 'done'>('all');
  const [showCompleted, setShowCompleted] = useState(true);
  const [showAdvancedForm, setShowAdvancedForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- API Henting (GET) ---
  const fetchTodos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/todos`);
      if (!response.ok) {
        throw new Error('Kunne ikke hente oppgaver');
      }
      const data = await response.json();
      
      const formattedTodos: Todo[] = data.todos.map((t: any) => ({
        ...t,
        id: String(t.id), // Sikrer at ID er en streng for React keys
        // Bruk Type Assertion for å matche de strenge typene vi definerte
        status: t.status as Todo['status'],
        priority: t.priority as Todo['priority'],
        
        // Sikrer at komplekse lister er initialisert
        tags: t.tags || [], 
        subtasks: t.subtasks || [],
        comments: t.comments || [],
        description: t.description || '',
        dueDate: t.dueDate || undefined,
        assignee: t.assignee || undefined,
        category: t.category || undefined,
        estimatedHours: t.estimatedHours || undefined,
        actualHours: t.actualHours || undefined,
      }));
      setTodos(formattedTodos);
    } catch (error) {
      console.error("Feil ved henting av todos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // --- Oppgavelogikk (CRUD) ---

  const resetInputFields = () => {
    setInput('');
    setDescription('');
    setPriority('set priority');
    setDueDate('');
    setAssignee('');
    setCategory('');
    setNewTag('');
    setShowAdvancedForm(false);
  };

  const handleAddTodo = async () => {
    if (!input.trim()) return;

    const newTodo: Omit<Todo, 'id' | 'subtasks' | 'comments' | 'attachments'> & { id?: string } = {
      title: input.trim(),
      description: description.trim(),
      completed: false,
      priority: priority === 'set priority' ? 'medium' : priority,
      createdAt: new Date().toISOString(),
      dueDate: dueDate || undefined,
      assignee: assignee || undefined,
      category: category || undefined,
      tags: newTag ? [newTag.trim()] : [],
      status: 'todo',
    };

    try {
      const response = await fetch(`${API_BASE_URL}/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTodo),
      });

      if (!response.ok) {
        throw new Error('Kunne ikke legge til oppgave');
      }

      const result = await response.json();
      const createdTodo: Todo = { 
        ...result.todo, 
        id: String(result.todo.id), // Sikrer at ID er string
        tags: result.todo.tags || [],
        subtasks: result.todo.subtasks || [],
        comments: result.todo.comments || [],
        status: result.todo.status as Todo['status'],
        priority: result.todo.priority as Todo['priority'],
      };
      
      setTodos((prevTodos) => [createdTodo, ...prevTodos]);
      resetInputFields();
      
    } catch (error) {
      console.error("Feil ved legging til todo:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/todos/${id}`, {
        method: 'DELETE',
      });
      setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
      
    } catch (err) {
      console.error("Kunne ikke slette på serveren:", err);
    }
  };

  const handleToggle = async (id: string) => {
    const todoToUpdate = todos.find((t) => t.id === id);
    if (!todoToUpdate) return;

    const newCompletedStatus = !todoToUpdate.completed;
    const newStatus: Todo['status'] = newCompletedStatus ? 'done' : 'todo';

    // 1. Optimal oppdatering av UI
    const updatedTodos = todos.map((todo) =>
      todo.id === id ? { ...todo, completed: newCompletedStatus, status: newStatus } : todo
    );
    setTodos(updatedTodos);

    try {
      // 2. Send endringen til backend via PUT
      await fetch(`${API_BASE_URL}/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completed: newCompletedStatus,
          status: newStatus
        })
      });

    } catch (err
