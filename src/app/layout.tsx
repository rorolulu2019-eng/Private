import type { Metadata } from 'next';
import './styles.css';
export const metadata: Metadata = { title: 'FinanzPartner — Finanzierung, die weiterdenkt', description: 'Finanzierung verständlich planen. Unverbindlicher Ratenrechner und persönliche Beratung.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="de"><body>{children}</body></html>; }
