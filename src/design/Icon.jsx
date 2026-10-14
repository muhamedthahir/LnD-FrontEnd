const paths = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  users: <><circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v3"/></>,
  building: <><path d="M4 21V6l8-3 8 3v15M2 21h20M9 21v-5h6v5"/><path d="M8 8h1m6 0h1M8 12h1m6 0h1"/></>,
  book: <><path d="M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H4zm16 0h-4a3 3 0 0 0-3 3v14a4 4 0 0 1 4-2h3z"/></>,
  layers: <><path d="m12 3 9 5-9 5-9-5zM3 12l9 5 9-5M3 17l9 5 9-5"/></>,
  check: <><path d="m8 12 3 3 6-6M20 12v8H4V4h11"/></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></>,
  settings: <><path d="M4 7h16M4 17h16"/><circle cx="8" cy="7" r="3"/><circle cx="16" cy="17" r="3"/></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
  arrow: <><path d="M5 12h14m-5-5 5 5-5 5"/></>,
  moon: <><path d="M20 14a8 8 0 0 1-10-10 9 9 0 1 0 10 10z"/></>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/></>,
  chevron: <><path d="m9 5 7 7-7 7"/></>,
  exit: <><path d="M9 3H4v18h5m6-14 5 5-5 5M8 12h12"/></>,
  person: <><circle cx="12" cy="8" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  close: <><path d="m6 6 12 12M6 18 18 6"/></>,
  code: <><path d="m8 5-6 7 6 7m8-14 6 7-6 7m-3-17-2 20"/></>
}
export default function Icon({ name = 'grid', size = 20, ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.grid}</svg>
}
