import React from 'react';

interface CatalogImageProps {
  image: {
    url?: string | null;
    image?: string | null;
    variant_160w?: string | null;
    variant_400w?: string | null;
    alt_text?: string | null;
    image_alt_text?: string | null;
  } | null;
  productName?: string;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
  sizes: string;
  width?: number;
  height?: number;
  fallbackWidth?: 160 | 400;
}

export default function CatalogImage({
  image,
  productName,
  priority = false,
  className,
  style,
  sizes,
  width = 400,
  height = 400,
  fallbackWidth = 400
}: CatalogImageProps) {
  // Support both endpoint shapes: { url, alt_text } from PDP and { image, image_alt_text } from Lists
  const originalUrl = image?.url || image?.image;
  const rawAlt = image?.alt_text || image?.image_alt_text;
  
  const alt = rawAlt || productName || 'Product image';
  
  // Strict requirement: BOTH columns must exist to use variants
  const hasVariants = Boolean(image?.variant_160w && image?.variant_400w);
  
  // Fallback to original image if variants are missing
  const src = hasVariants 
    ? (fallbackWidth === 160 ? image!.variant_160w! : image!.variant_400w!) 
    : originalUrl || '/web-phts/a-17.jpg';

  return (
    <img
      src={src}
      srcSet={hasVariants ? `${image!.variant_160w} 160w, ${image!.variant_400w} 400w` : undefined}
      sizes={sizes}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      className={className}
      style={style}
      width={width}
      height={height}
      decoding="async"
    />
  );
}
