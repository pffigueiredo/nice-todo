
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteTodo = async (input: DeleteTodoInput): Promise<{ success: boolean }> => {
  try {
    // Check if todo exists first
    const existing = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, input.id))
      .execute();

    if (existing.length === 0) {
      throw new Error(`Todo with id ${input.id} not found`);
    }

    // Delete the todo
    await db.delete(todosTable)
      .where(eq(todosTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Todo deletion failed:', error);
    throw error;
  }
};
