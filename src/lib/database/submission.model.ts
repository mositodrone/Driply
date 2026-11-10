import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const SizeQtySchema = new Schema(
	{
		size: { type: String, required: true },
		qty: { type: Number, required: true, min: 1 },
	},
	{ _id: false },
);

const SubmissionSchema = new Schema(
	{
		clerkId: { type: String, required: true, index: true },
		designId: { type: String, required: true },
		garment: {
			id: { type: String, required: true },
			name: { type: String, required: true },
			color: { label: String, hex: String },
			size: String,
		},
		sizeBreakdown: { type: [SizeQtySchema], required: true },
		totalPieces: { type: Number, required: true, min: 1 },
		customer: {
			firstName: { type: String, required: true },
			lastName: { type: String, required: true },
			email: { type: String, required: true },
			whatsapp: { type: String, required: true },
			city: String,
			state: String,
		},
		notes: String,
		acknowledged: { type: Boolean, required: true, default: false },
		isPaid: { type: Boolean, default: false },
		status: {
			type: String,
			enum: ["unprocessed", "contacted", "in_production", "delivered"],
			default: "unprocessed",
		},
	},
	{ timestamps: true },
);

const DesignSubmission =
	models.DesignSubmission || model("DesignSubmission", SubmissionSchema);

export default DesignSubmission;
