import Link from "next/link";
import { prisma } from "../../lib/prisma";
import { requireUser } from "../../lib/auth";

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("it-IT").format(date);
}

function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export default async function TimesheetPage() {
  await requireUser();

  const entries = await prisma.timesheetEntry.findMany({
    include: {
      client: true,
      activityType: true,
      user: true,
    },
    orderBy: [
      { entryDate: "desc" },
      { startTime: "desc" },
    ],
  });

  return (
    <div className="page-stack">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2 className="section-title" style={{ marginBottom: 6 }}>
            Timesheet
          </h2>
          <p className="empty">Elenco completo delle attività registrate.</p>
        </div>

        <Link href="/nuova-attivita" className="button-primary">
          + Nuova attività
        </Link>
      </div>

      <div className="card">
        <div className="card-body">
          {entries.length === 0 ? (
            <p className="empty">Nessuna attività presente.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Utente</th>
                    <th>Cliente</th>
                    <th>Attività</th>
                    <th>Descrizione</th>
                    <th>Inizio</th>
                    <th>Fine</th>
                    <th>Tempo</th>
                    <th>Fatturabile</th>
                    <th>Spese</th>
                    <th>Onorario</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id.toString()}>
                      <td>{formatDate(entry.entryDate)}</td>
                      <td>{entry.user.fullName}</td>
                      <td>{entry.client.clientName}</td>
                      <td>{entry.activityType.activityName}</td>
                      <td>{entry.description || "-"}</td>
                      <td>{formatTime(entry.startTime)}</td>
                      <td>{formatTime(entry.endTime)}</td>
                      <td>{formatMinutes(entry.durationMinutes)}</td>
                      <td>{entry.isBillable ? "Sì" : "No"}</td>
                      <td>€ {Number(entry.anticipatedExpenses).toFixed(2)}</td>
                      <td>€ {Number(entry.feeAmount).toFixed(2)}</td>
                      <td>
                        <Link
                          href={`/timesheet/${entry.id.toString()}/modifica`}
                          className="button-secondary"
                        >
                          Modifica
                        </Link>
                      </td>
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