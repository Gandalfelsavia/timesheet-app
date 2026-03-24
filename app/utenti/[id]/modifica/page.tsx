import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/auth";
import { hashPassword } from "../../../../lib/password";

async function updateUser(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = BigInt(String(formData.get("id")));
  const fullName = String(formData.get("fullName") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = String(formData.get("role") || "user") as "admin" | "user";
  const password = String(formData.get("password") || "").trim();

  if (!fullName || !email) {
    throw new Error("Nome ed email sono obbligatori.");
  }

  await prisma.user.update({
    where: { id },
    data: {
      fullName,
      email,
      role,
      ...(password ? { passwordHash: hashPassword(password) } : {}),
    },
  });

  redirect("/utenti");
}

export default async function ModificaUtentePage(props: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const params = await props.params;

  const user = await prisma.user.findUnique({
    where: { id: BigInt(params.id) },
  });

  if (!user) return notFound();

  return (
    <div className="page-stack">
      <h2 className="section-title">Modifica utente</h2>

      <div className="card">
        <div className="card-body">
          <form action={updateUser} className="form-grid">
            <input type="hidden" name="id" value={user.id.toString()} />

            <div className="form-field">
              <label className="form-label">Nome e cognome</label>
              <input
                className="input"
                name="fullName"
                defaultValue={user.fullName}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">Email</label>
              <input
                className="input"
                type="email"
                name="email"
                defaultValue={user.email}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">Nuova password</label>
              <input
                className="input"
                type="password"
                name="password"
                placeholder="Lascia vuoto per non modificare"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Ruolo</label>
              <select className="select" name="role" defaultValue={user.role}>
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
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