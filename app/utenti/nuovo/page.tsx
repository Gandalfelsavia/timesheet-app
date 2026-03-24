import { prisma } from "../../../lib/prisma";
import { requireAdmin } from "../../../lib/auth";
import { hashPassword } from "../../../lib/password";

async function createUser(formData: FormData) {
  "use server";

await requireAdmin();

  const fullName = String(formData.get("fullName") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = String(formData.get("role") || "user") as "admin" | "user";
  const password = String(formData.get("password") || "").trim();

  if (!fullName || !email || !password) {
    throw new Error("Nome, email e password sono obbligatori.");
  }

  await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash: password,
      role,
      isActive: true,
    },
  });

  redirect("/utenti");
}
export default function NuovoUtentePage() {
  return (
    <div className="page-stack">
      <h2 className="section-title">Nuovo utente</h2>

      <div className="card">
        <div className="card-body">
          <form action={createUser} className="form-grid">
            <div className="form-field">
              <label className="form-label">Nome e cognome</label>
              <input className="input" name="fullName" required />
            </div>

            <div className="form-field">
              <label className="form-label">Email</label>
              <input className="input" type="email" name="email" required />
            </div>

<div className="form-field">
  <label className="form-label">Password</label>
  <input className="input" type="password" name="password" required />
</div>

            <div className="form-field">
              <label className="form-label">Ruolo</label>
              <select className="select" name="role" defaultValue="user">
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>

            <div className="form-field full">
              <button className="button-primary">Salva utente</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}