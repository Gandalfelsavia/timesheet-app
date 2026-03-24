import { prisma } from "../../../../lib/prisma";
import { redirect, notFound } from "next/navigation";
import { requireAdmin } from "../../../../lib/auth";

async function updateActivity(formData: FormData) {
  "use server";

await requireAdmin();

  const id = BigInt(String(formData.get("id")));
  const name = String(formData.get("name") || "").trim();

  if (!name) {
    throw new Error("Nome attività obbligatorio");
  }

  await prisma.activityType.update({
    where: { id },
    data: { activityName: name },
  });

  redirect("/attivita");
}

export default async function ModificaAttivitaAnagraficaPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;

  const activity = await prisma.activityType.findUnique({
    where: { id: BigInt(params.id) },
  });

  if (!activity) return notFound();

  return (
    <div className="page-stack">
      <h2 className="section-title">Modifica attività</h2>

      <div className="card">
        <div className="card-body">
          <form action={updateActivity} className="form-grid">
            <input type="hidden" name="id" value={activity.id.toString()} />

            <div className="form-field full">
              <label className="form-label">Nome attività</label>
              <input
                className="input"
                name="name"
                defaultValue={activity.activityName}
                required
              />
            </div>

            <div className="form-field full">
              <button className="button-primary">Salva modifiche</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}