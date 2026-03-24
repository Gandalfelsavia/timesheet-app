import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { requireAdmin } from "../../../lib/auth";

async function createActivity(formData: FormData) {
  "use server";

await requireAdmin();

  const name = String(formData.get("name") || "").trim();

  if (!name) {
    throw new Error("Nome attività obbligatorio");
  }

  await prisma.activityType.create({
    data: {
      activityName: name,
    },
  });

  redirect("/attivita");
}

export default function NuovaAttivitaAnagraficaPage() {
  return (
    <div className="page-stack">
      <h2 className="section-title">Nuova attività</h2>

      <div className="card">
        <div className="card-body">
          <form action={createActivity} className="form-grid">
            <div className="form-field full">
              <label className="form-label">Nome attività</label>
              <input className="input" name="name" required />
            </div>

            <div className="form-field full">
              <button className="button-primary">Salva attività</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}