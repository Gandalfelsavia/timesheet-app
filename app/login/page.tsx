import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import { setLoginSession, getCurrentUser } from "../../lib/auth";
import { verifyPassword } from "../../lib/password";

async function login(formData: FormData) {
  "use server";

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();

  if (!email || !password) {
    throw new Error("Inserisci email e password.");
  }

  const user = await prisma.user.findFirst({
    where: {
      email,
      isActive: true,
    },
  });

  if (!user) {
    throw new Error("Utente non trovato.");
  }

  const isValid = verifyPassword(password, user.passwordHash);

  if (!isValid) {
    throw new Error("Password non corretta.");
  }

  await setLoginSession(user.id);

  redirect("/");
}

export default async function LoginPage() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect("/");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f6f8fb",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "white",
          border: "1px solid #dbe3ee",
          borderRadius: 20,
          padding: 32,
          boxShadow: "0 10px 30px rgba(15, 39, 71, 0.08)",
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: "#102a43",
              color: "white",
              display: "grid",
              placeItems: "center",
              fontWeight: 700,
              fontSize: 22,
              marginBottom: 16,
            }}
          >
            T
          </div>
          <h1 style={{ margin: 0, fontSize: 28 }}>Login</h1>
          <p style={{ color: "#64748b", marginTop: 8 }}>
            Accedi al gestionale timesheet.
          </p>
        </div>

        <form action={login} style={{ display: "grid", gap: 16 }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              style={{
                width: "100%",
                border: "1px solid #dbe3ee",
                borderRadius: 14,
                padding: "12px 14px",
                fontSize: 14,
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              style={{
                width: "100%",
                border: "1px solid #dbe3ee",
                borderRadius: 14,
                padding: "12px 14px",
                fontSize: 14,
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              background: "#102a43",
              color: "white",
              border: "none",
              borderRadius: 14,
              padding: "12px 16px",
              fontWeight: 700,
              cursor: "pointer",
              marginTop: 8,
            }}
          >
            Accedi
          </button>
        </form>
      </div>
    </main>
  );
}