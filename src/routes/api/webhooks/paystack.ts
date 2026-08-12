// routes/api/webhooks/paystack.ts
//
// Paystack's server-to-server notification — the reliable counterpart to
// StepPayment's client-side confirm call. This is what actually guarantees
// an order gets recorded even if the customer's browser closes right after
// paying. Point this file's URL at your Paystack dashboard's Test/Live
// Webhook URL field (see conversation above re: ngrok for local dev).
//
// NOTE: if your project applies clerkMiddleware() globally in start.ts, by
// default it only protects routes you explicitly opt in — this route
// should be reachable without a Clerk session, since Paystack's servers
// obviously don't have one. Double check it isn't accidentally guarded.

import { createFileRoute } from "@tanstack/react-router";
import { confirmPaystackOrder } from "@/lib/actions/order.actions";
import { verifyWebhookSignature } from "@/lib/paystack";

export const Route = createFileRoute("/api/webhooks/paystack")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				// Read as raw text BEFORE any JSON parsing — the signature is
				// computed over the exact byte sequence Paystack sent. Parsing to
				// JSON and re-stringifying (even losslessly) can reorder keys or
				// change whitespace and silently break verification.
				const rawBody = await request.text();
				const signature = request.headers.get("x-paystack-signature");

				if (!verifyWebhookSignature(rawBody, signature)) {
					console.warn(
						"[webhooks/paystack] rejected — bad or missing signature",
					);
					// 401, not 400 — this tells Paystack (and anyone reading logs)
					// it's an auth failure, not a malformed-request bug on our end.
					return new Response("Invalid signature", { status: 401 });
				}

				let event: any;
				try {
					event = JSON.parse(rawBody);
				} catch {
					return new Response("Invalid JSON", { status: 400 });
				}

				// Only charge.success needs action here. Paystack sends other
				// event types too (transfers, disputes, etc.) — 200 those without
				// acting so Paystack doesn't keep retrying events we don't handle.
				if (event.event !== "charge.success") {
					return new Response("ok", { status: 200 });
				}

				try {
					// Same shared action the client confirm route calls — whichever
					// of the two arrives first wins, the second is a no-op via the
					// paystackRef uniqueness check inside createOrder().
					await confirmPaystackOrder(event.data.reference);
					return new Response("ok", { status: 200 });
				} catch (error) {
					console.error("[webhooks/paystack]", error);
					// 500 makes Paystack retry — correct for a transient DB/network
					// error. If a specific reference starts failing for a reason
					// that will never resolve (e.g. malformed metadata), that'll
					// show up as repeated retries in your logs — worth alerting on.
					return new Response("error", { status: 500 });
				}
			},
		},
	},
});
