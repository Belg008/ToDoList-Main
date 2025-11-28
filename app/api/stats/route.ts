import { NextResponse } from 'next/server';
import { loadTodos } from '@/lib/storage';

// GET /api/stats - Get statistics
export async function GET() {
  const data = loadTodos();
  const todos = data.todos;

  return NextResponse.json({
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    active: todos.filter(t => !t.completed).length,
    inProgress: todos.filter(t => t.status === 'in-progress').length,
    highPriority: todos.filter(t => ['high', 'urgent'].includes(t.priority)).length,
    statusCounts: {
      todo: todos.filter(t => t.status === 'todo').length,
      'in-progress': todos.filter(t => t.status === 'in-progress').length,
      review: todos.filter(t => t.status === 'review').length,
      done: todos.filter(t => t.status === 'done').length,
    },
  });
}
