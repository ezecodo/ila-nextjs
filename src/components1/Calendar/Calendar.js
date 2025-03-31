"use client";

import { useState, useMemo } from "react";

export default function Calendar({ events }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // 🔹 Memoizar eventDates para evitar que cambie en cada render
  const eventDates = useMemo(
    () => events.map((event) => new Date(event.date).toDateString()),
    [events]
  );

  const days = useMemo(() => {
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );
    const startDay = startOfMonth.getDay();

    let daysArray = [];

    // Días vacíos antes del 1° del mes
    for (let i = 0; i < startDay; i++) {
      daysArray.push(null);
    }

    // Días del mes actual
    for (let day = 1; day <= endOfMonth.getDate(); day++) {
      const fullDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      ).toDateString();

      // Verificar si hay un evento en esta fecha
      const event = eventDates.includes(fullDate);

      daysArray.push({
        day,
        event,
      });
    }

    return daysArray;
  }, [currentDate, eventDates]); // ✅ Ahora eventDates es memoizado

  function changeMonth(direction) {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() + direction);
      return newDate;
    });
  }

  return (
    <div className="max-w-lg mx-auto p-4 border rounded-lg shadow-md bg-white">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => changeMonth(-1)}
          className="px-3 py-1 bg-gray-200 rounded"
        >
          ◀
        </button>
        <h2 className="text-lg font-bold">
          {currentDate.toLocaleString("es-ES", {
            month: "long",
            year: "numeric",
          })}
        </h2>
        <button
          onClick={() => changeMonth(1)}
          className="px-3 py-1 bg-gray-200 rounded"
        >
          ▶
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
          <div key={day} className="font-semibold">
            {day}
          </div>
        ))}
        {days.map((item, index) => (
          <div
            key={index}
            className={`h-12 flex items-center justify-center border rounded ${
              item?.event ? "bg-blue-500 text-white" : "bg-gray-100"
            }`}
          >
            {item ? item.day : ""}
          </div>
        ))}
      </div>
    </div>
  );
}
