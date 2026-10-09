// Server Component — required by `output: "export"`.
// generateStaticParams must live here (not in a "use client" file).
// When the API is ready, replace the static list with a real fetch.
import RachaDetailClient from "./RachaDetailClient";

export function generateStaticParams() {
  return [{ id: "1" }, { id: "2" }, { id: "3" }];
}

export default function RachaPage({ params }: { params: Promise<{ id: string }> }) {
  return <RachaDetailClient params={params} />;
}
