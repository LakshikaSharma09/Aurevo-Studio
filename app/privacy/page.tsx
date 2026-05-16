export default function PrivacyPage() {
  return (
    <article className="prose prose-invert max-w-3xl">
      <h1 className="text-3xl font-semibold text-white">Privacy</h1>
      <p className="text-gray-400">
        Aurevo Studio collects information you voluntarily submit—such as consultation requests,
        feedback, and optional email addresses—and technical data standard to web hosting (for
        example IP address and browser metadata) to operate and secure the service.
      </p>
      <h2 className="text-xl font-semibold text-white">AI features</h2>
      <p className="text-gray-400">
        When you use the assistant or the site analyzer, your inputs and retrieved page content
        may be sent to third-party model providers (for example OpenAI or Google) solely to
        generate responses. Do not submit secrets, credentials, or personal data you are not
        allowed to share.
      </p>
      <h2 className="text-xl font-semibold text-white">Retention</h2>
      <p className="text-gray-400">
        Lead, feedback, and analysis records are stored in our database for operational follow-up
        and auditing. Contact us to request deletion where applicable law applies.
      </p>
      <h2 className="text-xl font-semibold text-white">Contact</h2>
      <p className="text-gray-400">
        Questions: use the Book or Feedback pages, or reach out through the channel we provide in
        your agreement
      </p>
    </article>
  );
}
