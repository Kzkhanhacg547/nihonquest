import { redirect } from "next/navigation";

export default function YokaiDashRootRedirect({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const query = new URLSearchParams();
  if (searchParams) {
    for (const [key, val] of Object.entries(searchParams)) {
      if (typeof val === "string") {
        query.set(key, val);
      } else if (Array.isArray(val)) {
        val.forEach((v) => query.append(key, v));
      }
    }
  }
  const qs = query.toString();
  redirect(`/app/yokai-dash${qs ? `?${qs}` : ""}`);
}

