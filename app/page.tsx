import Link from "next/link";
import { prisma } from "../lib/prisma";
import { requireUser } from "../lib/auth";

function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export default async function HomePage() {
  await requireUser();

  const entries = await prisma.timesheetEntry.findMany({
    include: {
      client: true,
      activityType: true,
      user: true,
    },
    orderBy: [{ entryDate: "desc" }, { startTime: "asc" }],
    take: 10,
  });

  const totalMinutes = entries.reduce((sum, entry) => sum + entry.durationMinutes, 0);
  const totalFees = entries.reduce((sum, entry) => sum + Number(entry.feeAmount), 0);
  const totalExpenses = entries.reduce(
    (sum, entry) => sum + Number(entry.anticipatedExpenses),
    0
  );
  const billableCount = entries.filter((entry) => entry.isBillable).length;

  return (
    <div className="page-stack">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 className="section-title" style={{ marginBottom: 6 }}>
            Dashboard
          </h2>
          <p className="empty">Panoramica rapida delle ultime attività registrate.</p>
        </div>

        <Link href="/nuova-attivita" className="button-primary">
          + Nuova attività
        </Link>
      </div>

      <div className="card-grid">
        <div className="card">
          <div className="card-body">
            <div className="kpi-label">Ore registrate</div>
            <div className="kpi-value">{formatMinutes(totalMinutes)}</div>
            <div className="kpi-note">Totale sulle ultime righe caricate</div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="kpi-label">Onorari</div>
            <div className="kpi-value">€ {totalFees.toFixed(2)}</div>
            <div className="kpi-note">Valore economico complessivo</div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="kpi-label">Spese anticipate</div>
            <div className="kpi-value">€ {totalExpenses.toFixed(2)}</div>
            <div className="kpi-note">Totale spese collegate</div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="kpi-label">Attività fatturabili</div>
            <div className="kpi-value">{billableCount}</div>
            <div className="kpi-note">Numero righe fatturabili</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h3 className="section-title">Ultime attività</h3>

          {entries.length === 0 ? (
            <p className="empty">Nessuna attività presente.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Cliente</th>
                    <th>Attività</th>
                    <th>Utente</th>
                    <th>Tempo</th>
                    <th>Fatturabile</th>
                    <th>Onorario</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id.toString()}>
                      <td>{entry.entryDate.toLocaleDateString("it-IT")}</td>
                      <td>{entry.client.clientName}</td>
                      <td>{entry.activityType.activityName}</td>
                      <td>{entry.user.fullName}</td>
                      <td>{formatMinutes(entry.durationMinutes)}</td>
                      <td>{entry.isBillable ? "Sì" : "No"}</td>
                      <td>€ {Number(entry.feeAmount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}