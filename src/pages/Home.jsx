export default function Home() {
  return (
    <div
      style={{
        backgroundColor: "#0B2341",
        color: "white",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "20px",
      }}
    >
      <div>
        <div
  style={{
    background: "rgba(255,255,255,0.95)",
    padding: "20px",
    borderRadius: "25px",
    display: "inline-block",
    marginBottom: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,.35)"
  }}
>
  <img
    src="/logo-ceesuv.png"
    alt="Logo CEESUV"
    style={{ width: "180px" }}
  />
</div>

        <h1 style={{ color: "white", fontSize: "42px" }}>
          Banco Escolar CEESUV
        </h1>

        <h2 style={{ color: "#D4AF37", marginTop: "20px" }}>
          EDUCACIÓN HUMANISTA BASADA EN VALORES
        </h2>

        <p
          style={{
            color: "white",
            fontSize: "20px",
            marginTop: "25px",
          }}
        >
          Aprende a administrar tus CEESUV Coins
        </p>

        <button
          style={{
            marginTop: "40px",
            backgroundColor: "#D4AF37",
            color: "#0B2341",
            border: "none",
            padding: "15px 35px",
            borderRadius: "10px",
            fontSize: "18px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Iniciar sesión
        </button>
      </div>
    </div>
  );
}