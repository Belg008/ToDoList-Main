import { NextRequest, NextResponse } from 'next/server';
import { loadTodos, saveTodos } from '@/lib/storage';

// POST /api/todos/[id]/comments - Add comment to todo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { author, text } = await request.json();
    const data = loadTodos();
    const index = data.todos.findIndex(t => t.id === id);

    if (index === -1) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }

    const newComment = {
      id: String(Date.now()),
      author,
      text,
      timestamp: new Date().toISOString(),
    };

    if (!data.todos[index].comments) {
      data.todos[index].comments = [];
    }

    data.todos[index].comments.push(newComment);
    saveTodos(data);

    return NextResponse.json({
      message: 'Comment added!',
      comment: newComment,
      todo: data.todos[index],
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}
