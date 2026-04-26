"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    href: "/",
    label: "Nutrition",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={22}
        height={22}
        viewBox="0 0 256 256"
        aria-hidden="true"
      >
        <rect width="256" height="256" fill="none" />
        <line
          x1="80"
          y1="40"
          x2="80"
          y2="88"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="12"
        />
        <line
          x1="80"
          y1="128"
          x2="80"
          y2="224"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="12"
        />
        <path
          d="M208,168H152s0-104,56-128V224"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="12"
        />
        <path
          d="M48,40,40,88a40,40,0,0,0,80,0l-8-48"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="12"
        />
      </svg>
    ),
  },
  {
    href: "/training",
    label: "Training",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={22}
        height={22}
        viewBox="0 0 256 256"
        aria-hidden="true"
      >
        <rect width="256" height="256" fill="none" />
        <rect
          x="56"
          y="56"
          width="40"
          height="144"
          rx="8"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="12"
        />
        <rect
          x="160"
          y="56"
          width="40"
          height="144"
          rx="8"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="12"
        />
        <path
          d="M200,80h24a8,8,0,0,1,8,8v80a8,8,0,0,1-8,8H200"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="12"
        />
        <path
          d="M56,176H32a8,8,0,0,1-8-8V88a8,8,0,0,1,8-8H56"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="12"
        />
        <line
          x1="96"
          y1="128"
          x2="160"
          y2="128"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="12"
        />
        <line
          x1="232"
          y1="128"
          x2="248"
          y2="128"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="12"
        />
        <line
          x1="8"
          y1="128"
          x2="24"
          y2="128"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="12"
        />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={22}
        height={22}
        viewBox="0 0 256 256"
        aria-hidden="true"
      >
        <rect width="512" height="512" fill="none" />
        <circle
          cx="128"
          cy="96"
          r="64"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="12"
        />
        <path
          d="M32,216c19.37-33.47,54.55-56,96-56s76.63,22.53,96,56"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="12"
        />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black border-t border-zinc-900 pb-[env(safe-area-inset-bottom)]">
      <div className="flex max-w-lg mx-auto">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 transition-colors ${
                active ? "text-white" : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              {icon}
              <span className="text-[10px] font-medium tracking-wide">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
