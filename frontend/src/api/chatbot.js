import api, { publicApi } from './axios'

export const chatbotAPI = {
  // `public` skips the auth token so landing-page visitors are treated as guests,
  // even if an admin/member session happens to be stored in localStorage.
  sendMessage: (message, sessionId, { public: isPublic = false } = {}) =>
    (isPublic ? publicApi : api).post('/chatbot/chat/', { message, session_id: sessionId }),

  // For future use if we add history endpoint
  // getHistory: (sessionId) => api.get(`/chatbot/conversations/${sessionId}/`),
}
