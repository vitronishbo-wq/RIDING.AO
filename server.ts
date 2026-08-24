import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Inicialização do Firebase Admin SDK
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : null;

if (serviceAccount) {
  initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || "riding-37f72",
  });
} else {
  initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || "riding-37f72",
  });
}

const db = getFirestore();
const PORT = Number(process.env.PORT) || 3000;

// Type declaration for Bun global if running under generic node/ts environment
declare const Bun: {
  serve: (options: {
    port: number;
    hostname: string;
    fetch: (req: Request) => Promise<Response> | Response;
  }) => { port: number };
};

const server = Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    // Headers CORS para comunicação segura com o Firebase Hosting
    const corsHeaders: Record<string, string> = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check para monitorização no Render
    if (url.pathname === "/health" || url.pathname === "/") {
      return new Response(
        JSON.stringify({ status: "online", timestamp: new Date().toISOString() }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Webhook Endpoint para AppyPay
    if (url.pathname === "/api/v1/payments/webhooks/appypay" && req.method === "POST") {
      try {
        const body = (await req.json()) as Record<string, unknown>;
        const signature = req.headers.get("x-appypay-signature");

        // Registo da transação no Firestore
        if (body?.transactionId && typeof body.transactionId === "string") {
          await db.collection("payments").doc(body.transactionId).set(
            {
              ...body,
              signature: signature || null,
              updatedAt: new Date().toISOString(),
              status: body.status || "PROCESSED",
            },
            { merge: true }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: "Webhook processed" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Internal error";
        return new Response(
          JSON.stringify({ error: "Webhook Error", details: errorMessage }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Not Found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  },
});

console.log(`Server running on http://0.0.0.0:${server.port}`);
