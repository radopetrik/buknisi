export const priceTypes = ["fixed", "free", "dont_show", "starts_at"] as const;

export type ServiceCategory = { id: string; name: string };
export type SubCategoryOption = { id: string; label: string };

export type Service = {
  id: string;
  name: string;
  price: number;
  price_type: (typeof priceTypes)[number];
  duration: number;
  service_category_id: string | null;
  sub_category_id: string | null;
  is_mobile: boolean;
};

export type Addon = {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string | null;
};

export type ServiceAddonLink = { service_id: string; addon_id: string };
