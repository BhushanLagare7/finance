"use client";

import { useEffect, useState } from "react";
import ReactCountUp from "react-countup";

interface CountUpProps {
  decimalPlaces?: number;
  decimals?: number;
  end: number;
  formattingFn?: (value: number) => string;
  preserveValue?: boolean;
  start?: number;
}

/**
 * Client-only CountUp wrapper.
 *
 * react-countup uses a DOM ref internally; rendering it during SSR or before
 * the component is mounted causes "Cannot read properties of null (reading
 * 'innerHTML')". We guard against this by only rendering the animation after
 * the component has mounted on the client.
 */
export const CountUp = ({
  decimalPlaces,
  decimals,
  end,
  formattingFn,
  preserveValue,
  start = 0,
}: CountUpProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <span>{formattingFn ? formattingFn(start) : start}</span>;
  }

  return (
    <ReactCountUp
      decimalPlaces={decimalPlaces}
      decimals={decimals}
      end={end}
      formattingFn={formattingFn}
      preserveValue={preserveValue}
    />
  );
};
