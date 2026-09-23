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
        d="M52 12H116L144 40V156H52V12Z"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinejoin="miter"
      />
      <path d="M116 12V40H144" stroke="currentColor" strokeWidth="5" />
      <path d="M70 57H113" stroke="currentColor" strokeWidth="5" />
      <path d="M70 68H125" stroke="currentColor" strokeWidth="5" />
      <path d="M70 79H119" stroke="currentColor" strokeWidth="5" />
      <path d="M70 113H123" stroke="currentColor" strokeWidth="5" />
      <path d="M70 124H113" stroke="currentColor" strokeWidth="5" />
      <path d="M70 135H125" stroke="currentColor" strokeWidth="5" />
      <path
        d="M28 86L47 80L61 86L76 78L92 86L105 80L105 98L92 92L76 100L61 92L47 98L28 94V86Z"
        fill="#315DDA"
      />
      <path
        d="M105 80L119 87L135 79L152 86L163 82V100L152 96L135 103L119 95L105 98V80Z"
        fill="#E5453A"
      />
    </svg>
  );
}
