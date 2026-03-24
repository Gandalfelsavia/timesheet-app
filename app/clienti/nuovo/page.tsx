import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { requireAdmin } from "../../../lib/auth";

async function createClient(formData: FormData) {
  "use server";

await requireAdmin();

  const name = String(formData.get("name") || "");

  if (!name) {
    throw new Error("Nome cliente obbligatorio");
  }

  await prisma.client.create({
    data: {
      clientName: name,
    },
  });

  redirect("/clienti");
}

export default function NuovoClientePage() {
  return (
    <div className="page-stack">
      <h2 className="section-title">Nuovo cliente</h2>

      <div className="card">
        <div className="card-body">
          <form action={createClient} className="form-grid">
            <div className="form-field full">
              <label className="form-label">Nome cliente</label>
              <input className="input" name="name" required />
            </div>

            <div className="form-field full">
              <button className="button-primary">Salva cliente</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}