// ============================================================
//  app/routes/api/designs.ts
//  TanStack Start server functions for the designs collection.
//
//  Endpoints:
//    GET    /api/designs          — list user's designs
//    POST   /api/designs          — save / upsert a design
//    DELETE /api/designs/:id      — delete a design
//
//  Auth: Clerk userId pulled from server-side auth() helper.
// ============================================================

import { getAuth } from "@clerk/tanstack-start/server";
import { createAPIRoute } from "@tanstack/start";
import { ObjectId } from "mongodb";
import { designs } from "~/lib/mongodb";

// ─── GET — list designs for current user ─────────────────────────────────────
export const GET = createAPIRoute(async ({ request }) => {
	const { userId } = await getAuth(request);
	if (!userId) return new Response("Unauthorized", { status: 401 });

	const col = await designs();
	const docs = await col
		.find({ userId }, { projection: { elements: 0 } }) // omit heavy elements in list view
		.sort({ updatedAt: -1 })
		.limit(50)
		.toArray();

	return Response.json(docs);
});

// ─── POST — create or update a design ────────────────────────────────────────
export const POST = createAPIRoute(async ({ request }) => {
	const { userId } = await getAuth(request);
	if (!userId) return new Response("Unauthorized", { status: 401 });

	const body = await request.json();
	const {
		designId, // client-generated uid — used as idempotency key
		name,
		garmentId,
		garmentColor,
		garmentSize,
		garmentAttrs,
		zoneId,
		elements,
		thumbnail, // base64 PNG from stage.toDataURL()
		view,
	} = body;

	if (!designId || !elements) {
		return new Response("designId and elements are required", { status: 400 });
	}

	const col = await designs();
	const now = new Date();

	const result = await col.updateOne(
		{ userId, designId },
		{
			$set: {
				userId,
				designId,
				name: name || "Untitled design",
				garmentId,
				garmentColor,
				garmentSize,
				garmentAttrs,
				zoneId,
				elements,
				thumbnail,
				view,
				updatedAt: now,
			},
			$setOnInsert: { createdAt: now, status: "draft" },
		},
		{ upsert: true },
	);

	return Response.json({ ok: true, upserted: result.upsertedCount > 0 });
});

// ─── DELETE — remove one design ───────────────────────────────────────────────
export const DELETE = createAPIRoute(async ({ request }) => {
	const { userId } = await getAuth(request);
	if (!userId) return new Response("Unauthorized", { status: 401 });

	const { designId } = await request.json();
	if (!designId) return new Response("designId required", { status: 400 });

	const col = await designs();
	await col.deleteOne({ userId, designId });

	return Response.json({ ok: true });
});
