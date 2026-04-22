export interface EventAttachmentRecord {
  id: string;
  event_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_by: string | null;
  created_at: string;
}
