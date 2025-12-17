import { IconUsers, IconCalendarEvent, IconActivity, IconClock } from "@tabler/icons-react";

const StatsCard = ({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend?: string }) => (
	<div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between">
		<div>
			<p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
			<h3 className="text-2xl font-bold text-gray-800">{value}</h3>
			{trend && <p className="text-green-600 text-xs mt-2 font-medium">{trend}</p>}
		</div>
		<div className="p-3 bg-[#556b2f]/10 text-[#556b2f] rounded-xl">
			{icon}
		</div>
	</div>
);

export default function AdminDashboard() {
	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
				<p className="text-gray-500">Welcome back, here's what's happening today.</p>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<StatsCard 
					title="Total Users" 
					value="1,234" 
					icon={<IconUsers size={24} />} 
					trend="+12% from last month"
				/>
				<StatsCard 
					title="Active Events" 
					value="45" 
					icon={<IconCalendarEvent size={24} />} 
					trend="+5 new this week"
				/>
				<StatsCard 
					title="Pending Approvals" 
					value="12" 
					icon={<IconActivity size={24} />} 
					trend="Requires attention"
				/>
				<StatsCard 
					title="Total Vol. Hours" 
					value="8,540" 
					icon={<IconClock size={24} />} 
				/>
			</div>

			{/* Recent Activity Section (Placeholder) */}
			<div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
				<div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
					<h3 className="font-bold text-gray-800">Recent Activities</h3>
					<button className="text-sm text-[#556b2f] font-medium hover:underline">View All</button>
				</div>
				<div className="p-6 text-center text-gray-500 py-12">
					<p>Chart or Activity Feed will go here</p>
				</div>
			</div>
		</div>
	);
}
