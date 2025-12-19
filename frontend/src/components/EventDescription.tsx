interface EventDescriptionProps {
	description: string;
	requirements: string[];
	organizer: string;
}

export default function EventDescription({ description, requirements, organizer }: EventDescriptionProps) {
	return (
		<div className="space-y-8">
			<div>
				<h2 className="font-(family-name:--font-crimson) text-3xl font-bold mb-5 text-gray-900">
					About This Event
				</h2>
				<p className="text-base text-gray-700 leading-relaxed font-(family-name:--font-dmsans)">
					{description}
				</p>
			</div>

			<div className="bg-gradient-to-r from-[#556b2f]/5 to-[#747e59]/5 p-6 rounded-xl border-l-4 border-[#556b2f]">
				<h3 className="font-(family-name:--font-dmsans) font-bold text-base mb-2 text-[#556b2f]">
					Organized by
				</h3>
				<p className="text-gray-800 font-(family-name:--font-crimson) text-lg font-bold">{organizer}</p>
			</div>
		</div>
	);
}
