import { requireUser } from "@/features/account/session";
import { inquiriesToCsv, inquiriesToJson } from "@/features/account/export";
import { inquiries } from "@/features/inquiries/data";

export async function GET(request: Request) {
  await requireUser();
  const format = new URL(request.url).searchParams.get("formato") === "csv" ? "csv" : "json";
  const list = await inquiries().list();
  const now = new Date();
  const stamp = now.toISOString().slice(0, 10);

  const body = format === "csv" ? inquiriesToCsv(list) : inquiriesToJson(list, now);
  return new Response(body, {
    headers: {
      "Content-Type": format === "csv" ? "text/csv; charset=utf-8" : "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="clienta-en-radar-${stamp}.${format}"`,
      "Cache-Control": "no-store",
    },
  });
}
