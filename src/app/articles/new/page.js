"use client";

import { useState } from "react";

export default function NewArticlePage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });

    if (res.ok) {
      setMessage("Artículo creado con éxito.");
      setTitle("");
      setContent("");
    } else {
      setMessage("Error al crear el artículo.");
    }
  };

  return (
    <div className="container">
      <h1 className="form-title">Crear un nuevo artículo</h1>
      {message && <p className="message">{message}</p>}
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="title">Título</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ingrese el título"
            className="input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="content">Contenido</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ingrese el contenido"
            className="textarea"
          />
        </div>
        <button type="submit" className="submit-button">
          Crear artículo
        </button>
      </form>

      <style jsx>{`
        .container {
          max-width: 600px;
          margin: 50px auto;
          padding: 20px;
          border-radius: 10px;
          background-color: #f9f9f9;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .form-title {
          font-size: 24px;
          margin-bottom: 20px;
          text-align: center;
          color: #333;
        }
        .message {
          text-align: center;
          color: green;
          margin-bottom: 15px;
        }
        .form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
        }
        label {
          font-size: 14px;
          margin-bottom: 5px;
          color: #555;
        }
        .input,
        .textarea {
          width: 100%;
          padding: 10px;
          font-size: 16px;
          border: 1px solid #ccc;
          border-radius: 5px;
        }
        .textarea {
          min-height: 100px;
          resize: vertical;
        }
        .submit-button {
          background-color: #0070f3;
          color: white;
          padding: 10px 20px;
          font-size: 16px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        .submit-button:hover {
          background-color: #005bb5;
        }
      `}</style>
    </div>
  );
}
