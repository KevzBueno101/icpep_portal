# ICPEP Portal Frontend

React frontend for the ICPEP Membership Portal. Built with Vite, Tailwind CSS, and Axios for API communication.

## Tech Stack

- **React 18+** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client with JWT interceptor
- **Zustand** - State management

## Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── axios.js              # Axios client with JWT auth interceptor
│   ├── context/
│   │   └── AuthContext.jsx       # Global auth state management
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── admin/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── MembersList.jsx
│   │   │   └── OfficersManagement.jsx
│   │   ├── member/
│   │   │   ├── MemberDashboard.jsx
│   │   │   └── Profile.jsx
│   │   └── landing/
│   │       ├── LandingPage.jsx
│   │       ├── HeroSection.jsx
│   │       ├── FeaturesSection.jsx
│   │       └── MilestonesSection.jsx
│   ├── routes/
│   │   └── ProtectedRoute.jsx    # Route protection wrapper
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Installation

```powershell
npm install
```

## Development

```powershell
npm run dev
```

Runs at `http://localhost:5173`

## Build for Production

```powershell
npm run build
```

## Linting

```powershell
npm run lint
```

## API Configuration

The API base URL is configured in `src/api/axios.js`. For local development, it points to `http://127.0.0.1:8000/api`.

## Authentication

The app uses JWT tokens for authentication. The `AuthContext` manages token storage and automatic refresh, while the Axios interceptor handles token injection and 401 error handling.

## Environment Variables

Create a `.env` file in the frontend root (optional for local dev):

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

For more information, see the main project README at the repository root.

## Recent changes (developer notes)

- Admin sidebar: desktop sidebar is now fixed on large screens so it stays visible while scrolling. The layout reserves `lg:ml-56` space for the sidebar.
- Defensive fixes: admin pages (`AdminDashboard`, admin lists) were updated to handle missing or non-paginated API responses safely. If an admin list looks empty, inspect the API response — it should be paginated and include `results`.

