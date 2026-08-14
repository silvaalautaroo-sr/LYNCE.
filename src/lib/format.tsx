import React from "react";

/**
 * Parses markdown-style **bold**, <b>bold</b>, or <gradient>gradient</gradient> tags in a string
 * and returns React nodes with styled elements.
 */
export function formatTextWithBold(
  text: string,
  boldClassName = "font-bold text-ink",
  gradientClassName = "keyword-gradient font-bold not-italic"
): React.ReactNode {
  if (!text || typeof text !== "string") return text;

  const parts = text.split(/(\*\*.*?\*\*|<b>.*?<\/b>|<gradient>.*?<\/gradient>)/g);
  if (parts.length === 1) return text;

  return parts.map((part, index) => {
    if (part.startsWith("<gradient>") && part.endsWith("</gradient>")) {
      return (
        <span key={index} className={gradientClassName}>
          {part.slice(10, -11)}
        </span>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className={boldClassName}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("<b>") && part.endsWith("</b>")) {
      return (
        <strong key={index} className={boldClassName}>
          {part.slice(3, -4)}
        </strong>
      );
    }
    return part;
  });
}
