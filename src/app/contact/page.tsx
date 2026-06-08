import type { Metadata } from "next";
import Link from "next/link";
import DocLayout from "@/components/DocLayout";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with buildop, feedback, bug reports, suggestions and Guild Wars 2 data corrections are all welcome.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <DocLayout title="Contact" updated="8 June 2026">
      <p>
        buildop is built by a fan who actually plays the game, so feedback genuinely shapes what
        gets built next. Whether something is broken, a price or timer looks off, or you have an
        idea for a new tool, we want to hear it.
      </p>

      <h2>Email</h2>
      <p>
        Reach us at <a href="mailto:contact@buildop.app">contact@buildop.app</a>. We read every
        message, though replies may take a little time.
      </p>

      <h2>Good things to include</h2>
      <ul>
        <li>Which page or tool you were using, and what you expected to see.</li>
        <li>For data corrections, the boss, item or map and the value that looks wrong.</li>
        <li>Your browser and device, if you are reporting a visual bug.</li>
      </ul>

      <p>
        Want to know more about the project and where its data comes from? See the{" "}
        <Link href="/about">about page</Link>.
      </p>
    </DocLayout>
  );
}
