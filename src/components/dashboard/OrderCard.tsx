// src/components/dashboard/OrderCard.tsx
import type { Order } from '../../types';
import { PlayCircle, CheckCheck, Siren } from 'lucide-react';

interface OrderCardProps {
  order: Order;
  onStartPreparing: (id: string) => void;
  onDone: (id: string) => void;
}

const serviceConfig = {
    'UberEats': { brandClass: 'bg-[#06C167] text-white', icon: 'U' },
    'DoorDash': { brandClass: 'bg-[#FF3008] text-white', icon: 'D' },
    'SkipTheDishes': { brandClass: 'bg-[#F78121] text-white', icon: 'S' }
};

export function OrderCard({ order, onStartPreparing, onDone }: OrderCardProps) {
  const config = serviceConfig[order.service];

  const urgencyClasses = order.isUrgent
    ? 'shadow-[0_0_0_3px_#FBBF24,0_0_15px_rgba(251,191,36,0.7)] animate-[pulse_1.5s_infinite]'
    : '';

  return (
    <div className={`bg-gray-700 rounded-lg p-4 shadow-lg border border-gray-600 transition-all hover:bg-gray-600 ${urgencyClasses}`}>
      <div className="relative">
        {order.isUrgent && (
          <div className="absolute -top-6 -right-6 flex items-center bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-lg">
            <Siren className="w-4 h-4 mr-1" />
            URGENT
          </div>
        )}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
            <span className={`${config.brandClass} rounded-md h-10 w-10 flex items-center justify-center font-bold text-lg`}>{config.icon}</span>
            <div>
              <span className="font-bold text-lg text-white">{order.service}</span>
              <div className="text-xs text-gray-400">#{order.displayId} &bull; {order.time}</div>
            </div>
          </div>
        </div>
       <ul className="space-y-2 mb-4 border-t border-gray-500 pt-3">
          {order.items.map((item, index) => (
            <li key={index} className="text-gray-300">
              {/* Main Item */}
              <div className="flex items-center">
                <span className="font-bold text-lg mr-3">{item.quantity}x</span>
                <span className="text-white">{item.name}</span>
              </div>
              
              {/* Modifiers List */}
              {item.modifiers && item.modifiers.length > 0 && (
                <ul className="pl-9 mt-1 space-y-0.5">
                  {item.modifiers.map((mod, modIndex) => (
                    <li key={modIndex} className="text-sm text-gray-400 flex items-center">
                      <span className="mr-2">&bull;</span>
                      {mod.quantity > 1 && (
                        <span className="font-medium mr-1.5">{mod.quantity}x</span>
                      )}
                      <span>{mod.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
        <div className="flex gap-2 justify-end border-t border-gray-500 pt-3">
          {order.state === 'queue' && (
            <button onClick={() => onStartPreparing(order.id)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
              Start Preparing <PlayCircle className="w-5 h-5" />
            </button>
          )}
          {order.state === 'preparing' && (
            <button onClick={() => onDone(order.id)} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
              Done <CheckCheck className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
