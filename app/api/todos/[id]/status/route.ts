import { NextRequest, NextResponse } from 'next/server';
import { loadTodos, saveTodos } from '@/lib/storage';

// PATCH /api/todos/[id]/status - Update status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();
    const validStatuses = ['todo', 'in-progress', 'review', 'done'];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const data = loadTodos();
    const index = data.todos.findIndex(t => t.id === id);

    if (index === -1) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }

    data.todos[index].status = status;
    saveTodos(data);

    return NextResponse.json({
      message: 'Status updated!',
      todo: data.todos[index],
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
}
