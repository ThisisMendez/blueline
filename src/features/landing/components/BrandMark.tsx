type BrandMarkProps = {
  className?: string;
  title?: string;
};

/** The contract is the mark: one document, cut open at the consequential line. */
export function BrandMark({ className, title }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 180 170"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M42 10H122L151 39V158H42V10Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="miter"
      />
      <path d="M122 10V39H151" stroke="currentColor" strokeWidth="4" />
      <path d="M63 54H120" stroke="currentColor" strokeWidth="4" />
      <path d="M63 64H132" stroke="currentColor" strokeWidth="4" />
      <path d="M63 74H126" stroke="currentColor" strokeWidth="4" />
      <path d="M63 111H130" stroke="currentColor" strokeWidth="4" />
      <path d="M63 121H118" stroke="currentColor" strokeWidth="4" />
      <path d="M63 131H132" stroke="currentColor" strokeWidth="4" />
      <path
        d="M18 83L36 78L52 84L69 77L87 85L102 79L114 86L130 78L145 83L162 77V94L145 89L130 96L114 90L102 97L87 90L69 97L52 89L36 95L18 91V83Z"
        fill="#315DDA"
      />
      <path
        d="M90 85L102 79L114 86L130 78L145 83L162 77V94L145 89L130 96L114 90L102 97L90 91V85Z"
        fill="#E5453A"
      />
    </svg>
  );
}
