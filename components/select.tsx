"use client";

import { useMemo } from "react";
import { SingleValue } from "react-select";
import CreatableSelect from "react-select/creatable";

interface SelectProps {
  onChange: (value?: string) => void;
  onCreate?: (value: string) => void;
  options?: { label: string; value: string }[];
  value?: string | null | undefined;
  disabled?: boolean;
  placeholder?: string;
}

export const Select = ({
  onChange,
  onCreate,
  options = [],
  value,
  disabled,
  placeholder,
}: SelectProps) => {
  const onSelect = (option: SingleValue<{ label: string; value: string }>) => {
    onChange(option?.value);
  };

  const formattedValue = useMemo(() => {
    return options.find((option) => option.value === value);
  }, [value, options]);

  return (
    <CreatableSelect
      className="text-sm h-10"
      isDisabled={disabled}
      options={options}
      placeholder={placeholder}
      styles={{
        control: (base) => ({
          ...base,
          borderColor: "#E2E8F0",
          ":hover": {
            borderColor: "#E2E8F0",
          },
        }),
      }}
      value={formattedValue}
      onChange={onSelect}
      onCreateOption={onCreate}
    />
  );
};
