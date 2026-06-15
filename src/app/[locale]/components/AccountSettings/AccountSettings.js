"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

export default function AccountSettings() {
  const { data: session } = useSession();
  const t = useTranslations("account");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (session?.user?.email) {
      setEmail(session.user.email);
    }
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session]);

  const handleUpdate = async (type) => {
    setMessage("");

    let body = {};
    if (type === "name") {
      body = { name };
    } else if (type === "email") {
      if (!email) {
        setMessage(t("errors.emptyEmail"));
        return;
      }
      body = { email };
    } else if (type === "password") {
      if (!currentPassword || !newPassword || !confirmNewPassword) {
        setMessage(t("errors.emptyPasswordFields"));
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setMessage(t("errors.passwordMismatch"));
        return;
      }
      body = { currentPassword, newPassword };
    }

    const res = await fetch("/api/auth/update-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (res.ok) {
      if (type === "name") {
        setMessage(t("success.name"));
      } else if (type === "email") {
        setMessage(t("success.email"));
      } else if (type === "password") {
        setMessage(t("success.password"));
      }

      setTimeout(() => {
        setIsOpen(null);
      }, 2000);
    } else {
      setMessage(data.error || t("errors.generic"));
    }
  };

  const rows = [
    { key: "name", label: t("changeName"), value: name },
    { key: "email", label: t("changeEmail"), value: email },
    { key: "password", label: t("changePassword"), value: "••••••••" },
  ];

  return (
    <div className="max-w-lg mx-auto border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-5">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {t("title")}
        </h2>
        {name && (
          <p className="text-sm text-[#BD0E0D] font-semibold mt-0.5">{name}</p>
        )}
      </div>

      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {rows.map((row) => (
          <li key={row.key}>
            <button
              onClick={() => setIsOpen(row.key)}
              className="group w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {row.label}
                </span>
                {row.value && (
                  <span className="block text-xs text-gray-400 truncate">
                    {row.value}
                  </span>
                )}
              </span>
              <svg
                className="w-4 h-4 shrink-0 text-gray-300 group-hover:text-[#BD0E0D] transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </li>
        ))}
      </ul>
      {isOpen === "name" && (
        <Modal title={t("modal.updateName")} onClose={() => setIsOpen(null)}>
          <input
            type="text"
            placeholder={t("placeholders.newName")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
          <ModalActions
            onSave={() => handleUpdate("name")}
            onCancel={() => setIsOpen(null)}
            saveLabel={t("save")}
            cancelLabel={t("cancel")}
          />
          {message && <p className="mt-3 text-center text-sm">{message}</p>}
        </Modal>
      )}

      {isOpen === "email" && (
        <Modal title={t("modal.updateEmail")} onClose={() => setIsOpen(null)}>
          <input
            type="email"
            placeholder={t("placeholders.newEmail")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <ModalActions
            onSave={() => handleUpdate("email")}
            onCancel={() => setIsOpen(null)}
            saveLabel={t("save")}
            cancelLabel={t("cancel")}
          />
          {message && <p className="mt-3 text-center text-sm">{message}</p>}
        </Modal>
      )}

      {isOpen === "password" && (
        <Modal title={t("modal.updatePassword")} onClose={() => setIsOpen(null)}>
          <div className="space-y-2">
            <PasswordInput
              placeholder={t("placeholders.currentPassword")}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              show={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
            />
            <PasswordInput
              placeholder={t("placeholders.newPassword")}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              show={showNewPassword}
              onToggle={() => setShowNewPassword(!showNewPassword)}
            />
            <PasswordInput
              placeholder={t("placeholders.confirmPassword")}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              show={showConfirmPassword}
              onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
            />
          </div>
          <ModalActions
            onSave={() => handleUpdate("password")}
            onCancel={() => setIsOpen(null)}
            saveLabel={t("save")}
            cancelLabel={t("cancel")}
          />
          {message && <p className="mt-3 text-center text-sm">{message}</p>}
        </Modal>
      )}
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-none text-sm focus:outline-none focus:border-[#BD0E0D] focus:ring-1 focus:ring-[#BD0E0D]";

function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-gray-800 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-200 dark:border-gray-700 px-5 py-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

function ModalActions({ onSave, onCancel, saveLabel, cancelLabel }) {
  return (
    <div className="flex items-center justify-end gap-2 mt-5">
      <button
        onClick={onCancel}
        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        {cancelLabel}
      </button>
      <button
        onClick={onSave}
        className="bg-[#BD0E0D] hover:bg-[#a50c0b] text-white text-sm font-bold px-4 py-2 transition-colors"
      >
        {saveLabel}
      </button>
    </div>
  );
}

function PasswordInput({ placeholder, value, onChange, show, onToggle }) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`${inputClass} pr-10`}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show ? "👁️" : "🙈"}
      </button>
    </div>
  );
}
