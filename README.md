# Nexora — Social Media Frontend

A modern, full-featured social media web application built with React 19, Vite, and TailwindCSS v4. Nexora enables users to connect through posts, stories, real-time notifications, and a rich friend/follow system.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Pages & Routes](#pages--routes)
- [Architecture Overview](#architecture-overview)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Integration](#api-integration)
- [Real-time (Socket.IO)](#real-time-socketio)
- [State Management](#state-management)
- [Media Uploads (Cloudinary)](#media-uploads-cloudinary)
- [Authentication Flow](#authentication-flow)
- [Deployment (Vercel)](#deployment-vercel)

---

## Features

### Authentication
- Email/password registration with email verification
- Login with JWT access tokens (stored in memory) and HTTP-only refresh token cookies
- Google OAuth 2.0 login
- Forgot password flow (email → OTP → reset)
- Change password, deactivate account, and permanent account deletion

### Feed
- Infinite-scroll post feed from friends and followed users
- Real-time "new posts available" banner without full reload
- Create posts with text (Quill rich-text editor), images, and videos
- Post privacy controls: `PUBLIC`, `FRIENDS`, `ONLY_ME`
- AI-powered caption generation for uploaded images (Vietnamese / English)
- Edit and delete your own posts

### Posts & Reactions
- Facebook-style emoji reactions: 👍 LIKE, ❤️ LOVE, 😂 HAHA, 😮 WOW, 😢 SAD, 😡 ANGRY
- Reaction picker with hold-to-expand and per-user reaction summary modal
- Threaded comments with replies, edit, and delete
- Image lightbox for full-screen media viewing
- Video playback via Vidstack

### Stories
- 24-hour ephemeral stories (image or video)
- Stories bar on the feed with unread indicators
- Full-screen story viewer with auto-progress per story
- Story view count and viewer list (story author only)
- Real-time story creation/deletion events

### Friends & Social Graph
- Send, accept, reject, and cancel friend requests
- Unfriend, block, and unblock users
- Friend suggestions based on mutual connections
- Follow/unfollow independently of friendship
- Real-time friend request and acceptance events
- Online/offline presence indicators

### Notifications
- Real-time in-app notifications via Socket.IO
- Types: friend request, friend accepted, post reaction, post comment, comment reply, new follower, new post
- Mark individual or all notifications as read
- Unread badge count on the navbar

### User Profiles
- Profile page with cover photo, avatar, bio, friends/followers/following counts
- Edit avatar and cover photo (uploaded to Cloudinary)
- View user's posts in a paginated grid
- Dynamic profile action buttons based on friendship/follow status

### Settings
- Update username and bio
- Email verification status with resend flow
- Change password with strength indicator
- Google OAuth account indicator (no password needed)
- Deactivate account (re-activates on next login)
- Permanent account deletion with confirmation

### UX Extras
- Light/dark/system theme toggle (next-themes)
- Debounced user search in the navbar
- Skeleton loading states throughout
- Toast notifications (Sonner) with rich colors
- Fully responsive layout with left and right sidebars collapsing on mobile

---

## Tech Stack

| Category | Library / Tool |
|---|---|
| Framework | [React 19](https://react.dev/) |
| Build Tool | [Vite 8](https://vite.dev/) |
| Language | [TypeScript 5.9](https://www.typescriptlang.org/) |
| Styling | [TailwindCSS v4](https://tailwindcss.com/) (via `@tailwindcss/vite`) |
| UI Components | [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Routing | [React Router DOM v7](https://reactrouter.com/) |
| Server State | [TanStack Query v5](https://tanstack.com/query) |
| Client State | [Zustand v5](https://zustand-demo.pmnd.rs/) |
| HTTP Client | [Axios](https://axios-http.com/) with interceptors for auth & token refresh |
| Forms | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| Real-time | [Socket.IO Client v4](https://socket.io/) |
| Media Upload | [Cloudinary](https://cloudinary.com/) (unsigned upload) |
| Video Player | [Vidstack React](https://www.vidstack.io/) |
| Rich Text | [Quill v2](https://quilljs.com/) |
| Toast | [Sonner](https://sonner.emilkowal.ski/) |
| Date | [Day.js](https://day.js.org/) |
| Theme | [next-themes](https://github.com/pacocoursey/next-themes) |
| Font | [Geist Variable](https://vercel.com/font) |
| Linting | ESLint 9 + typescript-eslint |
| Deployment | [Vercel](https://vercel.com/) |

---

## Project Structure

```
frontend/
├── public/                     # Static assets
├── src/
│   ├── assets/                 # Static imports (SVGs, images)
│   ├── components/
│   │   ├── comment/            # Comment thread components
│   │   ├── friend/             # Friend request, suggestion, and friend cards
│   │   ├── layout/             # App shell: MainLayout, Navbar, Left/Right sidebars
│   │   │   └── auth/           # Auth layout wrapper
│   │   ├── notification/       # Notification list items
│   │   ├── post/               # Post cards, editor, dialogs, reaction picker
│   │   ├── profile/            # Profile header, edit dialogs, post grid
│   │   ├── shared/             # Reusable primitives (Avatar, Lightbox, Skeleton…)
│   │   ├── story/              # Stories bar, viewer, add/view dialogs
│   │   ├── ui/                 # shadcn/ui base components
│   │   ├── mode-toggle.tsx     # Light/dark/system theme switcher
│   │   ├── theme-context.ts    # Theme React context
│   │   └── theme-provider.tsx  # next-themes wrapper
│   ├── hooks/
│   │   ├── use-auth.ts         # Convenience hook over auth store
│   │   ├── use-bootstrap.ts    # Session restore on app startup
│   │   ├── use-cloudinary-upload.ts  # Multi-file upload with progress
│   │   ├── use-debounce.ts     # Generic debounce hook
│   │   ├── use-feed-new-posts.ts     # Socket-driven "new posts" banner
│   │   ├── use-generate-caption.ts   # AI caption generation hook
│   │   ├── use-infinite-scroll.ts    # IntersectionObserver-based scroll hook
│   │   ├── use-presence.ts     # Subscribe to user online/offline presence
│   │   └── use-socket.ts       # Socket.IO connection + event listeners
│   ├── lib/
│   │   ├── query-client.ts     # TanStack Query client instance
│   │   └── utils.ts            # cn(), formatters, password strength, etc.
│   ├── pages/
│   │   ├── auth/               # Login, Register, VerifyEmail, ForgotPassword
│   │   ├── oauth/              # OAuth callback handler
│   │   ├── feed-page.tsx       # Main feed
│   │   ├── friends-page.tsx    # Friend requests, sent, suggestions, all friends
│   │   ├── landing-page.tsx    # Marketing landing page (guest only)
│   │   ├── not-found-page.tsx  # 404 page
│   │   ├── notifications-page.tsx
│   │   ├── post-detail-page.tsx
│   │   ├── profile-page.tsx
│   │   └── settings-page.tsx
│   ├── services/
│   │   ├── api.ts              # Axios instance + 401 auto-refresh interceptor
│   │   └── api-services.ts     # Domain-grouped API call functions
│   ├── stores/
│   │   ├── auth-store.ts       # user, accessToken, isAuthenticated
│   │   ├── notification-store.ts  # unread count, friend request count, notification list
│   │   ├── presence-store.ts   # Set of online user IDs
│   │   └── socket-store.ts     # Socket.IO instance + connect/disconnect
│   ├── styles/                 # Additional global styles
│   ├── types/
│   │   └── index.ts            # All shared TypeScript types and interfaces
│   ├── App.tsx                 # Root: providers, router, routes
│   ├── index.css               # Tailwind directives + CSS variables
│   └── main.tsx                # React DOM entry point
├── .env.example                # Required environment variables template
├── components.json             # shadcn/ui configuration
├── eslint.config.js
├── index.html
├── package.json
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vercel.json                 # SPA rewrite rule for Vercel
└── vite.config.ts              # Vite config: React, Tailwind, path alias, dev proxy
```

---

## Pages & Routes

| Path | Component | Access |
|---|---|---|
| `/` | `LandingPage` | Guest only |
| `/login` | `LoginPage` | Guest only |
| `/register` | `RegisterPage` | Guest only |
| `/verify-email` | `VerifyEmailPage` | Public |
| `/forgot-password` | `ForgotPasswordPage` | Guest only |
| `/oauth/callback` | `OAuthCallbackPage` | Public |
| `/feed` | `FeedPage` | Protected |
| `/profile/:username` | `ProfilePage` | Protected |
| `/friends` | `FriendsPage` | Protected |
| `/notifications` | `NotificationsPage` | Protected |
| `/posts/:id` | `PostDetailPage` | Protected |
| `/settings` | `SettingsPage` | Protected |
| `*` | `NotFoundPage` | Public |

Protected routes are wrapped in `<ProtectedRoute>` which redirects unauthenticated users to `/login`. Guest-only routes are wrapped in `<GuestRoute>` which redirects authenticated users to `/feed`.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         React App (Vite)                        │
│                                                                 │
│  ThemeProvider → QueryClientProvider → BrowserRouter            │
│              └─ AppBootstrap (session restore + socket init)    │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Pages (routes)                                            │ │
│  │  └─ Components (layout, post, story, friend, profile…)    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────┐  ┌──────────────────┐  ┌───────────────────┐ │
│  │   Zustand    │  │  TanStack Query  │  │    Socket.IO      │ │
│  │  (auth,      │  │  (server state,  │  │  (real-time       │ │
│  │  presence,   │  │   caching,       │  │   events,         │ │
│  │  notifs,     │  │   pagination)    │  │   presence)       │ │
│  │  socket)     │  └──────────────────┘  └───────────────────┘ │
│  └──────────────┘                                              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Axios (api.ts)                                           │  │
│  │  • Attaches Bearer token on every request                 │  │
│  │  • Auto-refreshes on 401 (queues concurrent requests)     │  │
│  │  • Dev proxy: /api → localhost:3000                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                  REST API Backend (localhost:3000)
                  Socket.IO Server (localhost:3000)
                  Cloudinary CDN (media storage)
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A running backend API server (see backend README)
- A [Cloudinary](https://cloudinary.com/) account (free tier is fine)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd frontend

# Install dependencies
npm install
```

### Development

```bash
# Copy environment template and fill in your values
cp .env.example .env

# Start the dev server (http://localhost:5173)
npm run dev
```

The Vite dev server proxies all `/api` requests to `http://localhost:3000`, so CORS is transparently handled during local development.

### Build for Production

```bash
npm run build
```

Output is in `/dist`. Preview the production build locally:

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

---

## Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```env
# Full URL to your backend REST API (including /api prefix)
VITE_API_URL=http://localhost:3000/api

# Backend URL used for Socket.IO connection
VITE_SOCKET_URL=http://localhost:3000

# Cloudinary cloud name (e.g. "my-cloud")
VITE_CLOUDINARY_CLOUD_NAME=

# Cloudinary unsigned upload preset name
VITE_CLOUDINARY_UPLOAD_PRESET=
```

> **Note:** All variables are prefixed with `VITE_` so that Vite exposes them to the browser. Never put secrets here.

---

## API Integration

All API calls are defined in `src/services/api-services.ts`, grouped by domain:

| Export | Description |
|---|---|
| `authApi` | Register, login, logout, refresh, verify email, OTP, reset/change password |
| `usersApi` | Get / update current user, avatar, cover photo, deactivate, delete |
| `postsApi` | Create, CRUD feed posts, user posts |
| `commentsApi` | Create/edit/delete comments and replies |
| `reactionsApi` | Toggle reaction, list reactors, reaction summary |
| `friendshipsApi` | Send/accept/reject/cancel request, unfriend, block/unblock, suggestions |
| `followersApi` | Follow/unfollow, get followers/following |
| `notificationsApi` | List, mark read/all-read, delete |
| `storiesApi` | Create, feed, mine, active, record view, viewers, delete |
| `aiApi` | Generate image captions (Vietnamese / English) |
| `bootstrapApi` | Internal — used only by `useBootstrap` on app load |

The Axios instance in `src/services/api.ts` automatically:
1. Attaches the in-memory `accessToken` as a `Bearer` header on every request.
2. On a `401` response, silently refreshes the token via the `/auth/refresh` endpoint (using the HTTP-only cookie).
3. Queues any concurrent requests that arrived while refreshing and replays them with the new token.
4. If refresh fails, clears auth state and redirects to `/login`.

---

## Real-time (Socket.IO)

The `useSocket` hook (mounted once in `AppBootstrap`) manages a single Socket.IO connection authenticated with the access token.

### Events Handled

| Socket Event | Action |
|---|---|
| `new_notification` | Adds notification to store, increments unread badge, shows toast |
| `friend_request` | Increments friend-request badge, invalidates caches |
| `friend_request_cancelled` | Decrements badge, invalidates caches |
| `friend_accepted` | Invalidates friends, feed, profile, stories caches |
| `friend_unfriended` | Invalidates friends, feed, profile caches |
| `story:new` | Invalidates stories feed, shows toast |
| `story:deleted` | Invalidates stories feed |
| `user:online` | Marks user as online in presence store |
| `user:offline` | Marks user as offline in presence store |

---

## State Management

Zustand stores are kept intentionally thin — they hold only state that must be shared across many components and doesn't belong in the server cache.

| Store | Contents |
|---|---|
| `auth-store` | `user`, `accessToken`, `isAuthenticated` + setters |
| `notification-store` | `unreadCount`, `friendRequestCount`, latest `notifications[]` |
| `presence-store` | `Set<userId>` of currently online users |
| `socket-store` | Socket.IO `socket` instance + `connect`/`disconnect` |

Server data (posts, friends, profiles, etc.) lives exclusively in **TanStack Query** to benefit from caching, background refetching, and pagination.

---

## Media Uploads (Cloudinary)

The `useCloudinaryUpload` hook provides a complete multi-file upload pipeline:

- Accepts images (≤ 50 MB each) and videos (≤ 100 MB each), up to **10 files** per post
- Uploads concurrently with per-file `XMLHttpRequest` progress tracking
- Deduplicates files by name + size
- Cleans up `URL.createObjectURL` blobs on removal or reset
- Returns status: `idle | uploading | done | error` per file

The hook uploads directly to Cloudinary from the browser using an **unsigned upload preset**, meaning no files pass through the backend server.

---

## Authentication Flow

```
App Load
  └─ useBootstrap()
       ├─ POST /auth/refresh (cookie) → accessToken
       ├─ GET  /users/me              → user
       ├─ GET  /notifications/unread-count
       ├─ GET  /friendships/requests  (count)
       └─ setReady(true)

Login / Register
  └─ POST /auth/login → { accessToken, user }
       └─ setAuth(user, accessToken) → authStore

Google OAuth
  └─ Redirect → backend OAuth handler
       └─ Redirect back to /oauth/callback?token=…
            └─ Parse token → setAuth → navigate to /feed

Logout
  └─ POST /auth/logout (clears cookie on server)
       └─ authStore.logout() → redirect to /login

Token Refresh (silent, background)
  └─ Any request returns 401
       └─ Axios interceptor → POST /auth/refresh
            ├─ Success: replay original + queued requests
            └─ Failure: logout() + redirect /login
```

---

## Deployment (Vercel)

The project is pre-configured for Vercel with `vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

This ensures client-side routing works correctly for all paths (SPA rewrite).

### Steps

1. Push to GitHub.
2. Import the repository in [Vercel](https://vercel.com/).
3. Set the **Root Directory** to `frontend` (if this is a monorepo).
4. Add all four environment variables in the Vercel dashboard.
5. Deploy — Vercel auto-detects Vite and runs `npm run build`.

> **CORS:** In production, make sure your backend sets `Access-Control-Allow-Origin` to your Vercel domain and allows credentials.
