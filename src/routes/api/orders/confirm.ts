// routes/api/orders/confirm.ts
//
// Called by StepPayment.confirmOrder() right after Paystack's popup
// succeeds. Fast feedback for the UI — the webhook (api/webhooks/paystack.ts)
// is the reliable fallback if this never fires (tab closed, network drop).
//
// NOTE: the `~/` import alias below matches TanStack Start's default scaffold
// (usually pointing at `src/`) — adjust these three imports if your
// tsconfig path alias or lib/ location differs.

import { auth } from "@clerk/tanstack-react-start/server";
import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { confirmPaystackOrder } from "@/lib/actions/order.actions";

export const Route = createFileRoute("/api/orders/confirm")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				// Require a signed-in session — this is also where the
				// authoritative clerkId comes from. We deliberately do NOT trust
				// the clerkId in the Paystack metadata here (the client set that
				// value itself when opening the popup, so it's not proof of who
				// actually paid) — only the webhook path falls back to it, since
				// it has no session to check against.
				const { userId } = await auth()
				if (!userId) {
					return json({ error: "Not authenticated" }, { status: 401 });
				}

				let body: { reference?: string };
				try {
					body = await request.json();
				} catch {
					return json({ error: "Invalid JSON body" }, { status: 400 });
				}

				if (!body.reference) {
					return json({ error: "Missing reference" }, { status: 400 });
				}

				try {
					const order = await confirmPaystackOrder(body.reference, {
						trustedClerkId: userId,
					});
					return json({ order });
				} catch (error: any) {
					console.error("[api/orders/confirm]", error);
					return json(
						{ error: error?.message ?? "Could not confirm order" },
						{ status: 500 },
					);
				}
			},
		},
	},
});
