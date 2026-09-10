import Image from "next/image";

export function BrandWordmark({ light = false }: { light?: boolean }) {
  return (
    <Image
      className="brand-wordmark"
      src={light ? "/brand/logo-light.svg" : "/brand/logo-dark.svg"}
      alt="Nuvola Home"
      width={190}
      height={32}
      priority
    />
  );
}

export function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <span className={light ? "brand-mark light" : "brand-mark"} aria-hidden="true">
      <Image src="/brand/mark.svg" alt="" width={48} height={48} />
    </span>
  );
}
