import NewsFeed from "../NewsFeed";

export default function AdminNewsFeed() {
	return (
		<div className="space-y-6">
			{/* Admin Header */}
			<div className="mb-4">
				<h1 className="text-3xl font-bold text-gray-800 font-(family-name:--font-crimson)">
					News Feed
				</h1>
				<p className="text-gray-500 mt-1">View and manage community posts and updates.</p>
			</div>
			
			{/* Embed the NewsFeed component */}
			<div className="-mx-6 -mb-6">
				<NewsFeed isEmbedded={true} />
			</div>
		</div>
	);
}
