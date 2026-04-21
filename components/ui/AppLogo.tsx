interface AppLogoMarkProps {
  className?: string
}

/**
 * MyHome logo mark — a house silhouette with an arch door cutout.
 * Uses currentColor so it adapts to any text-color utility.
 */
export function AppLogoMark({ className }: AppLogoMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* House silhouette + arch door as negative space (evenodd) */}
      <path
        d="M12 2L22 12H20V22H4V12H2L12 2Z M10 22V17A2 2 0 0 1 14 17V22Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  )
}
