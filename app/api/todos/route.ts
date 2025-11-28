import { NextRequest, NextResponse } from 'next/server';
import { loadTodos, saveTodos } from '@/lib/storage';

// GET /api/todos - Get all todos with optional filters
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const completed = searchParams.get('completed');
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const assignee = searchParams.get('assignee');

  const data = loadTodos();
  let filteredTodos = data.todos;

  if (completed !== null) {
    const isCompleted = completed === 'true';
    filteredTodos = filteredTodos.filter(t => t.completed === isCompleted);
  }

  if (status) {
    filteredTodos = filteredTodos.filter(t => t.status === status);
  }

  if (priority) {
    filteredTodos = filteredTodos.filter(t => t.priority === priority);
  }

  if (assignee) {
    filteredTodos = filteredTodos.filter(t => t.assignee === assignee);
  }

  return NextResponse.json({
    todos: filteredTodos,
    count: filteredTodos.length,
  });
}

// POST /api/todos - Create new todo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = loadTodos();

    const newTodo = {
      id: String(data.next_id),
      title: body.title,
      description: body.description,
      completed: body.completed || false,
      priority: body.priority || 'medium',
      createdAt: new Date().toISOString(),
      dueDate: body.dueDate || undefined,
      assignee: body.assignee || undefined,
      category: body.category || undefined,
      tags: body.tags || [],
      comments: body.comments || [],
      estimatedHours: body.estimatedHours || undefined,
      actualHours: body.actualHours || undefined,
      status: body.status || 'todo',
      subtasks: body.subtasks || [],
    };

    data.todos.unshift(newTodo);
    data.next_id += 1;
    saveTodos(data);

    return NextResponse.json({
      message: 'Todo created!',
      todo: newTodo,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create todo' },
      { status: 500 }
    );
  }
}

// DELETE /api/todos - Clear all todos
export async function DELETE() {
  const data = { todos: [], next_id: 1 };
  saveTodos(data);
  return NextResponse.json({ message: 'All todos deleted!' });
}
