import React from "react";

const WeihnachtsBanner = ({ amount }) => {
  return (
    <div style={bannerStyle}>
      <h2 style={headingStyle}>Weihnachtskampagne</h2>
      <p style={amountStyle}>
        Recaudado:{" "}
        <span style={highlightStyle}>€{amount.toLocaleString()}</span>
      </p>
    </div>
  );
};

// Estilos en línea
const bannerStyle = {
  backgroundColor: "#F7D9D9", // Color rojo claro para el fondo
  color: "#333", // Texto en un tono oscuro
  padding: "20px",
  borderRadius: "8px",
  textAlign: "center",
  margin: "20px auto",
  width: "90%",
  maxWidth: "600px",
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  fontFamily: "Arial, sans-serif",
};

const headingStyle = {
  fontSize: "1.5rem",
  marginBottom: "10px",
  fontWeight: "bold",
};

const amountStyle = {
  fontSize: "1.2rem",
  margin: "0",
};

const highlightStyle = {
  color: "#D32F2F", // Rojo intenso para destacar
  fontWeight: "bold",
};

export default WeihnachtsBanner;
