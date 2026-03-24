import { prisma } from "../../lib/prisma";
import { requireUser } from "../../lib/auth";

function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("it-IT").format(date);
}

type SearchParams = Promise<{
  userId?: string;
  from?: string;
  to?: string;
}>;

export default async function ReportUtentePage(props: {
  searchParams: SearchParams;
}) {
  await requireUser();

  const searchParams = await props.searchParams;

  const selectedUserId = searchParams.userId || "";
  const from = searchParams.from || "";
  const to = searchParams.to || "";

  const users = await prisma.user.findMany({
    orderBy: { fullName: "asc" },
  });

  const where: any = {};

  if (selectedUserId) {
    where.userId = BigInt(selectedUserId);
  }

  if (from || to) {
    where.entryDate = {};
    if (from) where.entryDate.gte = new Date(from);
    if (to) where.entryDate.lte = new Date(to);
  }

  const entries = selectedUserId
    ? await prisma.timesheetEntry.findMany({
        where,
        include: {
          client: true,
          activityType: true,
          user: true,
        },
        orderBy: [{ entryDate: "desc" }, { startTime: "asc" }],
      })
    : [];

  const selectedUser =
    selectedUserId && entries.length > 0 ? entries[0].user.fullName : "";

  const totalMinutes = entries.reduce((sum, e) => sum + e.durationMinutes, 0);
  const totalFees = entries.reduce((sum, e) => sum + Number(e.feeAmount), 0);
  const totalExpenses = entries.reduce(
    (sum, e) => sum + Number(e.anticipatedExpenses),
    0
  );
  const billableCount = entries.filter((e) => e.isBillable).length;

  const csvData = entries.map((e) => [
    formatDate(e.entryDate),
    e.user.fullName,
    e.client.clientName,
    e.activityType.activityName,
    e.description || "",
    formatMinutes(e.durationMinutes),
    e.isBillable ? "Si" : "No",
    Number(e.anticipatedExpenses).toFixed(2),
    Number(e.feeAmount).toFixed(2),
  ]);

  const csvContent =
    "Data;Utente;Cliente;Attività;Descrizione;Tempo;Fatturabile;Spese;Onorario\n" +
    csvData.map((row) => row.join(";")).join("\n");

  const csvUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;

  return (
    <div className="page-stack">
      <div>
        <h2 className="section-title">Report utente</h2>
        <p className="empty">Riepilogo tempi e valori per utente.</p>
      </div>

      <div className="card">
        <div className="card-body">
          <form method="get" className="form-grid">
            <div className="form-field">
              <label className="form-label">Utente</label>
              <select className="select" name="userId" defaultValue={selectedUserId}>
                <option value="">Seleziona utente</option>
                {users.map((user) => (
                  <option key={user.id.toString()} value={user.id.toString()}>
                    {user.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Data da</label>
              <input className="input" type="date" name="from" defaultValue={from} />
            </div>

            <div className="form-field">
              <label className="form-label">Data a</label>
              <input className="input" type="date" name="to" defaultValue={to} />
            </div>

            <div className="form-field full" style={{ display: "flex", gap: 12 }}>
              <button type="submit" className="button-primary">
                Genera report
              </button>

              {entries.length > 0 && (
                <a href={csvUrl} download="report_utente.csv" className="button-secondary">
                  Esporta CSV
                </a>
              )}
            </div>
          </form>
        </div>
      </div>

      {selectedUserId && (
        <>
          <div className="metrics-row">
            <div className="card">
              <div className="card-body">
                <div className="kpi-label">Utente</div>
                <div className="kpi-value">{selectedUser || "-"}</div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="kpi-label">Ore</div>
                <div className="kpi-value">{formatMinutes(totalMinutes)}</div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="kpi-label">Onorari</div>
                <div className="kpi-value">€ {totalFees.toFixed(2)}</div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="kpi-label">Spese</div>
                <div className="kpi-value">€ {totalExpenses.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="metrics-row">
            <div className="card">
              <div className="card-body">
                <div className="kpi-label">Numero attività</div>
                <div className="kpi-value">{entries.length}</div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="kpi-label">Fatturabili</div>
                <div className="kpi-value">{billableCount}</div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="kpi-label">Media per attività</div>
                <div className="kpi-value">
                  {entries.length > 0
                    ? formatMinutes(Math.round(totalMinutes / entries.length))
                    : "0h 0m"}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              {entries.length === 0 ? (
                <p className="empty">Nessuna attività trovata.</p>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Cliente</th>
                        <th>Attività</th>
                        <th>Descrizione</th>
                        <th>Tempo</th>
                        <th>Fatturabile</th>
                        <th>Spese</th>
                        <th>Onorario</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((e) => (
                        <tr key={e.id.toString()}>
                          <td>{formatDate(e.entryDate)}</td>
                          <td>{e.client.clientName}</td>
                          <td>{e.activityType.activityName}</td>
                          <td>{e.description || "-"}</td>
                          <td>{formatMinutes(e.durationMinutes)}</td>
                          <td>{e.isBillable ? "Sì" : "No"}</td>
                          <td>€ {Number(e.anticipatedExpenses).toFixed(2)}</td>
                          <td>€ {Number(e.feeAmount).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}