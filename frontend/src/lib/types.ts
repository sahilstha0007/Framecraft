export interface Frame {
  id: number;
  name: string;
  category: string;
  material: string;
  sizes: string[];
  priceRange: string;
  image: string;
  description: string;
  popular: boolean;
}

export interface GalleryItem {
  id: number;
  title: string;
  category: string;
  image: string;
  description: string;
  client: string;
}

export interface Service {
  id: number;
  title: string;
  description: string;
  icon: string;
  features: string[];
}

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  rating: number;
  image: string;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  bio: string;
  image: string;
  experience: string;
}

export interface FrameStyle {
  id: string;
  name: string;
  preview: string;
  colors: string[];
}

export interface GlassType {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
}

export interface MatOption {
  id: string;
  name: string;
  color: string;
  price: number;
  description: string;
}