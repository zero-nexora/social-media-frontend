# Social App — Frontend

A modern social media client built with **React 19**, **Vite 6**, **Tailwind CSS v4**, and **Socket.io** for real-time features.

---

## Tech Stack

| Category          | Technology                            |
| ----------------- | ------------------------------------- |
| Framework         | React 19 + TypeScript                 |
| Build tool        | Vite 6                                |
| Styling           | Tailwind CSS v4 (CSS-based config)    |
| Component library | shadcn/ui (Radix UI primitives)       |
| Server state      | TanStack Query v5                     |
| Client state      | Zustand v5                            |
| Routing           | React Router v7                       |
| Forms             | React Hook Form + Zod                 |
| HTTP              | Axios (with auto-refresh interceptor) |
| Real-time         | Socket.io Client v4                   |
| Rich text editor  | QuillJS                               |
| Toasts            | Sonner                                |
| Icons             | Lucide React                          |
| Date formatting   | dayjs                                 |

---

## Project Structure

```
src/
├── main.tsx                    # Entry — imports Quill CSS then app CSS
├── App.tsx                     # Router + QueryClient + AppBootstrap
├── index.css                   # Tailwind v4 + oklch theme variables
├── styles/
│   └── quill-overrides.css     # Quill Snow theme overrides
│
├── types/
│   └── index.ts                # All TypeScript interfaces
│
├── lib/
│   ├── utils.ts                # cn(), fromNow(), REACTION_EMOJI, uploadToCloudinary
│   └── queryClient.ts          # TanStack QueryClient singleton
│
├── services/
│   ├── api.ts                  # Axios instance + 401 refresh interceptor
│   └── apiServices.ts          # All typed API functions
│
├── stores/
│   ├── authStore.ts            # User + accessToken (in-memory)
│   ├── notificationStore.ts    # Unread count + realtime list
│   ├── socketStore.ts          # Socket.io instance
│   └── presenceStore.ts        # Online user IDs (Set)
│
├── hooks/
│   ├── useBootstrap.ts         # Session restore on page reload
│   ├── useAuth.ts              # Login / logout with side effects
│   ├── useSocket.ts            # All socket event listeners
│   ├── usePresence.ts          # Batch online-status check
│   ├── useInfiniteScroll.ts    # IntersectionObserver → fetchNextPage
│   └── useDebounce.ts          # Debounce a value by N ms
│
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── VerifyEmailPage.tsx
│   │   └── ForgotPasswordPage.tsx  # 3-step: email → OTP → new password
│   ├── FeedPage.tsx
│   ├── ProfilePage.tsx
│   ├── FriendsPage.tsx
│   ├── NotificationsPage.tsx
│   ├── PostDetailPage.tsx          # Real-time post room events
│   ├── SettingsPage.tsx
│   └── NotFoundPage.tsx
│
└── components/
    ├── layout/
    │   ├── MainLayout.tsx          # Navbar + 3-column grid
    │   ├── Navbar.tsx              # Search, notifications, avatar menu
    │   ├── LeftSidebar.tsx         # Nav links + unread badges
    │   └── RightSidebar.tsx        # Friend suggestions + online dots
    │
    ├── post/
    │   ├── PostCard.tsx            # compact / full variant
    │   ├── PostCardHeader.tsx      # Avatar, privacy icon, 3-dot menu
    │   ├── PostCardMedia.tsx       # 1/2/3/4+ image grid
    │   ├── PostCardReactionBar.tsx # Optimistic reaction toggle
    │   ├── PostEditor.tsx          # QuillJS rich-text editor
    │   ├── CreatePostDialog.tsx    # New post with Cloudinary upload
    │   ├── EditPostDialog.tsx      # Edit content + privacy
    │   ├── MediaUploadZone.tsx     # Drag-drop + per-file progress
    │   └── ReactionPicker.tsx      # 6-emoji hover popup
    │
    ├── comment/
    │   ├── CommentSection.tsx      # Infinite scroll, reply state
    │   ├── CommentItem.tsx         # Bubble + edit + delete
    │   ├── ReplyList.tsx           # Replies with border-left visual
    │   └── CommentInput.tsx        # Auto-resize textarea
    │
    ├── profile/
    │   ├── ProfileCover.tsx        # Cover photo + upload
    │   ├── ProfileInfo.tsx         # Avatar, name, counters, actions
    │   ├── ProfileTabs.tsx         # Tab switcher
    │   └── tabs/
    │       ├── ProfilePostsTab.tsx
    │       ├── ProfilePhotosTab.tsx    # Photo grid with lightbox
    │       ├── ProfileFriendsTab.tsx
    │       ├── ProfileFollowersTab.tsx
    │       ├── ProfileFollowingTab.tsx
    │       └── ProfileStoriesTab.tsx   # Own stories (delete) + friend stories (view)
    │
    ├── story/
    │   ├── StoriesBar.tsx          # Horizontal scroll with online dots
    │   ├── StoryBubble.tsx         # Avatar with gradient ring
    │   ├── StoryProgress.tsx       # N-segment progress bar
    │   ├── StoryViewer.tsx         # Fullscreen, auto-advance, tap zones
    │   └── AddStoryDialog.tsx      # File pick → 9:16 preview → upload
    │
    ├── friend/
    │   ├── FriendCard.tsx          # Friend + Request + Suggestion cards
    │   └── FriendshipButton.tsx    # Status-aware action button
    │
    ├── notification/
    │   ├── NotificationItem.tsx    # Click → mark read + navigate
    │   └── NotificationDropdown.tsx# Preview 5 in Navbar
    │
    └── shared/
        ├── ProtectedRoute.tsx      # + GuestRoute
        ├── UserAvatar.tsx          # Image or initials fallback + story ring
        ├── OnlineBadge.tsx         # Green dot from presenceStore
        ├── ImageLightbox.tsx       # Fullscreen viewer, keyboard nav
        └── SkeletonCard.tsx        # Loading skeletons
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- The backend server running at `http://localhost:3000`
- A Cloudinary account (unsigned upload preset)

### Installation

```bash
cd frontend
npm install
```

### Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
```

### Run Development Server

```bash
npm run dev
```

App starts at `http://localhost:5173`.

### Build for Production

```bash
npm run build
npm run preview
```

---

## Key Features

### Authentication

- **Session restore on reload** — `useBootstrap` calls `POST /auth/refresh` on mount. If the httpOnly refresh-token cookie is valid, the access token and user are restored without showing the login page.
- **Auto-refresh interceptor** — Axios queues all requests that receive a 401, refreshes the token once, then replays the queue.
- **Redirect-after-login** — `ProtectedRoute` saves `location.state.from`. After login, the user is returned to the page they were trying to visit.

### Real-time (Socket.io)

Handled in `useSocket` (mounted once in `App.tsx`):

| Event                          | Action                                      |
| ------------------------------ | ------------------------------------------- |
| `new_notification`             | Increment badge, show toast                 |
| `friend_request`               | Increment friend badge, invalidate requests |
| `friend_accepted`              | Show toast, invalidate friends list         |
| `user:online` / `user:offline` | Update `presenceStore`                      |
| `post:reaction`                | Sync `likesCount` for other viewers         |
| `post:updated`                 | Update content/privacy in all caches        |
| `post:deleted`                 | Remove from feed, navigate away             |
| `post:new_comment`             | Append to comment list                      |
| `post:new_reply`               | Invalidate reply list                       |
| `post:comment_updated`         | Invalidate affected list                    |
| `post:comment_deleted`         | Invalidate + decrement count                |

### Online Presence

- `presenceStore` (Zustand Set) tracks online user IDs.
- `usePresence(userIds[])` — emits `presence:check` to get current status of a batch of users.
- `OnlineBadge` — green dot that reads from `presenceStore`, renders `null` when offline.
- Used in: **FriendCard**, **FriendRequestCard**, **StoriesBar** bubbles, **RightSidebar** suggestions, **ProfileInfo** avatar.

### Cursor Pagination + Infinite Scroll

- All lists use TanStack Query `useInfiniteQuery` with `initialPageParam: undefined as string | undefined`.
- `useInfiniteScroll` — `IntersectionObserver` on a sentinel `<div>` at the bottom of each list triggers `fetchNextPage`.

### Media Upload

- `useCloudinaryUpload` hook — uploads files directly to Cloudinary via `XMLHttpRequest` (supports upload progress).
- `MediaUploadZone` — drag-drop zone with per-file progress bar, error overlay, and "Add more" button.
- File limits: images ≤ 50 MB, videos ≤ 100 MB, max 10 files per post.

### Rich Text Editor (QuillJS)

- Toolbar: Bold · Italic · Underline · Strike · Link · Blockquote · Lists · Clean
- Character limit: 5000
- Dynamically imported to reduce initial bundle size.
- CSS overrides in `src/styles/quill-overrides.css` match the app's oklch design tokens.

---

## State Management

| Store               | Purpose                                           |
| ------------------- | ------------------------------------------------- |
| `authStore`         | `user`, `accessToken`, `isAuthenticated`          |
| `socketStore`       | Socket.io instance, connect / disconnect          |
| `notificationStore` | Unread count, friend request count, realtime list |
| `presenceStore`     | Set of online user IDs                            |

Access tokens live **only in memory** (Zustand). Refresh tokens live in an **httpOnly cookie** — invisible to JavaScript, safe from XSS.

---

## Theme

The app uses **oklch CSS variables** defined in `src/index.css`. The colour palette is an indigo-blue social theme with proper dark mode support.

```css
/* Light */
--primary: oklch(0.52 0.22 264); /* indigo */
--background: oklch(0.98 0.004 264);

/* Dark */
--primary: oklch(0.65 0.22 264);
--background: oklch(0.12 0.02 264);
```

---

## NPM Scripts

```bash
npm run dev       # Vite dev server with HMR
npm run build     # Type-check + Vite production build
npm run preview   # Preview production build locally
npm run lint      # ESLint
npm run format    # Prettier
```
