"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TodayRedirect({ serverDate }: { serverDate: string }) {
  const router = useRouter();

  useEffect(() => {
    const localToday = new Date(
      Date.now() - new Date().getTimezoneOffset() * 60000,
    )
      .toISOString()
      .slice(0, 10);

    if (serverDate !== localToday) {
      router.replace(`/?date=${localToday}`);
    }
  }, [serverDate, router]);

  return null;
}
