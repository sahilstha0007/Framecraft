"use client";

import { services } from "@/lib/data";
import type { Service } from "@/lib/types";
import { useLocalizedCollection } from "@/lib/useLocalizedCollection";
import ServiceCard from "./ServiceCard";

export default function ServicesGrid() {
  const { data } = useLocalizedCollection<Service>("services", services);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.map((service, i) => (
        <ServiceCard key={service.id} service={service} index={i} />
      ))}
    </div>
  );
}
