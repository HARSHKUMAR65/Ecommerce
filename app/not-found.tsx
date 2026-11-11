import { EmptyState } from "@/components/ui";
export default function NotFound() {
  return (
    <section className="page">
      <EmptyState
        title="A different kind of nowhere."
        text="This page could not be found. Let’s get you back to the collection."
      />
    </section>
  );
}
