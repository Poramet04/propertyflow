import { useState } from "react";
const FALLBACK = "/property-placeholder.svg";
export default function SafeImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [current, setCurrent] = useState(src);
  return (
    <img
      src={current}
      alt={alt}
      className={className}
      onError={() => {
        if (current !== FALLBACK) setCurrent(FALLBACK);
      }}
    />
  );
}
