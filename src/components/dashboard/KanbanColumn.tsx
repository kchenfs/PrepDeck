// src/components/dashboard/KanbanColumn.tsx
import { OrderCard } from './OrderCard';
import type { Order } from '../../types';

interface KanbanColumnProps {
  title: string;
  icon: React.ReactNode;
  orders: Order[];
  onStartPreparing: (id: string) => void;
  onDone: (id: string) => void;
}

export function KanbanColumn({ title, icon, orders, onStartPreparing, onDone }: KanbanColumnProps) {
  return (
    <div>
      <h2 className="flex items-center gap-2 text-xl font-semibold mb-4 pb-2 border-b-2 border-blue-500">
        {icon}
        {title}
      </h2>
      <div className="kanban-column space-y-4 p-2 bg-gray-800 rounded-lg overflow-y-auto min-h-[80vh]">
        {orders.map(order => (
          <OrderCard key={order.id} order={order} onStartPreparing={onStartPreparing} onDone={onDone} />
        ))}
      </div>
    </div>
  );
}
