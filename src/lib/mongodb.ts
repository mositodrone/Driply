// ============================================================
//  app/lib/mongodb.ts
//  Singleton MongoDB client for TanStack Start server functions
//
//  Add to .env:
//    MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/driply
//
//  Install:
//    npm install mongodb
// ============================================================

import { type Db, MongoClient } from "mongodb";

const URL = process.env.MONGODB_URL!;

if (!URL) throw new Error("MONGODB_URL missing from .env");

// Reuse client across hot-reloads in dev
declare global {
	// eslint-disable-next-line no-var
	var _mongoClient: MongoClient | undefined;
}

function getClient(): MongoClient {
	if (global._mongoClient) return global._mongoClient;
	global._mongoClient = new MongoClient(URL);
	return global._mongoClient;
}

export async function getDb(): Promise<Db> {
	const client = getClient();
	await client.connect();
	return client.db("driply");
}

// ─── Collection helpers ───────────────────────────────────────────────────────
export async function designs() {
	const db = await getDb();
	return db.collection("designs");
}
