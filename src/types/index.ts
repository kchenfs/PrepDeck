// src/types/index.ts
export interface OrderItem {
  name: string;
  quantity: number;
}

export type OrderService = 'UberEats' | 'DoorDash' | 'SkipTheDishes';
export type OrderState = 'queue' | 'preparing';

export interface Order {
  id: number;
  displayId: string;
  service: OrderService;
  time: string;
  items: OrderItem[];
  state: OrderState;
  isUrgent: boolean;
}
