import { NextRequest, NextResponse } from 'next/server';
import { loadTodos, saveTodos } from '@/lib/storage';

// PATCH /api/todos/[id]/toggle - Toggle completed status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const data = loadTodos();
  const index = data.todos.findIndex(t => t.id === params.id);

  if (index === -1) {
    return NextResponse.json(
      { error: 'Todo not found' },
      { status: 404 }
    );
  }

  data.todos[index].completed = !data.todos[index].completed;
  saveTodos(data);

  return NextResponse.json({
    message: 'Status changed!',
    todo: data.todos[index],
  });
}
