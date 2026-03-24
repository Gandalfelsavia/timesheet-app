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
  clientId?: string;
  from?: string;
  to?: string;
}>;

export default async function ReportClientePage(props: {
  searchParams: SearchParams;
}) {
  await requireUser();

  const searchParams = await props.searchParams;

  const selectedClientId = searchParams.clientId || "";
  const from = searchParams.from || "";
  const to = searchParams.to || "";

  const clients = await prisma.client.findMany({
    orderBy: { clientName: "asc" },
  });

  const where: any = {};

  if (selectedClientId) {
    where.clientId = BigInt(selectedClientId);
  }

  if (from || to) {
    where.entryDate = {};
    if (from) where.entryDate.gte = new Date(from);
    if (to) where.entryDate.lte = new Date(to);
  }

  const entries =
    selectedClientId
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

  const selectedClient =
    selectedClientId && entries.length > 0 ? entries[0].client.clientName : "";

  const totalMinutes = entries.reduce((sum, e) => sum + e.durationMinutes, 0);
  const totalFees = entries.reduce((sum, e) => sum + Number(e.feeAmount), 0);
  const totalExpenses = entries.reduce(
    (sum, e) => sum + Number(e.anticipatedExpenses),
    0
  );

  // 👉 CSV
  const csvData = entries.map((e) => [
    formatDate(e.entryDate),
    e.user.fullName,
    e.client.clientName,
    e.activityType.activityName,
    e.description || "",
    formatMinutes(e.durationMinutes),
    Number(e.anticipatedExpenses).toFixed(2),
    Number(e.feeAmount).toFixed(2),
  ]);

  const csvContent =
    "Data;Utente;Cliente;Attività;Descrizione;Tempo;Spese;Onorario\n" +
    csvData.map((row) => row.join(";")).join("\n");

  const csvUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;

  return (
    <div className="page-stack">
      <div>
        <h2 className="section-title">Report cliente</h2>
        <p className="empty">Riepilogo tempi e valori per cliente.</p>
      </div>

      {/* FILTRI */}
      <div className="card">
        <div className="card-body">
          <form method="get" className="form-grid">
            <div className="form-field">
              <label className="form-label">Cliente</label>
              <select className="select" name="clientId" defaultValue={selectedClientId}>
                <option value="">Seleziona cliente</option>
                {clients.map((c) => (
                  <option key={c.id.toString()} value={c.id.toString()}>
                    {c.clientName}
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
              <button className="button-primary">Genera report</button>

              {entries.length > 0 && (
                <a href={csvUrl} download="report_cliente.csv" className="button-secondary">
                  Esporta CSV
                </a>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* KPI */}
      {selectedClientId && (
        <>
          <div className="metrics-row">
            <div className="card">
              <div className="card-body">
                <div className="kpi-label">Cliente</div>
                <div className="kpi-value">{selectedClient || "-"}</div>
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

          {/* TABELLA */}
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
                        <th>Utente</th>
                        <th>Attività</th>
                        <th>Descrizione</th>
                        <th>Tempo</th>
                        <th>Spese</th>
                        <th>Onorario</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((e) => (
                        <tr key={e.id.toString()}>
                          <td>{formatDate(e.entryDate)}</td>
                          <td>{e.user.fullName}</td>
                          <td>{e.activityType.activityName}</td>
                          <td>{e.description || "-"}</td>
                          <td>{formatMinutes(e.durationMinutes)}</td>
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