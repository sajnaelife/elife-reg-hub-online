export interface CategoryData {
  name: string;
  actual_fee: string;
  offer_fee: string;
  popup_image_url: string;
  qr_image_url: string;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  actual_fee: number;
  offer_fee: number;
  popup_image_url: string | null;
  qr_image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}