import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import { requireUser } from "../../lib/auth";

async function createEntry(formData: FormData) {
  "use server";

  const currentUser = await requireUser();

  const userIdValue =
    currentUser.role === "admin"
      ? String(formData.get("userId") || "")
      : currentUser.id.toString();

  const date = String(formData.get("date") || "");
  const clientIdValue = String(formData.get("clientId") || "");
  const activityTypeIdValue = String(formData.get("activityTypeId") || "");
  const description = String(formData.get("description") || "");
  const startTime = String(formData.get("startTime") || "");
  const endTime = String(formData.get("endTime") || "");
  const isBillable = formData.get("isBillable") === "on";
  const anticipatedExpenses = Number(formData.get("anticipatedExpenses") || 0);
  const feeAmount = Number(formData.get("feeAmount") || 0);

  if (
    !userIdValue ||
    !date ||
    !clientIdValue ||
    !activityTypeIdValue ||
    !startTime ||
    !endTime
  ) {
    throw new Error("Compila tutti i campi obbligatori.");
  }

  const userId = BigInt(userIdValue);
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

  await prisma.timesheetEntry.create({
    data: {
      userId,
      entryDate: new Date(date),
      clientId,
      activityTypeId,
      description,
      startTime: new Date(`1970-01-01T${startTime}:00`),
      endTime: new Date(`1970-01-01T${endTime}:00`),
      durationMinutes,
      isBillable,
      anticipatedExpenses: isBillable ? anticipatedExpenses : 0,
      feeAmount: isBillable ? feeAmount : 0,
    },
  });

  redirect("/timesheet");
}

export default async function NuovaAttivitaPage() {
  const currentUser = await requireUser();

  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { fullName: "asc" },
  });

  const clients = await prisma.client.findMany({
    where: { isActive: true },
    orderBy: { clientName: "asc" },
  });

  const activityTypes = await prisma.activityType.findMany({
    where: { isActive: true },
    orderBy: { activityName: "asc" },
  });

  return (
    <div className="page-stack">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 className="section-title" style={{ marginBottom: 6 }}>
            Nuova attività
          </h2>
          <p className="empty">Inserisci una nuova registrazione del timesheet.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <form action={createEntry} className="form-grid">
            {currentUser.role === "admin" ? (
              <div className="form-field">
                <label className="form-label">Utente</label>
                <select
                  className="select"
                  name="userId"
                  required
                  defaultValue={currentUser.id.toString()}
                >
                  <option value="">Seleziona utente</option>
                  {users.map((user) => (
                    <option key={user.id.toString()} value={user.id.toString()}>
                      {user.fullName}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <input type="hidden" name="userId" value={currentUser.id.toString()} />
            )}

            <div className="form-field">
              <label className="form-label">Data</label>
              <input className="input" type="date" name="date" required />
            </div>

            <div className="form-field">
              <label className="form-label">Cliente</label>
              <select className="select" name="clientId" required>
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
              <select className="select" name="activityTypeId" required>
                <option value="">Seleziona attività</option>
                {activityTypes.map((activity) => (
                  <option key={activity.id.toString()} value={activity.id.toString()}>
                    {activity.activityName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field full">
              <label className="form-label">Descrizione</label>
              <input className="input" type="text" name="description" />
            </div>

            <div className="form-field">
              <label className="form-label">Orario inizio</label>
              <input className="input" type="time" name="startTime" required />
            </div>

            <div className="form-field">
              <label className="form-label">Orario fine</label>
              <input className="input" type="time" name="endTime" required />
            </div>

            <div className="form-field full">
              <label className="inline-check">
                <input type="checkbox" name="isBillable" />
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
                defaultValue="0"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Onorario</label>
              <input
                className="input"
                type="number"
                step="0.01"
                name="feeAmount"
                defaultValue="0"
              />
            </div>

            <div className="form-field full" style={{ marginTop: 8 }}>
              <button type="submit" className="button-primary">
                Salva attività
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}