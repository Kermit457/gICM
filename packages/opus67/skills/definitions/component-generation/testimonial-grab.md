# TESTIMONIAL-GRAB Skill

## Overview
Generate production-ready testimonial and social proof components with various layouts, ratings, and media. Supports single testimonials, grids, carousels, and video testimonials.

## Metadata
- **ID**: `testimonial-grab`
- **Category**: Component Generation
- **Complexity**: Intermediate
- **Prerequisites**: React 18+, TypeScript
- **Estimated Time**: 10-15 minutes

## Capabilities
- Single testimonial cards
- Testimonial grids
- Carousel/slider layouts
- Video testimonials
- Star ratings
- Company logos
- Avatar images
- Social media integration
- Auto-rotating testimonials

## Testimonial Component Patterns

### 1. Basic Testimonial Card
```typescript
import React from 'react';

interface TestimonialProps {
  quote: string;
  author: {
    name: string;
    role: string;
    company: string;
    avatar?: string;
  };
  rating?: number;
  className?: string;
}

export function Testimonial({
  quote,
  author,
  rating,
  className = '',
}: TestimonialProps) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {rating && (
        <div className="flex gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              className={`w-5 h-5 ${
                i < rating ? 'text-yellow-400' : 'text-gray-300'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      )}

      <blockquote className="text-gray-900 text-lg mb-6">
        "{quote}"
      </blockquote>

      <div className="flex items-center gap-3">
        {author.avatar ? (
          <img
            src={author.avatar}
            alt={author.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
            {author.name.charAt(0)}
          </div>
        )}
        <div>
          <div className="font-semibold text-gray-900">{author.name}</div>
          <div className="text-sm text-gray-600">
            {author.role} at {author.company}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 2. Testimonial Grid
```typescript
interface TestimonialGridProps {
  testimonials: Array<{
    quote: string;
    author: {
      name: string;
      role: string;
      company: string;
      avatar?: string;
    };
    rating?: number;
  }>;
  columns?: 1 | 2 | 3;
  title?: string;
  subtitle?: string;
}

export function TestimonialGrid({
  testimonials,
  columns = 3,
  title,
  subtitle,
}: TestimonialGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && (
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
            )}
            {subtitle && (
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
            )}
          </div>
        )}

        <div className={`grid ${gridCols[columns]} gap-8`}>
          {testimonials.map((testimonial, index) => (
            <Testimonial key={index} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

### 3. Featured Testimonial
```typescript
interface FeaturedTestimonialProps {
  quote: string;
  author: {
    name: string;
    role: string;
    company: string;
    avatar: string;
  };
  companyLogo?: string;
  metrics?: Array<{
    value: string;
    label: string;
  }>;
}

export function FeaturedTestimonial({
  quote,
  author,
  companyLogo,
  metrics,
}: FeaturedTestimonialProps) {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {companyLogo && (
          <div className="flex justify-center mb-8">
            <img src={companyLogo} alt="Company" className="h-12 opacity-80" />
          </div>
        )}

        <blockquote className="text-2xl sm:text-3xl font-medium text-center mb-8 leading-relaxed">
          "{quote}"
        </blockquote>

        <div className="flex flex-col items-center">
          <img
            src={author.avatar}
            alt={author.name}
            className="w-16 h-16 rounded-full object-cover mb-4"
          />
          <div className="text-center">
            <div className="font-semibold text-lg">{author.name}</div>
            <div className="text-blue-100">
              {author.role}, {author.company}
            </div>
          </div>
        </div>

        {metrics && (
          <div className="grid grid-cols-3 gap-8 mt-12 pt-12 border-t border-blue-400">
            {metrics.map((metric, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold mb-2">{metric.value}</div>
                <div className="text-blue-100">{metric.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
```

### 4. Video Testimonial
```typescript
interface VideoTestimonialProps {
  videoUrl: string;
  thumbnailUrl: string;
  quote: string;
  author: {
    name: string;
    role: string;
    company: string;
  };
}

export function VideoTestimonial({
  videoUrl,
  thumbnailUrl,
  quote,
  author,
}: VideoTestimonialProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="relative aspect-video">
        {!isPlaying ? (
          <>
            <img
              src={thumbnailUrl}
              alt="Video thumbnail"
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => setIsPlaying(true)}
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-40 transition-colors"
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-blue-600 ml-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
            </button>
          </>
        ) : (
          <iframe
            src={videoUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>

      <div className="p-6">
        <blockquote className="text-lg text-gray-900 mb-4">"{quote}"</blockquote>
        <div>
          <div className="font-semibold text-gray-900">{author.name}</div>
          <div className="text-sm text-gray-600">
            {author.role} at {author.company}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 5. Testimonial Carousel
```typescript
interface CarouselProps {
  testimonials: TestimonialProps[];
  autoPlay?: boolean;
  interval?: number;
}

export function TestimonialCarousel({
  testimonials,
  autoPlay = true,
  interval = 5000,
}: CarouselProps) {
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, testimonials.length]);

  const goToSlide = (index: number) => {
    setCurrent(index);
  };

  const goToPrevious = () => {
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setCurrent((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <div className="relative max-w-4xl mx-auto px-4">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {testimonials.map((testimonial, index) => (
            <div key={index} className="w-full flex-shrink-0 px-4">
              <Testimonial {...testimonial} />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={goToPrevious}
        className="absolute left-0 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
        aria-label="Previous testimonial"
      >
        <svg
          className="w-6 h-6 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <button
        onClick={goToNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
        aria-label="Next testimonial"
      >
        <svg
          className="w-6 h-6 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-8">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === current ? 'bg-blue-600 w-8' : 'bg-gray-300'
            }`}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
```

### 6. Social Proof Banner
```typescript
interface SocialProofProps {
  stats: Array<{
    value: string;
    label: string;
  }>;
  logos?: Array<{
    src: string;
    alt: string;
  }>;
}

export function SocialProof({ stats, logos }: SocialProofProps) {
  return (
    <section className="py-12 bg-white border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {logos && logos.length > 0 && (
          <>
            <div className="text-center text-sm text-gray-600 mb-6">
              Trusted by leading companies
            </div>
            <div className="flex flex-wrap justify-center items-center gap-8">
              {logos.map((logo, index) => (
                <img
                  key={index}
                  src={logo.src}
                  alt={logo.alt}
                  className="h-8 opacity-50 hover:opacity-100 transition-opacity grayscale"
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
```

## Usage Examples

### Testimonial Grid Page
```typescript
<TestimonialGrid
  title="What Our Customers Say"
  subtitle="Join thousands of satisfied customers worldwide"
  columns={3}
  testimonials={[
    {
      quote: "This product has completely transformed how we work. Highly recommended!",
      author: {
        name: "John Doe",
        role: "CEO",
        company: "TechCorp",
        avatar: "/avatars/john.jpg",
      },
      rating: 5,
    },
    // More testimonials...
  ]}
/>
```

### Homepage Social Proof
```typescript
<SocialProof
  stats={[
    { value: "10,000+", label: "Happy Customers" },
    { value: "4.9/5", label: "Average Rating" },
    { value: "99%", label: "Satisfaction Rate" },
    { value: "24/7", label: "Support" },
  ]}
  logos={[
    { src: "/logos/company1.svg", alt: "Company 1" },
    { src: "/logos/company2.svg", alt: "Company 2" },
  ]}
/>
```

## Best Practices

1. **Authenticity**
   - Use real testimonials
   - Include full names
   - Add photos/videos
   - Link to profiles

2. **Content**
   - Specific results
   - Emotional impact
   - Before/after story
   - Clear benefits

3. **Design**
   - Easy to scan
   - Consistent layout
   - Professional photos
   - Mobile responsive

4. **Trust**
   - Verifiable sources
   - Company logos
   - Star ratings
   - Case studies

## Generated: 2025-01-04
Version: 1.0.0
