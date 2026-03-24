import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import { requireAdmin } from "../../lib/auth";

async function toggleClientStatus(formData: FormData) {
  "use server";

await requireAdmin();

  const id = BigInt(String(formData.get("id")));
  const currentValue = String(formData.get("isActive")) === "true";

  await prisma.client.update({
    where: { id },
    data: {
      isActive: !currentValue,
    },
  });

  redirect("/clienti");
}

export default async function ClientiPage() {
  const clients = await prisma.client.findMany({
    orderBy: { clientName: "asc" },
  });

  return (
    <div className="page-stack">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 className="section-title">Clienti</h2>
          <p className="empty">Gestione anagrafica clienti.</p>
        </div>

        <Link href="/clienti/nuovo" className="button-primary">
          + Nuovo cliente
        </Link>
      </div>

      <div className="card">
        <div className="card-body">
          {clients.length === 0 ? (
            <p className="empty">Nessun cliente presente.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nome cliente</th>
                    <th>Stato</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id.toString()}>
                      <td>{client.clientName}</td>
                      <td>{client.isActive ? "Attivo" : "Non attivo"}</td>
                      <td style={{ display: "flex", gap: 10 }}>
                        <Link
                          href={`/clienti/${client.id.toString()}/modifica`}
                          className="button-secondary"
                        >
                          Modifica
                        </Link>

                        <form action={toggleClientStatus}>
                          <input type="hidden" name="id" value={client.id.toString()} />
                          <input
                            type="hidden"
                            name="isActive"
                            value={String(client.isActive)}
                          />
                          <button type="submit" className="button-secondary">
                            {client.isActive ? "Disattiva" : "Attiva"}
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