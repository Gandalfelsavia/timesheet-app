import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import { requireAdmin } from "../../lib/auth";

async function toggleActivityStatus(formData: FormData) {
  "use server";

await requireAdmin();

  const id = BigInt(String(formData.get("id")));
  const currentValue = String(formData.get("isActive")) === "true";

  await prisma.activityType.update({
    where: { id },
    data: {
      isActive: !currentValue,
    },
  });

  redirect("/attivita");
}

export default async function AttivitaPage() {
  const activities = await prisma.activityType.findMany({
    orderBy: { activityName: "asc" },
  });

  return (
    <div className="page-stack">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 className="section-title">Attività</h2>
          <p className="empty">Gestione anagrafica attività.</p>
        </div>

        <Link href="/attivita/nuovo" className="button-primary">
          + Nuova attività
        </Link>
      </div>

      <div className="card">
        <div className="card-body">
          {activities.length === 0 ? (
            <p className="empty">Nessuna attività presente.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nome attività</th>
                    <th>Stato</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity) => (
                    <tr key={activity.id.toString()}>
                      <td>{activity.activityName}</td>
                      <td>{activity.isActive ? "Attiva" : "Non attiva"}</td>
                      <td style={{ display: "flex", gap: 10 }}>
                        <Link
                          href={`/attivita/${activity.id.toString()}/modifica`}
                          className="button-secondary"
                        >
                          Modifica
                        </Link>

                        <form action={toggleActivityStatus}>
                          <input type="hidden" name="id" value={activity.id.toString()} />
                          <input
                            type="hidden"
                            name="isActive"
                            value={String(activity.isActive)}
                          />
                          <button type="submit" className="button-secondary">
                            {activity.isActive ? "Disattiva" : "Attiva"}
                          </button>
                        </form>
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