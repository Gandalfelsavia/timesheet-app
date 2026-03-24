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

type SearchParams = Promise<{
  date?: string;
  userId?: string;
}>;

export default async function SchedaGiornalieraPage(props: {
  searchParams: SearchParams;
}) {
  await requireUser();

  const searchParams = await props.searchParams;

  const selectedDate =
    searchParams.date || new Date().toISOString().split("T")[0];
  const selectedUserId = searchParams.userId || "";

  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { fullName: "asc" },
  });

  const entries = await prisma.timesheetEntry.findMany({
    where: {
      entryDate: new Date(selectedDate),
      ...(selectedUserId ? { userId: BigInt(selectedUserId) } : {}),
    },
    include: {
      client: true,
      activityType: true,
      user: true,
    },
    orderBy: [{ startTime: "asc" }],
  });

  const totalMinutes = entries.reduce((sum, entry) => sum + entry.durationMinutes, 0);
  const totalFees = entries.reduce((sum, entry) => sum + Number(entry.feeAmount), 0);
  const totalExpenses = entries.reduce(
    (sum, entry) => sum + Number(entry.anticipatedExpenses),
    0
  );

  const selectedUser =
    selectedUserId && entries.length > 0 ? entries[0].user.fullName : "";

  return (
    <div className="page-stack">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 className="section-title" style={{ marginBottom: 6 }}>
            Scheda giornaliera
          </h2>
          <p className="empty">Vista giornaliera delle attività registrate.</p>
        </div>

        <Link href="/nuova-attivita" className="button-primary">
          + Nuova attività
        </Link>
      </div>

      <div className="card">
        <div className="card-body">
          <form method="get" className="form-grid">
            <div className="form-field">
              <label className="form-label">Data</label>
              <input
                className="input"
                type="date"
                name="date"
                defaultValue={selectedDate}
              />
            </div>

            <div className="form-field">
              <label className="form-label">Utente</label>
              <select
                className="select"
                name="userId"
                defaultValue={selectedUserId}
              >
                <option value="">Tutti gli utenti</option>
                {users.map((user) => (
                  <option key={user.id.toString()} value={user.id.toString()}>
                    {user.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div
              className="form-field full"
              style={{ display: "flex", gap: 12, flexDirection: "row" }}
            >
              <button type="submit" className="button-primary">
                Visualizza giornata
              </button>

              <Link href="/scheda-giornaliera" className="button-secondary">
                Reset
              </Link>
            </div>
          </form>
        </div>
      </div>

      <div className="metrics-row">
        <div className="card">
          <div className="card-body">
            <div className="kpi-label">Ore del giorno</div>
            <div className="kpi-value">{formatMinutes(totalMinutes)}</div>
            <div className="kpi-note">
              {selectedUserId
                ? `Totale per ${selectedUser || "utente selezionato"}`
                : "Tempo totale registrato"}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="kpi-label">Spese del giorno</div>
            <div className="kpi-value">€ {totalExpenses.toFixed(2)}</div>
            <div className="kpi-note">Spese anticipate collegate</div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="kpi-label">Onorari del giorno</div>
            <div className="kpi-value">€ {totalFees.toFixed(2)}</div>
            <div className="kpi-note">Valore economico giornaliero</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h3 className="section-title">
            Attività del {formatDate(new Date(selectedDate))}
            {selectedUserId ? ` — ${selectedUser || "utente selezionato"}` : ""}
          </h3>

          {entries.length === 0 ? (
            <p className="empty">Nessuna attività registrata per i filtri selezionati.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
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