"use client";

import { HomeFinalCta } from "@/components/marketing/home/HomeFinalCta";
import { HomeHero } from "@/components/marketing/home/HomeHero";
import { HomePlatformGrid } from "@/components/marketing/home/HomePlatformGrid";
import { HomePricingTeaser } from "@/components/marketing/home/HomePricingTeaser";
import { HomeTestimonials } from "@/components/marketing/home/HomeTestimonials";
import { HomeTwoPillars } from "@/components/marketing/home/HomeTwoPillars";

export function MarketingHomeContent() {
  return (
    <>
      <HomeHero />
      <HomeTwoPillars />
      <HomePlatformGrid />
      <HomeTestimonials />
      <HomePricingTeaser />
      <HomeFinalCta />
    </>
  );
}
