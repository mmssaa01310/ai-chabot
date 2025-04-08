'use client';

import * as React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

type OptionType = {
  label: string;
  value: string;
};

type Props = {
  options: OptionType[];
  label?: string;
  placeholder?: string;
  value?: OptionType | null;
  onChange: (value: OptionType | null) => void;
  width?: number;
  dense?: boolean;
};

export default function CustomAutocomplete({
  options,
  label = '選択',
  placeholder = '',
  value,
  onChange,
  width = 300,
  dense = false,
}: Props) {
  return (
    <Autocomplete
      options={options}
      value={value}
      onChange={(_, newValue) => onChange(newValue ?? null)}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, value) => option?.value === value?.value}
      size={dense ? 'small' : 'medium'}
      disablePortal
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          size={dense ? 'small' : 'medium'}
        />
      )}
      sx={{
        width,
        '& .MuiInputBase-root': {
          minHeight: dense ? 32 : 40,
          fontSize: dense ? '0.75rem' : '0.875rem',
          padding: dense ? '0 8px' : '6px 12px',
        },
      }}
    />
  );
}
