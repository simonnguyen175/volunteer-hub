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
		success: <IconCheck size={18} stroke={3} />,
		error: <IconX size={18} stroke={3} />,
		warning: <IconAlertTriangle size={18} stroke={2.5} />,
		info: <IconInfoCircle size={18} stroke={2.5} />,
	};

	// Using the site's theme (Olive/Crimson/Gray) with softer backgrounds
	const styles = {
		success: {
			border: "border-[#556b2f]/20",
			bg: "bg-[#fcfdfa]",
			text: "text-gray-800",
			iconBg: "bg-[#556b2f]",
			iconText: "text-white",
			accent: "bg-[#556b2f]"
		},
		error: {
			border: "border-red-200/60",
			bg: "bg-[#fffafa]",
			text: "text-gray-800",
			iconBg: "bg-red-500",
			iconText: "text-white",
			accent: "bg-red-500"
		},
		warning: {
			border: "border-amber-200/60",
			bg: "bg-[#fffdf5]",
			text: "text-gray-800",
			iconBg: "bg-amber-400",
			iconText: "text-amber-900",
			accent: "bg-amber-400"
		},
		info: {
			border: "border-gray-200/60",
			bg: "bg-[#fafafa]",
			text: "text-gray-800",
			iconBg: "bg-gray-700",
			iconText: "text-white",
			accent: "bg-gray-700"
		},
	};

	const currentStyle = styles[toast.type];

	return (
		<div
			className={`relative overflow-hidden flex items-center gap-3 pl-4 pr-3 py-3.5 rounded-lg border shadow-lg shadow-gray-200/40 transition-all duration-500 ease-out group min-w-[300px] ${currentStyle.bg} ${currentStyle.border} ${
				isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8 scale-95"
			}`}
		>
			{/* Left accent line */}
			<div className={`absolute top-0 left-0 w-1 h-full ${currentStyle.accent}`} />

			<div className={`p-1.5 rounded-full shrink-0 ${currentStyle.iconBg} ${currentStyle.iconText}`}>
				{icons[toast.type]}
			</div>
			
			<p className="font-(family-name:--font-dmsans) font-medium text-sm flex-1 leading-snug tracking-wide">
				{toast.message}
			</p>
			
			<button
				onClick={() => {
					setIsVisible(false);
					setTimeout(() => onRemove(toast.id), 300);
				}}
				className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors opacity-0 group-hover:opacity-100"
			>
				<IconX size={14} />
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
