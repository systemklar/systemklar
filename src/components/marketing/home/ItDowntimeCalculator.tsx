"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";

const STARTER_YEARLY = 499 * 12;

function formatKr(value: number) {
  return new Intl.NumberFormat("da-DK", {
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

type SliderFieldProps = {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
};

function SliderField({ id, label, value, min, max, step, unit, onChange }: SliderFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={id} className="text-sm font-medium text-[#1E3448]">
          {label}
        </label>
        <span className="text-sm font-medium tabular-nums text-[#4A7FA5]">
          {value} {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="marketing-range w-full"
      />
    </div>
  );
}

export function ItDowntimeCalculator() {
  const [employees, setEmployees] = useState(12);
  const [hourlyWage, setHourlyWage] = useState(350);
  const [downtimeHours, setDowntimeHours] = useState(12);

  const { annualLoss, savings } = useMemo(() => {
    const loss = employees * hourlyWage * downtimeHours;
    const savingsAmount = Math.max(0, loss - STARTER_YEARLY);
    return { annualLoss: loss, savings: savingsAmount };
  }, [employees, hourlyWage, downtimeHours]);

  return (
    <section id="it-beregner" className="scroll-mt-24 bg-[#1E3448] px-6 py-20 md:py-28">
      <div className="mx-auto max-w-4xl">
        <ScrollReveal className="text-center">
          <h2 className="text-3xl font-light tracking-tight text-white md:text-4xl">
            Hvad koster IT-nedetid din virksomhed?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#7A9AB0]">
            Beregn hvad en times nedetid koster — og sammenlign med prisen på systemklar
          </p>
        </ScrollReveal>

        <ScrollReveal staggerMs={100}>
          <div className="mt-12 rounded-2xl border border-[#C8D8E4]/20 bg-white p-6 md:p-10">
            <div className="space-y-8">
              <SliderField
                id="calc-employees"
                label="Antal ansatte"
                value={employees}
                min={1}
                max={200}
                step={1}
                unit="ansatte"
                onChange={setEmployees}
              />
              <SliderField
                id="calc-wage"
                label="Gennemsnitlig timeløn"
                value={hourlyWage}
                min={150}
                max={600}
                step={10}
                unit="kr"
                onChange={setHourlyWage}
              />
              <SliderField
                id="calc-downtime"
                label="Timer nedetid per år"
                value={downtimeHours}
                min={1}
                max={50}
                step={1}
                unit="timer"
                onChange={setDowntimeHours}
              />
            </div>

            <div className="mt-10 space-y-4 border-t border-[#E0EAF0] pt-8">
              <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
                <span className="text-sm text-[#4A6478]">Estimeret tab per år</span>
                <span className="text-2xl font-light tabular-nums text-[#1E3448] md:text-3xl">
                  {formatKr(annualLoss)} kr
                </span>
              </div>
              <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
                <span className="text-sm text-[#4A6478]">systemklar koster</span>
                <span className="text-lg font-medium text-[#4A7FA5]">499–999 kr/md</span>
              </div>
              <div className="flex flex-col justify-between gap-1 rounded-xl bg-[#EAF1F7] px-4 py-3 sm:flex-row sm:items-baseline">
                <span className="text-sm font-medium text-[#4A6478]">Du sparer</span>
                <span className="text-lg font-medium tabular-nums text-[#3A7A4A]">
                  op til {formatKr(savings)} kr
                </span>
              </div>
            </div>

            <Link
              href="/login"
              className="mt-8 flex min-h-[48px] w-full items-center justify-center rounded-full bg-[#4A7FA5] text-sm font-medium text-white transition-colors hover:bg-[#3A6F95] sm:w-auto sm:px-10"
            >
              Kom i gang for 499 kr/md
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
