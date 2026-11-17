import styles from "./HowItWorks.module.css";

const steps = [
  {
    title: "Choose your side",
    description: "Start as a renter or landlord.",
    icon: (
      <>
        <circle cx="15" cy="15" r="6" fill="currentColor" />
        <circle cx="35" cy="16" r="5" fill="#528abd" />
        <path d="M3 39v-2a12 12 0 0 1 24 0v2z" fill="currentColor" />
        <path d="M30 38v-1c0-4-1-6-3-9a10 10 0 0 1 18 7v3z" fill="#528abd" />
      </>
    ),
  },
  {
    title: "Upload your lease",
    description: "Use a PDF with selectable text.",
    icon: (
      <>
        <path d="M11 4h17l10 10v29a2 2 0 0 1-2 2H11a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Zm17 0v10h10" stroke="currentColor" />
        <path d="M15 20h15m-15 6h17m-17 6h12m-12 6h9" stroke="#528abd" />
      </>
    ),
  },
  {
    title: "Review the flags",
    description: "See the clause and what to ask for.",
    icon: (
      <>
        <path d="M5 10h38M5 19h32M5 37h30" stroke="#72808b" strokeWidth="4" />
        <path d="M5 28h37" stroke="var(--color-red-ink)" strokeWidth="4" />
      </>
    ),
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" tabIndex={-1} aria-labelledby="how-it-works-heading" className={styles.section}>
      <div className={styles.content}>
        <h2 id="how-it-works-heading">How It Works</h2>
        <ol role="list" className={styles.steps}>
          {steps.map(({ title, description, icon }, index) => (
            <li key={title} className={styles.step}>
              <span aria-hidden="true" className={styles.number}>{index + 1}</span>
              <div className={styles.description}>
                <svg aria-hidden="true" viewBox="0 0 48 48" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {icon}
                </svg>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
