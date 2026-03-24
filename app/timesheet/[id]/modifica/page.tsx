import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "../../../../lib/prisma";

function toDateInputValue(date: Date) {
  return date.toISOString().split("T")[0];
}

function toTimeInputValue(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "UTC",
  }).format(date);
}

async function updateEntry(formData: FormData) {
  "use server";

  const idValue = String(formData.get("id") || "");
  const date = String(formData.get("date") || "");
  const clientIdValue = String(formData.get("clientId") || "");
  const activityTypeIdValue = String(formData.get("activityTypeId") || "");
  const description = String(formData.get("description") || "");
  const startTime = String(formData.get("startTime") || "");
  const endTime = String(formData.get("endTime") || "");
  const isBillable = formData.get("isBillable") === "on";
  const anticipatedExpenses = Number(formData.get("anticipatedExpenses") || 0);
  const feeAmount = Number(formData.get("feeAmount") || 0);

  if (!idValue || !date || !clientIdValue || !activityTypeIdValue || !startTime || !endTime) {
    throw new Error("Compila tutti i campi obbligatori.");
  }

  const id = BigInt(idValue);
  const clientId = BigInt(clientIdValue);
  const activityTypeId = BigInt(activityTypeIdValue);

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  const durationMinutes = endMinutes - startMinutes;

  if (durationMinutes <= 0) {
    throw new Error("L'orario di fine deve essere successivo all'orario di inizio.");
  }

  await prisma.timesheetEntry.update({
    where: { id },
    data: {
      entryDate: new Date(date),
      clientId,
      activityTypeId,
      description,
      startTime: new Date(`1970-01-01T${startTime}:00Z`),
      endTime: new Date(`1970-01-01T${endTime}:00Z`),
      durationMinutes,
      isBillable,
      anticipatedExpenses: isBillable ? anticipatedExpenses : 0,
      feeAmount: isBillable ? feeAmount : 0,
    },
  });

  redirect("/timesheet");
}

async function deleteEntry(formData: FormData) {
  "use server";

  const idValue = String(formData.get("id") || "");
  if (!idValue) {
    throw new Error("ID mancante.");
  }

  await prisma.timesheetEntry.delete({
    where: { id: BigInt(idValue) },
  });

  redirect("/timesheet");
}

export default async function ModificaAttivitaPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const id = BigInt(params.id);

  const entry = await prisma.timesheetEntry.findUnique({
    where: { id },
  });

  if (!entry) {
    notFound();
  }

  const clients = await prisma.client.findMany({
    orderBy: { clientName: "asc" },
  });

  const activityTypes = await prisma.activityType.findMany({
    orderBy: { activityName: "asc" },
  });

  return (
    <div className="page-stack">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 className="section-title" style={{ marginBottom: 6 }}>
            Modifica attività
          </h2>
          <p className="empty">Aggiorna o elimina una riga del timesheet.</p>
        </div>

        <Link href="/timesheet" className="button-secondary">
          Torna al timesheet
        </Link>
      </div>

      <div className="card">
        <div className="card-body">
          <form action={updateEntry} className="form-grid">
            <input type="hidden" name="id" value={entry.id.toString()} />

            <div className="form-field">
              <label className="form-label">Data</label>
              <input
                className="input"
                type="date"
                name="date"
                defaultValue={toDateInputValue(entry.entryDate)}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">Cliente</label>
              <select
                className="select"
                name="clientId"
                defaultValue={entry.clientId.toString()}
                required
              >
                <option value="">Seleziona cliente</option>
                {clients.map((client) => (
                  <option key={client.id.toString()} value={client.id.toString()}>
                    {client.clientName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Attività</label>
              <select
                className="select"
                name="activityTypeId"
                defaultValue={entry.activityTypeId.toString()}
                required
              >
                <option value="">Seleziona attività</option>
                {activityTypes.map((activity) => (
                  <option key={activity.id.toString()} value={activity.id.toString()}>
                    {activity.activityName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Descrizione</label>
              <input
                className="input"
                type="text"
                name="description"
                defaultValue={entry.description || ""}
              />
            </div>

            <div className="form-field">
              <label className="form-label">Orario inizio</label>
              <input
                className="input"
                type="time"
                name="startTime"
                defaultValue={toTimeInputValue(entry.startTime)}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">Orario fine</label>
              <input
                className="input"
                type="time"
                name="endTime"
                defaultValue={toTimeInputValue(entry.endTime)}
                required
              />
            </div>

            <div className="form-field full">
              <label className="inline-check">
                <input
                  type="checkbox"
                  name="isBillable"
                  defaultChecked={entry.isBillable}
                />
                <span className="form-label" style={{ margin: 0 }}>
                  Attività fatturabile
                </span>
              </label>
            </div>

            <div className="form-field">
              <label className="form-label">Spese anticipate</label>
              <input
                className="input"
                type="number"
                step="0.01"
                name="anticipatedExpenses"
                defaultValue={Number(entry.anticipatedExpenses)}
              />
            </div>

            <div className="form-field">
              <label className="form-label">Onorario</label>
              <input
                className="input"
                type="number"
                step="0.01"
                name="feeAmount"
                defaultValue={Number(entry.feeAmount)}
              />
            </div>

            <div
              className="form-field full"
              style={{ marginTop: 8, display: "flex", gap: 12, flexDirection: "row" }}
            >
              <button type="submit" className="button-primary">
                Salva modifiche
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h3 className="section-title">Elimina attività</h3>
          <p className="empty" style={{ marginBottom: 16 }}>
            Questa operazione cancella definitivamente la riga dal timesheet.
          </p>

          <form action={deleteEntry}>
            <input type="hidden" name="id" value={entry.id.toString()} />
            <button
              type="submit"
              className="button-secondary"
              style={{ borderColor: "#ef4444", color: "#b91c1c" }}
            >
              Elimina attività
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}