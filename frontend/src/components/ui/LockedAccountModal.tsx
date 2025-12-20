import { IconAlertTriangle } from "@tabler/icons-react";

interface LockedAccountModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function LockedAccountModal({ isOpen, onClose }: LockedAccountModalProps) {
	if (!isOpen) return null;

	return (
		<>
			{/* Dark overlay */}
			<div
				className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1100]"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[1101] w-full max-w-md animate-(--animate-fade-up)">
				<div className="bg-white rounded-2xl shadow-2xl p-8 mx-4">
					{/* Warning Icon */}
					<div className="flex justify-center mb-6">
						<div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
							<IconAlertTriangle size={48} className="text-red-600" />
						</div>
					</div>

					{/* Title */}
					<h2 className="text-2xl font-bold text-center text-gray-900 mb-4 font-(family-name:--font-crimson)">
						Account Locked
					</h2>

					{/* Message */}
					<p className="text-center text-gray-600 mb-8 leading-relaxed">
						Your account has been locked. If you think this is a mistake, please contact admin at{" "}
						<a 
							href="mailto:admin@admin.com" 
							className="text-[#556b2f] font-semibold hover:underline"
						>
							admin@admin.com
						</a>
					</p>

					{/* OK Button */}
					<button
						onClick={onClose}
						className="w-full py-3 bg-[#556b2f] text-white font-semibold rounded-xl hover:bg-[#6d8c3a] transition-colors"
					>
						OK
					</button>
				</div>
			</div>
		</>
	);
}
