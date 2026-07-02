import { supabase } from './supabase';

/**
 * Chat API — Supabase-backed chat history
 * All operations use the client-side Supabase SDK.
 * RLS policies ensure users can only access their own data.
 */

/**
 * Get or create a chat session for a (user, note) pair.
 * Returns the session object { id, user_id, note_id, title, created_at, updated_at }.
 */
export async function getOrCreateSession(userId, noteId, noteTitle) {
  // Try to find existing session
  const { data: existing } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('note_id', noteId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return existing;

  // Create new session
  const { data: created, error } = await supabase
    .from('chat_sessions')
    .insert({
      user_id: userId,
      note_id: noteId,
      title: noteTitle || 'Untitled',
    })
    .select()
    .single();

  if (error) throw error;
  return created;
}

/**
 * Get all chat messages for a session.
 * Returns array of { id, session_id, role, content, created_at }.
 */
export async function getChatHistory(sessionId) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Save a single message to a session.
 */
export async function saveMessage(sessionId, role, content) {
  const { error } = await supabase
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      role,
      content,
    });

  if (error) throw error;

  // Touch updated_at on session
  await supabase
    .from('chat_sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', sessionId);
}

/**
 * Get all saved chat sessions for a user, ordered by most recent.
 * Returns array of session objects with message count.
 */
export async function getUserSessions(userId) {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Delete a chat session and its messages (cascade handles messages).
 */
export async function deleteSession(sessionId) {
  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) throw error;
}

/**
 * Save a full conversation (both user and assistant messages) at once.
 * Useful for saving the entire chat when user clicks "Save".
 */
export async function saveConversation(sessionId, messages) {
  const rows = messages.map((m) => ({
    session_id: sessionId,
    role: m.role === 'ai' ? 'assistant' : m.role,
    content: m.text || m.content || '',
  }));

  const { error } = await supabase
    .from('chat_messages')
    .insert(rows);

  if (error) throw error;

  // Touch updated_at
  await supabase
    .from('chat_sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', sessionId);
}
