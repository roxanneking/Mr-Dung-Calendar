# Calendar Mr Dũng

Web app lịch trình cho sếp với 2 khu vực tách biệt:

- Public: không đăng nhập, chỉ xem lịch (`/`)
- Admin: bắt buộc đăng nhập, chỉ admin thêm/sửa/xóa (`/admin`)

Stack:

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase (Postgres + Auth + RLS)
- Deploy: Vercel

## 1. Kiến trúc thư mục

```text
.
├── supabase
│   ├── schema.sql            # Tạo bảng, index, trigger
│   ├── policies.sql          # RLS policies
│   └── seed.sql              # Dữ liệu mẫu
├── src
│   ├── app
│   │   ├── page.tsx          # Public page (xem lịch)
│   │   ├── admin
│   │   │   ├── login/page.tsx# Admin login
│   │   │   └── page.tsx      # Admin dashboard CRUD
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components
│   │   ├── public            # UI public view
│   │   ├── admin             # UI admin CRUD
│   │   ├── calendar          # Month calendar
│   │   ├── events            # Day event panel
│   │   └── ui                # Base reusable components
│   ├── features
│   │   └── events
│   │       ├── types.ts
│   │       ├── constants.ts
│   │       ├── utils.ts
│   │       └── services/events.service.ts
│   ├── services
│   │   └── auth.service.ts
│   ├── hooks
│   │   └── use-toast.tsx
│   ├── supabase
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   └── lib
│       └── utils.ts
├── middleware.ts             # Chặn route /admin nếu chưa login
└── .env.example
```

## 2. Luồng phân quyền

- Public user:
  - Không đăng nhập
  - Truy cập `/` xem lịch
  - Chỉ có quyền `SELECT` trên bảng `events` qua RLS
- Admin/employee:
  - Đăng nhập tại `/admin/login`
  - Vào `/admin` để CRUD
  - Chỉ user có trong `admin_users` mới có quyền `INSERT/UPDATE/DELETE`

## 3. Cài đặt local

1. Cài dependencies:

```bash
npm install
```

2. Tạo file môi trường:

```bash
cp .env.example .env.local
```

3. Điền giá trị:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (dự phòng cho tác vụ server-side đặc biệt)

4. Chạy SQL trong Supabase SQL Editor theo thứ tự:

- `supabase/schema.sql`
- `supabase/policies.sql`
- `supabase/seed.sql`

5. Tạo tài khoản admin trong Supabase Auth (Email/Password).

6. Thêm user admin vào bảng `public.admin_users`:

```sql
insert into public.admin_users (user_id)
values ('<AUTH_USER_UUID>');
```

7. Chạy app:

```bash
npm run dev
```

## 4. SQL tóm tắt

### Bảng `events`

- `id`
- `title`
- `date`
- `start_time`
- `end_time`
- `location`
- `description`
- `category`
- `color`
- `created_by`
- `created_at`
- `updated_at`

### RLS policies

- Public read: cho phép `anon` và `authenticated` đọc lịch
- Write protection: chỉ `authenticated` và có mapping trong `admin_users` mới được `insert/update/delete`
- Route protection: middleware chặn truy cập `/admin` nếu chưa login

## 5. Deploy Vercel

1. Push source lên Git.
2. Import project vào Vercel.
3. Set env vars giống `.env.local`.
4. Deploy.
5. Kiểm tra:
   - `/` mở trực tiếp lịch, không login
   - `/admin` chưa login phải bị chuyển về `/admin/login`
   - login admin thành công thì CRUD bình thường

## 6. Ghi chú bảo trì

- Dự án ưu tiên free-tier, đơn giản, dễ maintain.
- Không dùng backend riêng: dùng Supabase + RLS để chặn trực tiếp ở data layer.
- UI public không chứa bất kỳ nút quản trị nào.
