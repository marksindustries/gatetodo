import { Client } from "@upstash/qstash";

let client: Client | null = null;

function getQStash(): Client {
  if (!client) {
    client = new Client({ token: process.env.QSTASH_TOKEN! });
  }
  return client;
}

export interface QStashJob {
  job_type: "roadmap_gen" | "mock_debrief" | "concept_explain";
  payload: Record<string, unknown>;
}

export async function publishJob(job: QStashJob): Promise<{ messageId: string }> {
  const qstash = getQStash();

  // Prefer the Vercel URL in production; fall back to APP_URL for local dev
  const baseUrl =
    process.env.NEXT_PUBLIC_VERCEL_URL ?? process.env.NEXT_PUBLIC_APP_URL!;

  const response = await qstash.publishJSON({
    url: `${baseUrl}/api/jobs/process`,
    body: job,
    retries: 3,
  });

  return { messageId: response.messageId };
}

export async function scheduleCron(
  cronExpression: string,
  jobType: string
): Promise<void> {
  const qstash = getQStash();
  await qstash.schedules.create({
    destination: `${process.env.NEXT_PUBLIC_APP_URL}/api/jobs/process`,
    cron: cronExpression,
    body: JSON.stringify({ job_type: jobType }),
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Verify QStash webhook signature.
 * Call this in webhook handlers before processing.
 */
export async function verifyQStashSignature(
  request: Request
): Promise<boolean> {
  try {
    const { Receiver } = await import("@upstash/qstash");
    const receiver = new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
    });

    const signature = request.headers.get("upstash-signature") ?? "";
    const body = await request.text();

    await receiver.verify({ signature, body });
    return true;
  } catch {
    return false;
  }
}
