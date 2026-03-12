import Image from "next/image";

export const Logo = () => {
  return (
    <Image
      height={72}
      width={220}
      alt="eCurs logo"
      src="/logo-extended.svg"
      className="h-auto w-full max-w-[220px]"
      sizes="(max-width: 768px) 180px, 220px"
      priority
    />
  );
};
