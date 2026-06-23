interface TabIconProps {
  active?: boolean;
}

const color = (active?: boolean) => (active ? '#7b5cff' : '#8a8aaa');

export function TabIconDiscover({ active }: TabIconProps) {
  const c = color(active);
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8" />
      <path d="M8 12h8M12 8v8" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function TabIconCreate({ active }: TabIconProps) {
  const c = color(active);
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 17.5V20h2.5L17 9.5l-2.5-2.5L4 17.5z"
        stroke={c}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 5.5l2.5 2.5"
        stroke={c}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M16 3l5 5"
        stroke={c}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TabIconProfile({ active }: TabIconProps) {
  const c = color(active);
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={c} strokeWidth="1.8" />
      <path
        d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6"
        stroke={c}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
