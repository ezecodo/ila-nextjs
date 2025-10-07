// Guarda este archivo como: components/Articles/NewArticle/UploadProgressModal.jsx

import React from "react";

const UploadProgressModal = ({ isVisible, progress, currentStep }) => {
  if (!isVisible) return null;

  // Mensajes motivadores que rotan según el progreso
  const motivationalMessages = [
    "¡Estás haciendo un gran trabajo! 🎉",
    "¡Tu contenido es valioso! ✨",
    "¡Casi terminamos! 💪",
    "¡Excelente trabajo! 🌟",
    "¡Lo estás logrando! 🚀",
  ];

  const getMotivationalMessage = () => {
    const index = Math.floor(progress / 20) % motivationalMessages.length;
    return motivationalMessages[index];
  };

  // Mensajes automáticos según el progreso
  const steps = [
    { threshold: 0, message: "Preparando tu artículo..." },
    { threshold: 20, message: "Validando información..." },
    { threshold: 40, message: "Subiendo imágenes..." },
    { threshold: 60, message: "Guardando contenido..." },
    { threshold: 80, message: "Casi listo..." },
    { threshold: 95, message: "Finalizando..." },
  ];

  const getCurrentMessage = () => {
    if (currentStep) return currentStep;
    const step = [...steps].reverse().find((s) => progress >= s.threshold);
    return step ? step.message : "Procesando...";
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        backdropFilter: "blur(8px)",
        animation: "fadeIn 0.3s ease-out",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "24px",
          padding: "50px 40px",
          maxWidth: "520px",
          width: "90%",
          boxShadow: "0 25px 80px rgba(0, 0, 0, 0.4)",
          animation: "slideIn 0.4s ease-out",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Efecto de brillo animado en el fondo */}
        <div
          style={{
            position: "absolute",
            top: "-50%",
            left: "-50%",
            width: "200%",
            height: "200%",
            background:
              "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
            animation: "rotate 20s linear infinite",
            pointerEvents: "none",
          }}
        />

        {/* Contenido */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Loader animado */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "35px",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "90px",
                height: "90px",
              }}
            >
              {/* Círculo exterior */}
              <div
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  border: "6px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "50%",
                }}
              />

              {/* Círculo rotando */}
              <div
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  border: "6px solid transparent",
                  borderTop: "6px solid white",
                  borderRight: "6px solid white",
                  borderRadius: "50%",
                  animation:
                    "spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite",
                }}
              />

              {/* Porcentaje en el centro */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  color: "white",
                  fontSize: "20px",
                  fontWeight: "700",
                }}
              >
                {progress}%
              </div>
            </div>
          </div>

          {/* Mensaje de estado */}
          <h2
            style={{
              color: "white",
              textAlign: "center",
              marginBottom: "12px",
              fontSize: "26px",
              fontWeight: "700",
              letterSpacing: "-0.5px",
            }}
          >
            {progress < 100 ? "Creando tu artículo" : "¡Artículo creado!"}
          </h2>

          <p
            style={{
              color: "rgba(255, 255, 255, 0.95)",
              textAlign: "center",
              marginBottom: "35px",
              fontSize: "17px",
              fontWeight: "500",
              minHeight: "24px",
            }}
          >
            {getCurrentMessage()}
          </p>

          {/* Barra de progreso */}
          <div
            style={{
              width: "100%",
              height: "14px",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              borderRadius: "12px",
              overflow: "hidden",
              marginBottom: "20px",
              boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background:
                  progress < 100
                    ? "linear-gradient(90deg, #4ade80 0%, #22c55e 50%, #16a34a 100%)"
                    : "linear-gradient(90deg, #4ade80 0%, #22c55e 100%)",
                borderRadius: "12px",
                transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 0 20px rgba(74, 222, 128, 0.6)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Efecto de brillo en la barra */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "-100%",
                  width: "100%",
                  height: "100%",
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                  animation: "shimmer 2s infinite",
                }}
              />
            </div>
          </div>

          {/* Mensaje motivador */}
          {progress < 100 && (
            <p
              style={{
                color: "rgba(255, 255, 255, 0.85)",
                textAlign: "center",
                fontSize: "15px",
                marginTop: "25px",
                fontStyle: "italic",
                animation: "pulse 2s ease-in-out infinite",
              }}
            >
              {getMotivationalMessage()}
            </p>
          )}

          {/* Mensaje de éxito */}
          {progress === 100 && (
            <div
              style={{
                textAlign: "center",
                marginTop: "20px",
                animation: "bounceIn 0.6s ease-out",
              }}
            >
              <p
                style={{
                  color: "white",
                  fontSize: "18px",
                  fontWeight: "600",
                }}
              >
                ✅ ¡Todo listo!
              </p>
            </div>
          )}
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideIn {
            from {
              transform: translateY(-80px) scale(0.9);
              opacity: 0;
            }
            to {
              transform: translateY(0) scale(1);
              opacity: 1;
            }
          }

          @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 200%; }
          }

          @keyframes rotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes pulse {
            0%, 100% { opacity: 0.85; }
            50% { opacity: 1; }
          }

          @keyframes bounceIn {
            0% {
              transform: scale(0.3);
              opacity: 0;
            }
            50% {
              transform: scale(1.05);
            }
            70% {
              transform: scale(0.9);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default UploadProgressModal;
