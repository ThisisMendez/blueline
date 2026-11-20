import styles from "./WalkthroughVideo.module.css";

export function WalkthroughVideo({ headingLevel = 2 }: { headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 3 ? "h3" : "h2";

  return (
    <section aria-labelledby="walkthrough-heading" className={styles.walkthrough}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>Product &amp; Approach · 1:30</p>
        <Heading id="walkthrough-heading" className={styles.heading}>
          See Blueline Lease in action
        </Heading>
        <p className={styles.description} id="walkthrough-description">
          A quick walkthrough of how Blueline Lease helps renters and landlords
          understand the terms in their lease documents.
        </p>
        <p className={styles.note}>
          Recorded with a fictional lease and sample analysis.
        </p>
      </div>
      <video
        className={styles.player}
        width={1920}
        height={1080}
        controls
        playsInline
        preload="none"
        poster="/media/blueline-product-approach.jpg"
        aria-label="Blueline Lease Product & Approach walkthrough"
        aria-describedby="walkthrough-description"
      >
        <source src="/media/blueline-product-approach.mp4" type="video/mp4" />
        <track
          kind="captions"
          src="/media/blueline-product-approach.vtt"
          srcLang="en"
          label="English"
          default
        />
        <p>
          <a href="/media/blueline-product-approach.mp4">Download the walkthrough video</a>.
        </p>
      </video>
    </section>
  );
}
