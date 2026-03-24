import "./globals.css";
import Link from "next/link";
import { getCurrentUser } from "../lib/auth";

export const metadata = {
  title: "Timesheet Studio",
  description: "Gestione tempi studio",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <html lang="it">
        <body>{children}</body>
      </html>
    );
  }

const menuItems = [
  { href: "/", label: "Dashboard" },
  { href: "/timesheet", label: "Timesheet" },
  { href: "/scheda-giornaliera", label: "Scheda giornaliera" },
  ...(user.role === "admin"
    ? [
        { href: "/utenti", label: "Utenti" },
        { href: "/clienti", label: "Clienti" },
        { href: "/attivita", label: "Attività" },
      ]
    : []),
  { href: "/nuova-attivita", label: "Nuova attività" },
  { href: "/report-cliente", label: "Report cliente" },
  { href: "/report-utente", label: "Report utente" },
];

  return (
    <html lang="it">
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <div className="brand-box">
<img
  src="/logo.png"
  alt="Logo"
  style={{
    width: 42,
    height: 42,
    borderRadius: 10,
    objectFit: "contain",
    background: "white",
    padding: 4,
  }}
/>
       <div>
                <div className="brand-kicker">Studio</div>
                <div className="brand-title">Timesheet</div>
              </div>
            </div>

            <nav className="sidebar-nav">
              {menuItems.map((item) => (
                <Link key={item.href} href={item.href} className="nav-link">
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          <div className="main-area">
            <header className="topbar">
              <div>
                <h1 className="topbar-title">Gestione tempi</h1>
                <p className="topbar-subtitle">
                  Monitoraggio attività, clienti e onorari
                </p>
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700 }}>{user.fullName}</div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>{user.role}</div>
                </div>
                <Link href="/logout" className="button-secondary">
                  Logout
                </Link>
              </div>
            </header>

            <main className="page-content">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}