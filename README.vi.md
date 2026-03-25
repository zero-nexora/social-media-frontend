# Social App — Frontend

Ứng dụng mạng xã hội phía client, xây dựng với **React 19**, **Vite 6**, **Tailwind CSS v4** và **Socket.io** cho các tính năng thời gian thực.

---

## Công nghệ sử dụng

| Danh mục | Công nghệ |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite 6 |
| Styling | Tailwind CSS v4 (cấu hình CSS-based) |
| Thư viện UI | shadcn/ui (Radix UI primitives) |
| Server state | TanStack Query v5 |
| Client state | Zustand v5 |
| Routing | React Router v7 |
| Form | React Hook Form + Zod |
| HTTP | Axios (có interceptor tự refresh token) |
| Real-time | Socket.io Client v4 |
| Soạn thảo văn bản | QuillJS |
| Toast | Sonner |
| Icons | Lucide React |
| Định dạng ngày | dayjs |

---

## Cấu trúc thư mục

```
src/
├── main.tsx                    # Entry — import Quill CSS rồi mới app CSS
├── App.tsx                     # Router + QueryClient + AppBootstrap
├── index.css                   # Tailwind v4 + biến màu oklch
├── styles/
│   └── quill-overrides.css     # Ghi đè giao diện Quill Snow
│
├── types/
│   └── index.ts                # Toàn bộ TypeScript interface
│
├── lib/
│   ├── utils.ts                # cn(), fromNow(), REACTION_EMOJI, uploadToCloudinary
│   └── queryClient.ts          # TanStack QueryClient singleton
│
├── services/
│   ├── api.ts                  # Axios instance + interceptor tự refresh 401
│   └── apiServices.ts          # Tất cả hàm gọi API có kiểu dữ liệu
│
├── stores/
│   ├── authStore.ts            # User + accessToken (lưu trong memory)
│   ├── notificationStore.ts    # Số chưa đọc + danh sách realtime
│   ├── socketStore.ts          # Instance Socket.io
│   └── presenceStore.ts        # Tập hợp userId đang online (Set)
│
├── hooks/
│   ├── useBootstrap.ts         # Khôi phục phiên khi reload trang
│   ├── useAuth.ts              # Login / logout với side effects
│   ├── useSocket.ts            # Tất cả listener sự kiện socket
│   ├── usePresence.ts          # Kiểm tra hàng loạt trạng thái online
│   ├── useInfiniteScroll.ts    # IntersectionObserver → fetchNextPage
│   └── useDebounce.ts          # Debounce giá trị theo thời gian
│
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── VerifyEmailPage.tsx
│   │   └── ForgotPasswordPage.tsx  # 3 bước: email → OTP → mật khẩu mới
│   ├── FeedPage.tsx
│   ├── ProfilePage.tsx
│   ├── FriendsPage.tsx
│   ├── NotificationsPage.tsx
│   ├── PostDetailPage.tsx          # Sự kiện realtime phòng bài viết
│   ├── SettingsPage.tsx
│   └── NotFoundPage.tsx
│
└── components/
    ├── layout/
    │   ├── MainLayout.tsx          # Navbar + lưới 3 cột
    │   ├── Navbar.tsx              # Tìm kiếm, thông báo, avatar menu
    │   ├── LeftSidebar.tsx         # Nav links + badge chưa đọc
    │   └── RightSidebar.tsx        # Gợi ý kết bạn + chấm online
    │
    ├── post/
    │   ├── PostCard.tsx            # Variant compact / full
    │   ├── PostCardHeader.tsx      # Avatar, icon quyền riêng tư, menu 3 chấm
    │   ├── PostCardMedia.tsx       # Lưới ảnh 1/2/3/4+
    │   ├── PostCardReactionBar.tsx # Toggle cảm xúc optimistic
    │   ├── PostEditor.tsx          # Soạn thảo văn bản với QuillJS
    │   ├── CreatePostDialog.tsx    # Tạo bài viết + upload Cloudinary
    │   ├── EditPostDialog.tsx      # Chỉnh sửa nội dung + quyền riêng tư
    │   ├── MediaUploadZone.tsx     # Kéo thả + thanh tiến trình mỗi file
    │   └── ReactionPicker.tsx      # Popup 6 emoji khi hover
    │
    ├── comment/
    │   ├── CommentSection.tsx      # Cuộn vô hạn, quản lý trả lời
    │   ├── CommentItem.tsx         # Bong bóng + sửa + xoá
    │   ├── ReplyList.tsx           # Danh sách trả lời với viền trái
    │   └── CommentInput.tsx        # Textarea tự co giãn
    │
    ├── profile/
    │   ├── ProfileCover.tsx        # Ảnh bìa + upload
    │   ├── ProfileInfo.tsx         # Avatar, tên, số đếm, nút hành động
    │   ├── ProfileTabs.tsx         # Điều hướng tab
    │   └── tabs/
    │       ├── ProfilePostsTab.tsx
    │       ├── ProfilePhotosTab.tsx    # Lưới ảnh với lightbox
    │       ├── ProfileFriendsTab.tsx
    │       ├── ProfileFollowersTab.tsx
    │       ├── ProfileFollowingTab.tsx
    │       └── ProfileStoriesTab.tsx   # Story của mình (xoá) + của bạn (xem)
    │
    ├── story/
    │   ├── StoriesBar.tsx          # Cuộn ngang với chấm online
    │   ├── StoryBubble.tsx         # Avatar với vòng gradient
    │   ├── StoryProgress.tsx       # Thanh tiến trình N đoạn
    │   ├── StoryViewer.tsx         # Toàn màn hình, tự động chuyển, vùng nhấn
    │   └── AddStoryDialog.tsx      # Chọn file → xem trước 9:16 → đăng
    │
    ├── friend/
    │   ├── FriendCard.tsx          # Card bạn bè, lời mời, gợi ý
    │   └── FriendshipButton.tsx    # Nút hành động theo trạng thái
    │
    ├── notification/
    │   ├── NotificationItem.tsx    # Click → đánh dấu đã đọc + điều hướng
    │   └── NotificationDropdown.tsx# Xem trước 5 thông báo ở Navbar
    │
    └── shared/
        ├── ProtectedRoute.tsx      # + GuestRoute
        ├── UserAvatar.tsx          # Ảnh hoặc fallback chữ cái + vòng story
        ├── OnlineBadge.tsx         # Chấm xanh đọc từ presenceStore
        ├── ImageLightbox.tsx       # Xem ảnh toàn màn hình, điều hướng bàn phím
        └── SkeletonCard.tsx        # Loading skeleton
```

---

## Hướng dẫn cài đặt

### Yêu cầu hệ thống

- Node.js ≥ 18
- Backend server đang chạy tại `http://localhost:3000`
- Tài khoản Cloudinary (unsigned upload preset)

### Cài đặt dependencies

```bash
cd frontend
npm install
```

### Biến môi trường

Tạo file `.env`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
VITE_CLOUDINARY_CLOUD_NAME=tên_cloud
VITE_CLOUDINARY_UPLOAD_PRESET=unsigned_preset
```

### Cài đặt Quill (trình soạn thảo)

```bash
npm install quill
npm install -D @types/quill
```

### Chạy server phát triển

```bash
npm run dev
```

Ứng dụng chạy tại `http://localhost:5173`.

### Build cho production

```bash
npm run build
npm run preview
```

---

## Tính năng chính

### Xác thực
- **Khôi phục phiên khi reload** — `useBootstrap` gọi `POST /auth/refresh` khi ứng dụng mount. Nếu cookie refresh token còn hạn, access token và user sẽ được khôi phục mà không cần đăng nhập lại.
- **Interceptor tự refresh** — Axios xếp hàng tất cả request nhận 401, refresh token một lần, sau đó replay lại toàn bộ hàng chờ.
- **Redirect sau đăng nhập** — `ProtectedRoute` lưu `location.state.from`. Sau khi đăng nhập, user được đưa về trang họ muốn vào.

### Real-time (Socket.io)
Được xử lý trong `useSocket` (mount một lần trong `App.tsx`):

| Sự kiện | Hành động |
|---|---|
| `new_notification` | Tăng badge, hiện toast |
| `friend_request` | Tăng badge bạn bè, làm mới danh sách lời mời |
| `friend_accepted` | Toast, làm mới danh sách bạn |
| `user:online` / `user:offline` | Cập nhật `presenceStore` |
| `post:reaction` | Đồng bộ `likesCount` cho người đang xem |
| `post:updated` | Cập nhật nội dung/quyền riêng tư trong cache |
| `post:deleted` | Xoá khỏi feed, điều hướng ra ngoài |
| `post:new_comment` | Thêm bình luận vào cuối danh sách |
| `post:new_reply` | Làm mới danh sách trả lời |
| `post:comment_updated` | Làm mới danh sách bị ảnh hưởng |
| `post:comment_deleted` | Làm mới + giảm số lượng |

### Trạng thái online
- `presenceStore` (Zustand Set) lưu trữ userId đang online.
- `usePresence(userIds[])` — emit `presence:check` để lấy trạng thái hiện tại của một loạt user.
- `OnlineBadge` — chấm xanh đọc từ `presenceStore`, trả về `null` khi offline.
- Được dùng ở: **FriendCard**, **FriendRequestCard**, **StoriesBar**, **RightSidebar**, **ProfileInfo**.

### Phân trang Cursor + Cuộn vô hạn
- Tất cả danh sách dùng TanStack Query `useInfiniteQuery` với `initialPageParam: undefined as string | undefined`.
- `useInfiniteScroll` — `IntersectionObserver` trên một sentinel `<div>` ở cuối danh sách kích hoạt `fetchNextPage`.

### Upload media
- Hook `useCloudinaryUpload` — upload file trực tiếp lên Cloudinary qua `XMLHttpRequest` (hỗ trợ thanh tiến trình theo từng file).
- `MediaUploadZone` — kéo thả với thanh tiến trình, overlay lỗi, nút thêm file.
- Giới hạn: ảnh ≤ 50 MB, video ≤ 100 MB, tối đa 10 file mỗi bài viết.

### Trình soạn thảo văn bản (QuillJS)
- Toolbar: Đậm · Nghiêng · Gạch chân · Gạch ngang · Link · Trích dẫn · Danh sách · Xoá định dạng
- Giới hạn 5000 ký tự
- Import động để giảm bundle size ban đầu
- CSS ghi đè trong `src/styles/quill-overrides.css` khớp với biến màu oklch của ứng dụng

---

## Quản lý state

| Store | Mục đích |
|---|---|
| `authStore` | `user`, `accessToken`, `isAuthenticated` |
| `socketStore` | Instance Socket.io, connect / disconnect |
| `notificationStore` | Số chưa đọc, số lời mời, danh sách realtime |
| `presenceStore` | Tập hợp userId đang online |

Access token chỉ tồn tại **trong memory** (Zustand). Refresh token nằm trong **httpOnly cookie** — JavaScript không thể đọc được, an toàn trước XSS.

---

## Chủ đề màu sắc

Ứng dụng dùng **biến CSS oklch** định nghĩa trong `src/index.css`. Bảng màu là indigo-blue phù hợp với mạng xã hội, hỗ trợ đầy đủ dark mode.

```css
/* Light */
--primary: oklch(0.52 0.22 264);    /* indigo */
--background: oklch(0.98 0.004 264);

/* Dark */
--primary: oklch(0.65 0.22 264);
--background: oklch(0.12 0.02 264);
```

---

## Lệnh NPM

```bash
npm run dev       # Vite dev server với HMR
npm run build     # Kiểm tra type + build production
npm run preview   # Xem trước bản build production
npm run lint      # ESLint
npm run format    # Prettier
```