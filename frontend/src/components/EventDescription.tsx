interface EventDescriptionProps {
	description: string;
	requirements: string[];
	organizer: string;
}

export default function EventDescription({ description, requirements, organizer }: EventDescriptionProps) {
	return (
		<div className="space-y-8">
			<div>
				<h2 className="font-(family-name:--font-crimson) text-3xl font-semibold mb-4 text-gray-900">
					About This Event
				</h2>
				<p className="text-lg text-gray-700 leading-relaxed">
					{description}
				</p>
			</div>

			<div>
				<h3 className="font-(family-name:--font-crimson) text-2xl font-semibold mb-3 text-gray-900">
					What to Bring / Requirements
				</h3>
				<ul className="space-y-2">
					{requirements.map((req, index) => (
						<li
							key={index}
							className="flex items-start gap-3 text-gray-700"
						>
							<span className="text-[#556b2f] mt-1">•</span>
							<span>{req}</span>
						</li>
					))}
				</ul>
			</div>

			<div className="bg-gray-50 p-6 rounded-xl">
				<h3 className="font-semibold text-lg mb-2 text-gray-900">
					Organized by
				</h3>
				<p className="text-gray-700">{organizer}</p>
			</div>
		</div>
	);
}
