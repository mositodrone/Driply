// ============================================================
//  app/api/webhooks/clerk.ts
//  TanStack Start API route — Clerk webhook handler
//
//  Handles user.created / user.updated / user.deleted events.
//  Svix verifies the signature so only genuine Clerk events
//  get through.
//
//  Setup checklist:
//  1. npm install svix @clerk/backend
//  2. .env:
//       CLERK_WEBHOOK_SECRET=whsec_...   (from Clerk dashboard → Webhooks)
//       CLERK_SECRET_KEY=sk_...          (from Clerk dashboard → API Keys)
//  3. Clerk dashboard → Webhooks → Add endpoint:
//       URL:    https://yourdomain.com/api/webhooks/clerk
//       Events: user.created, user.updated, user.deleted
//  4. Local dev: ngrok http 3000 → paste URL into Clerk webhook endpoint
// ============================================================

import { createClerkClient } from "@clerk/backend";
import { createAPIFileRoute } from "@tanstack/start/api";
import { Webhook } from "svix";

import { createUser, deleteUser, updateUser } from "~/lib/actions/user.actions";

// ─── Types ────────────────────────────────────────────────────────────────────
// Clerk sends these shapes — only the fields we actually use are typed here.
interface ClerkUserCreatedData {
	id: string;
	email_addresses: { email_address: string }[];
	image_url: string;
	first_name: string | null;
	last_name: string | null;
	username: string | null;
}

interface ClerkUserUpdatedData {
	id: string;
	image_url: string;
	first_name: string | null;
	last_name: string | null;
	username: string | null;
}

interface ClerkUserDeletedData {
	id?: string;
	deleted: boolean;
}

interface WebhookEvent {
	type: "user.created" | "user.updated" | "user.deleted" | string;
	data: ClerkUserCreatedData & ClerkUserUpdatedData & ClerkUserDeletedData;
}

// ─── Route ────────────────────────────────────────────────────────────────────
export const APIRoute = createAPIFileRoute("/api/webhooks/clerk")({
	POST: async ({ request }) => {
		// ── 1. Env guard ────────────────────────────────────────────────────────
		const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
		if (!WEBHOOK_SECRET) {
			console.error("[clerk-webhook] CLERK_WEBHOOK_SECRET is not set");
			return new Response("Server misconfiguration", { status: 500 });
		}

		// ── 2. Pull svix signature headers ──────────────────────────────────────
		const svix_id = request.headers.get("svix-id");
		const svix_timestamp = request.headers.get("svix-timestamp");
		const svix_signature = request.headers.get("svix-signature");

		if (!svix_id || !svix_timestamp || !svix_signature) {
			return new Response("Missing svix headers", { status: 400 });
		}

		// ── 3. Verify signature ──────────────────────────────────────────────────
		const body = await request.text();
		let evt: WebhookEvent;

		try {
			const wh = new Webhook(WEBHOOK_SECRET);
			evt = wh.verify(body, {
				"svix-id": svix_id,
				"svix-timestamp": svix_timestamp,
				"svix-signature": svix_signature,
			}) as WebhookEvent;
		} catch (err) {
			console.error("[clerk-webhook] Signature verification failed:", err);
			return new Response("Invalid signature", { status: 400 });
		}

		const { type: eventType, data } = evt;
		console.log(`[clerk-webhook] ${eventType} — ${data.id}`);

		// ── 4. user.created ─────────────────────────────────────────────────────
		if (eventType === "user.created") {
			const primaryEmail = data.email_addresses?.[0]?.email_address;

			if (!primaryEmail) {
				console.error(
					"[clerk-webhook] user.created — no email address in payload",
				);
				return new Response("No email address in payload", { status: 400 });
			}

			// Use username if set, otherwise derive from email (strips the @ domain)
			// Avoids passing a raw email address as a username which Clerk may reject
			const username = data.username ?? primaryEmail.split("@")[0];

			const newUser = await createUser({
				clerkId: data.id,
				email: primaryEmail,
				username,
				firstName: data.first_name ?? "",
				lastName: data.last_name ?? "",
				photo: data.image_url ?? "",
			});

			// Write the MongoDB _id back to Clerk public metadata so client-side
			// code can access it via useUser().publicMetadata.userId without an
			// extra DB round trip
			if (newUser?._id) {
				const clerk = createClerkClient({
					secretKey: process.env.CLERK_SECRET_KEY,
				});
				await clerk.users.updateUserMetadata(data.id, {
					publicMetadata: { userId: String(newUser._id) },
				});
			}

			return Response.json({ message: "OK", user: newUser }, { status: 201 });
		}

		// ── 5. user.updated ─────────────────────────────────────────────────────
		if (eventType === "user.updated") {
			const updatedUser = await updateUser(data.id, {
				firstName: data.first_name ?? "",
				lastName: data.last_name ?? "",
				username: data.username ?? "",
				photo: data.image_url ?? "",
			});

			return Response.json({ message: "OK", user: updatedUser });
		}

		// ── 6. user.deleted ─────────────────────────────────────────────────────
		if (eventType === "user.deleted") {
			if (!data.id) {
				return new Response("Missing user ID in delete event", { status: 400 });
			}

			const deletedUser = await deleteUser(data.id);
			return Response.json({ message: "OK", user: deletedUser });
		}

		// ── 7. Unhandled event types — acknowledge so Clerk doesn't retry ────────
		console.log(`[clerk-webhook] Unhandled event type: ${eventType}`);
		return new Response("Event received", { status: 200 });
	},
});
