import React from "react";
import { getStructuredData } from "@/config/structuredData";

export function StructuredDataScript() {
  const data = getStructuredData("en");

  return (
    <>
      {data.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
