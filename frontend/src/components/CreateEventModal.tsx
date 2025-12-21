import { useState, useEffect, useRef } from "react";
import { IconX, IconUpload, IconCalendar, IconMapPin, IconPhoto } from "@tabler/icons-react";
import { createClient } from "@supabase/supabase-js";
import { RestClient } from "@/api/RestClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import * as yup from "yup";

// Yup validation schema factory
const createEventValidationSchema = (editMode: boolean = false) => yup.object().shape({
	title: yup
		.string()
		.required("Event title is required")
		.min(5, "Title must be at least 5 characters")
		.max(100, "Title must not exceed 100 characters"),
	type: yup
		.string()
		.required("Event type is required")
		.oneOf(["HELPING", "PLANTING", "MEDICAL", "FUNDRAISER", "FOOD"], "Invalid event type"),
	startTime: yup
		.string()
		.required("Start date and time is required")
		.test("is-future", "Start time must be in the future", function(value) {
			// Skip future check in edit mode
			if (editMode) return true;
			if (!value) return false;
			return new Date(value) > new Date();
		}),
	endTime: yup
		.string()
		.required("End date and time is required")
		.test("after-start", "End time must be after start time", function(value) {
			const { startTime } = this.parent;
			if (!value || !startTime) return false;
			return new Date(value) > new Date(startTime);
		}),
	location: yup
		.string()
		.required("Location is required")
		.min(3, "Location must be at least 3 characters"),
	description: yup
		.string()
		.required("Description is required")
		.min(20, "Description must be at least 20 characters")
		.max(2000, "Description must not exceed 2000 characters"),
});

const supabase = createClient(
	import.meta.env.VITE_SUPABASE_URL,
	import.meta.env.VITE_SUPABASE_ANON_KEY
);

const getSupabaseImageUrl = (imagePath: string): string => {
	if (!imagePath) return "";
	const { data } = supabase.storage.from("volunteer").getPublicUrl(imagePath);
	return data.publicUrl;
};

interface CreateEventModalProps {
	isOpen: boolean;
	onClose: () => void;
	onEventCreated: () => void;
	editMode?: boolean;
	initialEventData?: {
		id: number;
		type: string;
		title: string;
		startTime: string;
		endTime: string;
		location: string;
		description: string;
		imageUrl: string;
	};
}

const EVENT_TYPES = [
	{ value: "HELPING", label: "Helping" },
	{ value: "PLANTING", label: "Planting" },
	{ value: "MEDICAL", label: "Medical" },
	{ value: "FUNDRAISER", label: "Fundraiser" },
	{ value: "FOOD", label: "Food" },
];

export default function CreateEventModal({ isOpen, onClose, onEventCreated, editMode = false, initialEventData }: CreateEventModalProps) {
	const { user } = useAuth();
	const { showToast } = useToast();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string>("");
	
	// Initialize form data from initial event data if in edit mode
	const getInitialFormData = () => {
		if (editMode && initialEventData) {
			// Convert ISO to datetime-local format
			const formatForInput = (isoString: string) => {
				const date = new Date(isoString);
				const year = date.getFullYear();
				const month = String(date.getMonth() + 1).padStart(2, '0');
				const day = String(date.getDate()).padStart(2, '0');
				const hours = String(date.getHours()).padStart(2, '0');
				const minutes = String(date.getMinutes()).padStart(2, '0');
				return `${year}-${month}-${day}T${hours}:${minutes}`;
			};

			return {
				type: initialEventData.type,
				title: initialEventData.title,
				startTime: formatForInput(initialEventData.startTime),
				endTime: formatForInput(initialEventData.endTime),
				location: initialEventData.location,
				description: initialEventData.description,
			};
		}
		return {
			type: "HELPING",
			title: "",
			startTime: "",
			endTime: "",
			location: "",
			description: "",
		};
	};

	const [formData, setFormData] = useState(getInitialFormData());
	const [initialForm, setInitialForm] = useState(getInitialFormData()); // Store initial state for comparison
	const [errors, setErrors] = useState<Record<string, string>>({});
	// Track if modal was previously open
	const wasOpenRef = useRef(false);

	// Re-initialize form data only when modal opens (not on every render)
	useEffect(() => {
		if (isOpen && !wasOpenRef.current) {
			// Modal just opened - initialize form
			const initialData = getInitialFormData();
			setFormData(initialData);
			setInitialForm(initialData);
			setErrors({});
			setImageFile(null);
			
			// Load existing image preview in edit mode
			if (editMode && initialEventData?.imageUrl) {
				const imageUrl = getSupabaseImageUrl(initialEventData.imageUrl);
				setImagePreview(imageUrl);
			} else {
				setImagePreview("");
			}
		}
		wasOpenRef.current = isOpen;
	}, [isOpen]);

	// Check if form has changes
	const hasChanges = () => {
		if (!editMode) return true; // Always allow submit in create mode
		
		const formChanged = Object.keys(formData).some(
			key => formData[key as keyof typeof formData] !== initialForm[key as keyof typeof initialForm]
		);
		const imageChanged = imageFile !== null;
		
		return formChanged || imageChanged;
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setImageFile(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setImagePreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const uploadImage = async (): Promise<string | null> => {
		if (!imageFile) return null;

		try {
			const fileExt = imageFile.name.split(".").pop();
			const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
			const filePath = `events/${fileName}`;

			console.log("Uploading image:", { fileName, fileSize: imageFile.size, fileType: imageFile.type });

			const { data, error } = await supabase.storage
				.from("volunteer")
				.upload(filePath, imageFile, {
					cacheControl: '3600',
					upsert: false
				});

			if (error) {
				console.error("Supabase upload error:", error);
				showToast(`Upload failed: ${error.message}`, "error");
				return null;
			}

			console.log("Upload successful:", data);
			return filePath;
		} catch (err) {
			console.error("Image upload exception:", err);
			showToast("Failed to upload image", "error");
			return null;
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!user?.id) {
			showToast("Please log in to create an event", "error");
			return;
		}

		// Validate form with Yup
		try {
			const validationSchema = createEventValidationSchema(editMode);
			await validationSchema.validate(formData, { abortEarly: false });
			setErrors({});
		} catch (err) {
			if (err instanceof yup.ValidationError) {
				const validationErrors: Record<string, string> = {};
				err.inner.forEach((error) => {
					if (error.path) {
						validationErrors[error.path] = error.message;
					}
				});
				setErrors(validationErrors);
				
				// Show specific error message(s) in toast
				const errorCount = err.inner.length;
				const firstError = err.inner[0]?.message || "Please fix validation errors";
				const toastMessage = errorCount > 1 
					? `${firstError} (+${errorCount - 1} more error${errorCount - 1 > 1 ? 's' : ''})`
					: firstError;
				showToast(toastMessage, "warning");
				return;
			}
		}

		setIsSubmitting(true);

		try {
			// Upload new image if one was selected, otherwise use default based on category
			let imagePath = editMode && initialEventData ? initialEventData.imageUrl : "";
			if (imageFile) {
				const uploadedPath = await uploadImage();
				if (!uploadedPath) {
					setIsSubmitting(false);
					return;
				}
				imagePath = uploadedPath;
			} else if (!editMode) {
				// Use default image based on category for new events without custom image
				imagePath = `events/default_${formData.type.toLowerCase()}.png`;
			}

			// Prepare event data
			const eventData = {
				type: formData.type,
				title: formData.title,
				startTime: formData.startTime,
				endTime: formData.endTime,
				location: formData.location,
				description: formData.description,
				imageUrl: imagePath,
			};

			if (editMode && initialEventData) {
				// Update existing event
				const result = await RestClient.updateEvent(initialEventData.id, eventData);
				if (result.data || result.success !== false) {
					showToast("Event updated successfully!", "success");
					onEventCreated(); // Refresh parent
					handleClose();
				} else {
					showToast(result.message || "Failed to update event", "error");
				}
			} else {
				// Create new event
				const result = await RestClient.createEvent({
					...eventData,
					managerId: user.id,
				});

				if (result.data) {
					showToast("Event created successfully! Waiting for admin approval.", "success");
					onEventCreated();
					handleClose();
				} else {
					showToast(result.message || "Failed to create event", "error");
				}
			}
		} catch (err) {
			console.error(`Failed to ${editMode ? 'update' : 'create'} event:`, err);
			showToast(`Failed to ${editMode ? 'update' : 'create'} event`, "error");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		// Form data will be reset by useEffect when modal reopens
		setErrors({});
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-[1000] flex items-center justify-center">
			<div className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer" onClick={handleClose} />
			<div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
				{/* Header */}
				<div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-[#556b2f] to-[#6d8c3a]">
					<h2 className="text-xl font-bold text-white font-(family-name:--font-crimson)">
						{editMode ? "Edit Event" : "Create New Event"}
					</h2>
					<button
						onClick={handleClose}
						className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
					>
						<IconX size={24} />
					</button>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
					<div className="space-y-5">
						{/* Event Title */}
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Event Title *
							</label>
							<input
								type="text"
								name="title"
								value={formData.title}
								onChange={handleInputChange}
								placeholder="Enter event title"
								className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#556b2f] focus:border-transparent transition-all ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
							/>
							{errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
						</div>

						{/* Event Type */}
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Event Type *
							</label>
							<select
								name="type"
								value={formData.type}
								onChange={handleInputChange}
								className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#556b2f] focus:border-transparent transition-all bg-white"
							>
								{EVENT_TYPES.map((type) => (
									<option key={type.value} value={type.value}>
										{type.label}
									</option>
								))}
							</select>
						</div>

						{/* Date & Time */}
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									<IconCalendar size={16} className="inline mr-1" />
									Start Date & Time *
								</label>
								<input
									type="datetime-local"
									name="startTime"
									value={formData.startTime}
									onChange={handleInputChange}
									className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#556b2f] focus:border-transparent transition-all"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									<IconCalendar size={16} className="inline mr-1" />
									End Date & Time *
								</label>
								<input
									type="datetime-local"
									name="endTime"
									value={formData.endTime}
									onChange={handleInputChange}
									className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#556b2f] focus:border-transparent transition-all"
									required
								/>
							</div>
						</div>

						{/* Location */}
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								<IconMapPin size={16} className="inline mr-1" />
								Location *
							</label>
							<input
								type="text"
								name="location"
								value={formData.location}
								onChange={handleInputChange}
								placeholder="Enter event location"
								className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#556b2f] focus:border-transparent transition-all"
								required
							/>
						</div>

						{/* Description */}
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Description *
							</label>
							<textarea
								name="description"
								value={formData.description}
								onChange={handleInputChange}
								placeholder="Describe your event..."
								rows={4}
								className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#556b2f] focus:border-transparent transition-all resize-none"
								required
							/>
						</div>

						{/* Image Upload */}
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
							<IconPhoto size={16} className="inline mr-1" />
							Event Image <span className="font-normal text-gray-500">(optional)</span>
						</label>
							<div className="relative">
								{imagePreview ? (
									<div className="relative rounded-xl overflow-hidden">
										<img
											src={imagePreview}
											alt="Preview"
											className="w-full h-48 object-cover"
										/>
										<button
											type="button"
											onClick={() => {
												setImageFile(null);
												setImagePreview("");
											}}
											className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
										>
											<IconX size={16} />
										</button>
									</div>
								) : (
									<label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#556b2f] hover:bg-gray-50 transition-all">
										<IconUpload size={32} className="text-gray-400 mb-2" />
										<span className="text-gray-500 font-medium">Click to upload image</span>
										<span className="text-gray-400 text-sm mt-1">PNG, JPG up to 10MB</span>
										<input
											type="file"
											accept="image/*"
											onChange={handleImageChange}
											className="hidden"
										/>
									</label>
								)}
							</div>
						</div>
					</div>

					{/* Submit Button */}
					<div className="mt-6 flex gap-3">
						<button
							type="button"
							onClick={handleClose}
							className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSubmitting || (editMode && !hasChanges())}
							className="flex-1 px-6 py-3 bg-[#556b2f] text-white rounded-xl font-semibold hover:bg-[#6d8c3a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
						>
							{isSubmitting ? (
								<>
									<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
									{editMode ? "Updating..." : "Creating..."}
								</>
							) : (
								<>{editMode ? "Update Event" : "Create Event"}</>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
