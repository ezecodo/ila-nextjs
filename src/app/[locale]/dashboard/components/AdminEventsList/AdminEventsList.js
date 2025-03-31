"use client";

import GenericAdminList from "../GenericAdminList/GenericAdminList";

export default function AdminEventsList({ onItemDeleted }) {
  return (
    <GenericAdminList
      title="🎛️ Administrar Eventos"
      endpoint="/api/events?admin=true"
      columns={[
        { key: "id", label: "ID" },
        { key: "title", label: "Título" },
        {
          key: "date",
          label: "Fecha",
          format: (val) => new Date(val).toLocaleDateString("es-ES"),
        },
        {
          key: "location",
          label: "Ubicación",
        },
        {
          key: "description",
          label: "Descripción",
          format: (val) => (val.length > 50 ? val.slice(0, 50) + "..." : val),
        },
      ]}
      imageField="image"
      editUrlPrefix="/dashboard/events"
      editPath="/edit"
      deleteUrlPrefix="/api/events"
      itemName="evento"
      onItemDeleted={onItemDeleted}
    />
  );
}
