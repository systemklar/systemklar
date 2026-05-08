import Image from "next/image";

export function Logo({ iconClassName = "h-8 w-auto" }: { iconClassName?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="systemklar"
      width={1774}
      height={887}
      priority
      className={iconClassName}
    />
  );
}
