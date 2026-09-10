import Image from "next/image";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  return (
    <div className="product-gallery" aria-label={`${name} image gallery`}>
      {images.map((image, index) => (
        <figure className={`product-gallery-item gallery-item-${index + 1}`} key={image}>
          <Image
            src={image}
            alt={`${name}, view ${index + 1}`}
            fill
            priority={index === 0}
            sizes="(max-width: 820px) 88vw, 58vw"
          />
          <figcaption>{String(index + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</figcaption>
        </figure>
      ))}
    </div>
  );
}
