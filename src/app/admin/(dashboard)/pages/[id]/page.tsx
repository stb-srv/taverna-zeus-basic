import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PageForm from "../PageForm";

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: page } = await supabase.from("pages").select("*").eq("id", id).maybeSingle();
  if (!page) notFound();

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl">Seite bearbeiten</h1>
      <PageForm page={page} />
    </div>
  );
}
