/**
 * Standalone seed script — populates content_embeddings via the API route.
 *
 * Usage:
 *   npx tsx scripts/seed-embeddings.ts
 *
 * Requires .env.local to be loaded (dotenv).
 */

import * as dotenv from "dotenv";
import * as path from "path";

// Load .env.local from project root
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function main() {
    console.log("🔍 Checking current embedding status...");

    const statusRes = await fetch(`${APP_URL}/api/db/embeddings`);
    const status = await statusRes.json();
    console.log(`   Current embeddings: ${status.totalEmbeddings ?? "unknown"}`);

    if (status.totalEmbeddings && status.totalEmbeddings > 0) {
        console.log("⚠️  Embeddings already exist. To re-index, DELETE first:");
        console.log(`   curl -X DELETE ${APP_URL}/api/db/embeddings`);
        console.log("   Then re-run this script.");
        return;
    }

    console.log("\n🚀 Populating embeddings (this may take a while)...\n");

    const res = await fetch(`${APP_URL}/api/db/embeddings`, { method: "POST" });
    const result = await res.json();

    if (!res.ok) {
        console.error("❌ Failed:", result);
        process.exit(1);
    }

    console.log("✅ Done!");
    console.log(`   Modules processed: ${result.modulesProcessed}`);
    console.log(`   Total chunks:      ${result.totalChunks}`);
    console.log(`   Embeddings stored: ${result.embeddingsCreated}`);

    if (result.errors?.length) {
        console.warn(`\n⚠️  ${result.errors.length} errors occurred:`);
        result.errors.slice(0, 5).forEach((e: string) => console.warn(`   - ${e}`));
    }
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
