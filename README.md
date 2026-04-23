# Calendar Mr Dũng

Web app lịch trình cho sếp, tách rõ `admin` và `boss view`.

- Admin: đăng nhập để thêm/sửa/xóa lịch, upload tài liệu, xuất Excel
- Boss: chỉ xem lịch và tài liệu, không đăng nhập

## 1. Stack công nghệ

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Supabase (Postgres, Auth, RLS, Storage)
- Deploy: Vercel

## 2. Luồng route hiện tại

- `/` -> redirect sang `/admin/login` (entry chính cho admin)
- `/admin/login` -> trang đăng nhập admin
- `/admin` -> trang quản trị lịch (bắt buộc đăng nhập)
- `/boss` -> trang xem lịch cho sếp (không login)

## 3. Phân quyền

- Public/Boss:
  - Không đăng nhập
  - Được đọc `events` và `event_attachments`
  - Không có quyền ghi dữ liệu
- Admin:
  - Đăng nhập Supabase Auth
  - Chỉ user có trong `public.admin_users` mới được `insert/update/delete`
  - Upload/xóa file trong bucket `event-documents`

## 4. Cấu trúc thư mục chính

```text
.
├── supabase
│   ├── schema.sql
│   ├── policies.sql
│   ├── seed.sql
│   └── migrations
│       ├── 20260422_add_event_detail_columns.sql
│       ├── 20260422_create_event_attachments.sql
│       └── 20260422_create_event_documents_bucket.sql
├── src
│   ├── app
│   │   ├── page.tsx                # redirect admin login
│   │   ├── boss/page.tsx           # trang sếp
│   │   └── admin
│   │       ├── login/page.tsx
│   │       └── page.tsx
│   ├── components
│   │   ├── admin
│   │   ├── public
│   │   ├── calendar
│   │   ├── events
│   │   └── ui
│   ├── features
│   │   ├── events
│   │   └── attachments
│   ├── supabase
│   ├── services
│   ├── hooks
│   └── lib
├── middleware.ts                    # chặn /admin nếu chưa login
├── next.config.mjs
└── .env.example
```

## 5. Cài đặt local

1. Cài package:

```bash
npm install
```

2. Tạo env:

```bash
cp .env.example .env.local
```

3. Điền biến môi trường:

- `NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>`
- `SUPABASE_SERVICE_ROLE_KEY=<service_role_key>`

Lưu ý:
- Không dùng URL dạng `/rest/v1/` cho `NEXT_PUBLIC_SUPABASE_URL`.

4. Chạy SQL theo thứ tự trong Supabase SQL Editor:

```text
supabase/schema.sql
supabase/policies.sql
supabase/migrations/20260422_add_event_detail_columns.sql
supabase/migrations/20260422_create_event_attachments.sql
supabase/migrations/20260422_create_event_documents_bucket.sql
supabase/seed.sql
```

5. Tạo user admin ở Supabase Auth.

6. Map admin vào bảng `admin_users`:

```sql
insert into public.admin_users (user_id)
values ('<AUTH_USER_UUID>');
```

7. Chạy local:

```bash
npm run dev
```

## 6. Mô hình dữ liệu

### Bảng `events`

- Core lịch: `title`, `date`, `start_time`, `end_time`, `location`, `description`
- Ưu tiên/hiển thị: `category`, `color`
- Cột chi tiết: `owner`, `deadline`, `status`, `result`, `notes`
- Audit: `created_by`, `created_at`, `updated_at`

### Bảng `event_attachments`

- `event_id` liên kết sang `events`
- `file_name`, `file_path`, `file_size`, `mime_type`
- `created_by`, `created_at`

### Storage

- Bucket: `event-documents` (public)
- Cho phép upload các loại: `pdf, doc, docx, xls, xlsx, png, jpg, jpeg`
- Giới hạn app: tối đa 5 file/lịch, tối đa 10MB/file

## 7. Chức năng hiện có

- Trang admin:
  - Thêm/sửa/xóa lịch
  - Dropdown trạng thái: `Mới`, `Đang xử lý`, `Hoàn thành`
  - Upload/xóa tài liệu trong popup lịch
  - Xem chi tiết theo tuần `W1..W5`
  - Filter theo tháng + khoảng ngày
  - Xuất file Excel `.xlsx` theo dữ liệu đã lọc
- Trang sếp (`/boss`):
  - Xem lịch tháng + chi tiết theo ngày
  - Xem tóm tắt công việc
  - Hiển thị tài liệu gọn theo từng lịch

## 8. Deploy Vercel (nhánh chính: `hdi-calendar`)

1. Vào Vercel `Project Settings -> Git`.
2. Đặt `Production Branch = hdi-calendar`.
3. Set env vars giống `.env.local`.
4. Redeploy.
5. Verify sau deploy:
   - `/admin/login` vào được
   - `/admin` cần login
   - `/boss` xem được lịch
   - Admin thêm lịch + upload file + xuất `.xlsx` chạy được

### Nếu gặp lỗi `Cannot read properties of undefined (reading 'fsPath')`

- Kiểm tra log dòng `Branch` và `Commit` trong deployment.
- Đảm bảo Vercel đang build đúng `hdi-calendar` với commit mới, không phải commit cũ `045244`.
- Trigger redeploy sau khi xác nhận branch/commit.

## 9. Bàn giao vận hành

- Mọi thao tác code/deploy hiện theo nhánh `hdi-calendar`.
- Không đổi schema ngoài các file SQL trong `supabase/` và `supabase/migrations/`.
- Khi phát sinh lỗi CRUD do RLS, kiểm tra đầu tiên là `public.admin_users` có mapping đúng UID admin hay chưa.
