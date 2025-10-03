import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  showNumeric?: boolean;
  className?: string;
  readonly?: boolean;
  onChange?: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 16,
  showNumeric = false,
  className = '',
  readonly = true,
  onChange
}) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = maxRating - Math.ceil(rating);

  const handleStarClick = (starIndex: number) => {
    if (!readonly && onChange) {
      onChange(starIndex + 1);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center">
        {/* Full stars */}
        {Array(fullStars).fill(null).map((_, index) => (
          <Star
            key={`full-${index}`}
            size={size}
            className={`text-yellow-500 fill-current ${!readonly ? 'cursor-pointer hover:text-yellow-600' : ''}`}
            onClick={() => handleStarClick(index)}
          />
        ))}
        
        {/* Half star */}
        {hasHalfStar && (
          <div className="relative">
            <Star
              size={size}
              className="text-gray-300"
            />
            <div 
              className="absolute top-0 left-0 overflow-hidden"
              style={{ width: `${(rating % 1) * 100}%` }}
            >
              <Star
                size={size}
                className="text-yellow-500 fill-current"
              />
            </div>
          </div>
        )}
        
        {/* Empty stars */}
        {Array(emptyStars).fill(null).map((_, index) => (
          <Star
            key={`empty-${index}`}
            size={size}
            className={`text-gray-300 ${!readonly ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={() => handleStarClick(fullStars + (hasHalfStar ? 1 : 0) + index)}
          />
        ))}
      </div>
      
      {showNumeric && (
        <span className="text-sm text-gray-600 ml-1">
          ({Number(rating).toFixed(1)})
        </span>
      )}
    </div>
  );
};

export default StarRating;