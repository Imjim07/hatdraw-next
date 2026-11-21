import { SOCIAL } from "@/lib/config";

// Footer social links: round 44px buttons with simple line/filled marks drawn here
// (no icon library). Each link's name comes from its aria-label.
export const SOCIAL_ICONS: Record<(typeof SOCIAL)[number]["id"], React.ReactNode> = {
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </>
  ),
  tiktok: (
    <path fill="currentColor" d="M16.6 3c.3 2.3 1.7 3.8 4 4v3.2a7.4 7.4 0 0 1-4-1.2V15a6 6 0 1 1-6-6c.3 0 .7 0 1 .1v3.3a2.8 2.8 0 1 0 1.8 2.6V3h3.2z" />
  ),
  snapchat: (
    <path fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"
      d="M12 3.2c3 0 5 2.2 5 5.2v2.2l1.6-.5c.6-.2 1 .6.4 1l-1.8 1c.6 1.8 1.9 3 3.6 3.5-.3.8-1.4 1-2.4 1.2-.2.6-.2 1.2-.7 1.2-.8 0-1.6-.4-2.7.2-.9.6-1.8 1.4-3 1.4s-2.1-.8-3-1.4c-1.1-.6-1.9-.2-2.7-.2-.5 0-.5-.6-.7-1.2-1-.2-2.1-.4-2.4-1.2 1.7-.5 3-1.7 3.6-3.5l-1.8-1c-.6-.4-.2-1.2.4-1l1.6.5V8.4c0-3 2-5.2 5-5.2z" />
  ),
  facebook: (
    <path fill="currentColor" d="M13.6 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.9v3h2.6V21h3.1z" />
  ),
};

export default function SocialIcons({ name }: { name: string }) {
  return (
    <div className="sf-social">
      {SOCIAL.map((s) => (
        <a key={s.id} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`${name} on ${s.label}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">{SOCIAL_ICONS[s.id]}</svg>
        </a>
      ))}
    </div>
  );
}
