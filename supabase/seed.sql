insert into public.events
  (title, date, start_time, end_time, location, description, category, color)
values
  (
    'Họp chiến lược quý',
    current_date + 1,
    '09:00',
    '10:30',
    'Phòng họp tầng 8',
    'Review KPI và kế hoạch quý tiếp theo',
    'meeting',
    '#047857'
  ),
  (
    'Làm việc với đối tác bảo hiểm',
    current_date + 1,
    '14:00',
    '15:30',
    'Văn phòng HDI',
    'Trao đổi hợp tác sản phẩm mới',
    'client',
    '#0ea5e9'
  ),
  (
    'Đi công tác Hà Nội',
    current_date + 3,
    '08:30',
    '12:00',
    'Sân bay Nội Bài',
    'Gặp khách hàng doanh nghiệp',
    'business_trip',
    '#7c3aed'
  );
