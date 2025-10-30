// src/types/index.ts
export interface OrderItem {
  name: string;
  quantity: number;
  modifiers?: Modifier[]; // Add this if you want to show modifiers
}

export type OrderService = 'UberEats' | 'DoorDash' | 'SkipTheDishes';
export type OrderState = 'queue' | 'preparing';

// This interface has been updated to match the data structure from your backend
export interface Order {
  id: string; // Changed from number to string to match OrderID
  displayId: string;
  service: OrderService;
  time: string;
  items: OrderItem[];
  state: OrderState;
  isUrgent: boolean;
  specialInstructions?: string; // Add this

}

export interface Modifier {
  name: string;
  quantity: number;
}