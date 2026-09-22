import api from '../api/axios'

export const chatbotAPI = {
  sendMessage: (message, sessionId) =>
    api.post('/chatbot/chat/', { message, session_id: sessionId }),

  // For future use if we add history endpoint
  // getHistory: (sessionId) => api.get(`/chatbot/conversations/${sessionId}/`),
}