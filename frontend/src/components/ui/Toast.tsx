import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { IconCheck, IconX, IconAlertTriangle, IconInfoCircle } from "@tabler/icons-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
	id: string;
	message: string;
	type: ToastType;
}

interface ToastContextType {
	showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToast must be used within a ToastProvider");
	}
	return context;
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		// Trigger enter animation
		requestAnimationFrame(() => setIsVisible(true));

		// Auto-remove after 4 seconds
		const timer = setTimeout(() => {
			setIsVisible(false);
			setTimeout(() => onRemove(toast.id), 300);
		}, 4000);

		return () => clearTimeout(timer);
	}, [toast.id, onRemove]);

	const icons = {
		success: <IconCheck size={20} />,
		error: <IconX size={20} />,
		warning: <IconAlertTriangle size={20} />,
		info: <IconInfoCircle size={20} />,
	};

	const colors = {
		success: "bg-green-50 border-green-200 text-green-800",
		error: "bg-red-50 border-red-200 text-red-800",
		warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
		info: "bg-blue-50 border-blue-200 text-blue-800",
	};

	const iconColors = {
		success: "text-green-500 bg-green-100",
		error: "text-red-500 bg-red-100",
		warning: "text-yellow-500 bg-yellow-100",
		info: "text-blue-500 bg-blue-100",
	};

	return (
		<div
			className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg transition-all duration-300 ${colors[toast.type]} ${
				isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
			}`}
		>
			<div className={`p-1.5 rounded-full ${iconColors[toast.type]}`}>
				{icons[toast.type]}
			</div>
			<p className="font-medium text-sm flex-1">{toast.message}</p>
			<button
				onClick={() => {
					setIsVisible(false);
					setTimeout(() => onRemove(toast.id), 300);
				}}
				className="p-1 hover:bg-black/5 rounded-full transition-colors"
			>
				<IconX size={16} />
			</button>
		</div>
	);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const showToast = useCallback((message: string, type: ToastType = "info") => {
		const id = Date.now().toString();
		setToasts((prev) => [...prev, { id, message, type }]);
	}, []);

	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	return (
		<ToastContext.Provider value={{ showToast }}>
			{children}
			{/* Toast Container */}
			<div className="fixed top-24 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
				{toasts.map((toast) => (
					<ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
				))}
			</div>
		</ToastContext.Provider>
	);
}
