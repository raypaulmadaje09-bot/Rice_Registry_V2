import React, { useState } from 'react';
import { Image as ImageIcon, User as UserIcon, Wheat } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackType?: 'farmer' | 'field' | 'general';
  fallbackSrc?: string;
  containerClassName?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt = 'Image',
  className = '',
  containerClassName = '',
  fallbackType = 'general',
  fallbackSrc,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!src || hasError) {
    if (fallbackSrc) {
      return (
        <img
          src={fallbackSrc}
          alt={alt}
          className={className}
          referrerPolicy="no-referrer"
          {...props}
        />
      );
    }

    return (
      <div
        className={`flex items-center justify-center bg-slate-100 text-slate-400 border border-slate-200 overflow-hidden ${className}`}
        title={alt}
      >
        {fallbackType === 'farmer' ? (
          <UserIcon className="w-1/2 h-1/2 text-slate-400" />
        ) : fallbackType === 'field' ? (
          <Wheat className="w-1/2 h-1/2 text-emerald-500" />
        ) : (
          <ImageIcon className="w-1/2 h-1/2 text-slate-400" />
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden inline-block ${containerClassName}`}>
      {isLoading && (
        <div className={`absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center ${className}`}>
          <ImageIcon className="w-4 h-4 text-slate-300 animate-bounce" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-200'}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        referrerPolicy="no-referrer"
        {...props}
      />
    </div>
  );
};
