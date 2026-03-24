import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/auth";

async function updateClient(formData: FormData) {
  "use server";

  const id = BigInt(String(formData.get("id")));
  const name = String(formData.get("name"));

  await prisma.client.update({
    where: { id },
    data: { clientName: name },
  });

  redirect("/clienti");
}

export default async function ModificaClientePage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;

  const client = await prisma.client.findUnique({
    where: { id: BigInt(params.id) },
  });

  if (!client) return notFound();

  return (
    <div className="page-stack">
      <h2 className="section-title">Modifica cliente</h2>

      <div className="card">
        <div className="card-body">
          <form action={updateClient} className="form-grid">
            <input type="hidden" name="id" value={client.id.toString()} />

            <div className="form-field full">
              <label className="form-label">Nome cliente</label>
              <input
                className="input"
                name="name"
                defaultValue={client.clientName}
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