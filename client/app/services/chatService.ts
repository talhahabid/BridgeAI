import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender_name: string;
  content: string;
  message_type: string;
  created_at: string;
  is_read: boolean;
}

export interface ChatSession {
  id: string;
  participants: string[];
  participant_names: string[];
  last_message?: ChatMessage;
  unread_count: number;
  last_activity: string;
}

export interface ChatHistoryResponse {
  success: boolean;
  messages: ChatMessage[];
  has_more: boolean;
}

export interface ChatSessionsResponse {
  success: boolean;
  sessions: ChatSession[];
}

export interface UnreadCountResponse {
  success: boolean;
  unread_count: number;
}

class ChatService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Get chat messages between two users
  async getChatMessages(otherUserId: string, limit: number = 50, skip: number = 0): Promise<ChatHistoryResponse> {
    try {
      const response = await axios.get(
        `${API_URL}/api/chat/messages/${otherUserId}?limit=${limit}&skip=${skip}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error getting chat messages:', error);
      throw new Error(error.response?.data?.detail || 'Failed to get chat messages');
    }
  }

  // Get all chat sessions for current user
  async getChatSessions(): Promise<ChatSessionsResponse> {
    try {
      const response = await axios.get(
        `${API_URL}/api/chat/sessions`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error getting chat sessions:', error);
      throw new Error(error.response?.data?.detail || 'Failed to get chat sessions');
    }
  }

  // Mark messages as read
  async markMessagesAsRead(otherUserId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.post(
        `${API_URL}/api/chat/mark-read/${otherUserId}`,
        {},
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error marking messages as read:', error);
      throw new Error(error.response?.data?.detail || 'Failed to mark messages as read');
    }
  }

  // Get unread count
  async getUnreadCount(): Promise<UnreadCountResponse> {
    try {
      const response = await axios.get(
        `${API_URL}/api/chat/unread-count`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error getting unread count:', error);
      throw new Error(error.response?.data?.detail || 'Failed to get unread count');
    }
  }

  // Delete a message
  async deleteMessage(messageId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.delete(
        `${API_URL}/api/chat/messages/${messageId}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error deleting message:', error);
      throw new Error(error.response?.data?.detail || 'Failed to delete message');
    }
  }

  // Send message via WebSocket (this will be handled by your existing WebSocket)
  sendMessage(receiverId: string, content: string, messageType: string = 'text') {
    // This will be handled by your existing WebSocket implementation
    // The message will be automatically saved to the database by the backend
    return {
      type: 'chat_message',
      receiver_id: receiverId,
      content: content,
      message_type: messageType
    };
  }

  // Mark messages as read via WebSocket
  markAsRead(otherUserId: string) {
    return {
      type: 'mark_read',
      other_user_id: otherUserId
    };
  }
}

export const chatService = new ChatService(); 