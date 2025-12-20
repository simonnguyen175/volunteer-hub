import { IconUser } from "@tabler/icons-react";

interface EventDescriptionProps {
	description: string;
	requirements: string[];
	organizer: string;
}

export default function EventDescription({ description, organizer }: EventDescriptionProps) {
	return (
		<div className="space-y-8" style={{ animation: 'fadeIn 0.4s ease-out' }}>
			{/* Main Description Section */}
			<div>
				<h2 className="font-(family-name:--font-crimson) text-2xl font-bold mb-4 text-gray-900">
					About This Event
				</h2>
				<p className="text-gray-600 leading-relaxed font-(family-name:--font-dmsans) whitespace-pre-wrap">
					{description}
				</p>
			</div>

			{/* Organizer Card - Clean and Simple */}
			<div className="flex items-center gap-4 p-5 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100/80 transition-colors duration-300">
				{/* Avatar */}
				<div className="w-12 h-12 rounded-full bg-[#556b2f] flex items-center justify-center">
					<IconUser size={22} className="text-white" />
				</div>
				
				<div>
					<p className="text-xs font-medium text-gray-500 uppercase tracking-wide font-(family-name:--font-dmsans) mb-0.5">
						Organized by
					</p>
					<p className="text-lg font-bold text-gray-900 font-(family-name:--font-crimson)">
						{organizer}
					</p>
				</div>
			</div>

			{/* Simple fade animation */}
			<style>{`
				@keyframes fadeIn {
					from { opacity: 0; transform: translateY(10px); }
					to { opacity: 1; transform: translateY(0); }
				}
			`}</style>
		</div>
	);
}
