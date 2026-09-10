import { siteConfig } from "@/config/site";

export function OpeningHours({ compact = false }: { compact?: boolean }) {
  return (
    <dl className={compact ? "opening-hours compact" : "opening-hours"}>
      {siteConfig.openingHours.map((item) => (
        <div key={item.day}>
          <dt>{item.day}</dt>
          <dd>{item.hours}</dd>
        </div>
      ))}
    </dl>
  );
}
