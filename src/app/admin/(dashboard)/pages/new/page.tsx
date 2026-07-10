import PageForm from "../PageForm";

export default function NewPage() {
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl">Neue Seite</h1>
      <PageForm page={null} />
    </div>
  );
}
