import { useState, useEffect, useCallback } from "react";
import { IconAlertTriangle, IconX } from "@tabler/icons-react";

interface ConfirmDialogProps {
	isOpen: boolean;
	title?: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	variant?: "danger" | "warning" | "info";
	onConfirm: () => void;
	onCancel: () => void;
}

export function ConfirmDialog({
	isOpen,
	title = "Confirm Action",
	message,
	confirmText = "Confirm",
	cancelText = "Cancel",
	variant = "danger",
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	const [isAnimating, setIsAnimating] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setIsAnimating(true);
		}
	}, [isOpen]);

	const handleClose = useCallback(() => {
		setIsAnimating(false);
		setTimeout(() => {
			onCancel();
		}, 200);
	}, [onCancel]);

	const handleConfirm = useCallback(() => {
		setIsAnimating(false);
		setTimeout(() => {
			onConfirm();
		}, 200);
	}, [onConfirm]);

	// Handle escape key
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen) {
				handleClose();
			}
		};
		window.addEventListener("keydown", handleEscape);
		return () => window.removeEventListener("keydown", handleEscape);
	}, [isOpen, handleClose]);

	if (!isOpen) return null;

	const variantStyles = {
		danger: {
			icon: "bg-red-100 text-red-600",
			button: "bg-red-500 hover:bg-red-600 focus:ring-red-500",
			iconColor: "text-red-600",
		},
		warning: {
			icon: "bg-amber-100 text-amber-600",
			button: "bg-amber-500 hover:bg-amber-600 focus:ring-amber-500",
			iconColor: "text-amber-600",
		},
		info: {
			icon: "bg-[#556b2f]/10 text-[#556b2f]",
			button: "bg-[#556b2f] hover:bg-[#6d8c3a] focus:ring-[#556b2f]",
			iconColor: "text-[#556b2f]",
		},
	};

	const styles = variantStyles[variant];

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto">
			{/* Backdrop */}
			<div
				className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
					isAnimating ? "opacity-100" : "opacity-0"
				}`}
				onClick={handleClose}
			/>

			{/* Dialog */}
			<div className="flex min-h-full items-center justify-center p-4">
				<div
					className={`relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-200 ${
						isAnimating
							? "opacity-100 scale-100 translate-y-0"
							: "opacity-0 scale-95 translate-y-4"
					}`}
				>
					{/* Close button */}
					<button
						onClick={handleClose}
						className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
					>
						<IconX size={20} />
					</button>

					<div className="p-6">
						{/* Icon */}
						<div className="flex items-center justify-center mb-4">
							<div className={`p-3 rounded-full ${styles.icon}`}>
								<IconAlertTriangle size={28} className={styles.iconColor} />
							</div>
						</div>

						{/* Title */}
						<h3 className="text-xl font-bold text-center text-gray-900 mb-2 font-(family-name:--font-crimson)">
							{title}
						</h3>

						{/* Message */}
						<p className="text-center text-gray-600 mb-6 font-(family-name:--font-dmsans) leading-relaxed">
							{message}
						</p>

						{/* Buttons */}
						<div className="flex gap-3">
							<button
								onClick={handleClose}
								className="flex-1 px-4 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold font-(family-name:--font-dmsans) hover:bg-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
							>
								{cancelText}
							</button>
							<button
								onClick={handleConfirm}
								className={`flex-1 px-4 py-3 rounded-xl text-white font-semibold font-(family-name:--font-dmsans) transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.button}`}
							>
								{confirmText}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

// Hook for easier usage
interface UseConfirmDialogOptions {
	title?: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	variant?: "danger" | "warning" | "info";
}

interface UseConfirmDialogReturn {
	isOpen: boolean;
	confirm: (options: UseConfirmDialogOptions) => Promise<boolean>;
	ConfirmDialogComponent: React.FC;
}

export function useConfirmDialog(): UseConfirmDialogReturn {
	const [isOpen, setIsOpen] = useState(false);
	const [options, setOptions] = useState<UseConfirmDialogOptions | null>(null);
	const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

	const confirm = useCallback((opts: UseConfirmDialogOptions): Promise<boolean> => {
		setOptions(opts);
		setIsOpen(true);
		return new Promise((resolve) => {
			setResolveRef(() => resolve);
		});
	}, []);

	const handleConfirm = useCallback(() => {
		setIsOpen(false);
		resolveRef?.(true);
		setResolveRef(null);
	}, [resolveRef]);

	const handleCancel = useCallback(() => {
		setIsOpen(false);
		resolveRef?.(false);
		setResolveRef(null);
	}, [resolveRef]);

	const ConfirmDialogComponent: React.FC = useCallback(
		() =>
			options ? (
				<ConfirmDialog
					isOpen={isOpen}
					title={options.title}
					message={options.message}
					confirmText={options.confirmText}
					cancelText={options.cancelText}
					variant={options.variant}
					onConfirm={handleConfirm}
					onCancel={handleCancel}
				/>
			) : null,
		[isOpen, options, handleConfirm, handleCancel]
	);

	return {
		isOpen,
		confirm,
		ConfirmDialogComponent,
	};
}
