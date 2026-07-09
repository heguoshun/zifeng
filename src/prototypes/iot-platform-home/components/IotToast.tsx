import React from 'react';
import { AlertTriangle, CircleCheck } from 'lucide-react';

export type IotToastType = 'warning' | 'success';

export type IotToastData = {
    message: string;
    type: IotToastType;
};

export function triggerIotToast(
    setter: React.Dispatch<React.SetStateAction<IotToastData | null>>,
    message: string,
    type: IotToastType = 'warning',
) {
    setter({ message, type });
    window.setTimeout(() => setter(null), 2200);
}

export default function IotToast({ toast }: { toast: IotToastData | null }) {
    if (!toast) return null;

    const Icon = toast.type === 'success' ? CircleCheck : AlertTriangle;

    return (
        <div className={`iot-toast iot-toast--${toast.type}`} role="status">
            <Icon size={16} className="iot-toast__icon" aria-hidden />
            <span>{toast.message}</span>
        </div>
    );
}
