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

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-lg mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4">
        {t("title")} <span className="text-blue-500">({name})</span>
      </h2>

      <button
        onClick={() => setIsOpen("name")}
        className="w-full bg-blue-500 text-white p-2 rounded mb-4"
      >
        {t("changeName")}
      </button>

      <button
        onClick={() => setIsOpen("password")}
        className="w-full bg-blue-500 text-white p-2 rounded mb-4"
      >
        {t("changePassword")}
      </button>
      <button
        onClick={() => setIsOpen("email")}
        className="w-full bg-blue-500 text-white p-2 rounded"
      >
        {t("changeEmail")}
      </button>
      {isOpen === "name" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h3 className="text-lg font-bold mb-4">{t("modal.updateName")}</h3>
            <input
              type="text"
              placeholder={t("placeholders.newName")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-2"
            />
            <button
              onClick={() => handleUpdate("name")}
              className="w-full bg-green-500 text-white p-2 rounded"
            >
              {t("save")}
            </button>
            <button
              onClick={() => setIsOpen(null)}
              className="w-full bg-gray-500 text-white p-2 rounded mt-2"
            >
              {t("cancel")}
            </button>
            {message && <p className="mt-2 text-center">{message}</p>}
          </div>
        </div>
      )}
      {isOpen === "email" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h3 className="text-lg font-bold mb-4">{t("modal.updateEmail")}</h3>
            <input
              type="email"
              placeholder={t("placeholders.newEmail")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-2"
            />
            <button
              onClick={() => handleUpdate("email")}
              className="w-full bg-green-500 text-white p-2 rounded"
            >
              {t("save")}
            </button>
            <button
              onClick={() => setIsOpen(null)}
              className="w-full bg-gray-500 text-white p-2 rounded mt-2"
            >
              {t("cancel")}
            </button>
            {message && <p className="mt-2 text-center">{message}</p>}
          </div>
        </div>
      )}

      {isOpen === "password" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h3 className="text-lg font-bold mb-4">
              {t("modal.updatePassword")}
            </h3>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={t("placeholders.currentPassword")}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded mb-2"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-2 text-gray-500"
              >
                {showPassword ? "👁️" : "🙈"}
              </button>
            </div>

            <div className="relative">
              <input
                placeholder={t("placeholders.newPassword")}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded mb-2"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2 top-2 text-gray-500"
              >
                {showNewPassword ? "👁️" : "🙈"}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder={t("placeholders.confirmPassword")}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded mb-2"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-2 text-gray-500"
              >
                {showConfirmPassword ? "👁️" : "🙈"}
              </button>
            </div>

            <button
              onClick={() => handleUpdate("password")}
              className="w-full bg-green-500 text-white p-2 rounded"
            >
              {t("save")}
            </button>
            <button
              onClick={() => setIsOpen(null)}
              className="w-full bg-gray-500 text-white p-2 rounded mt-2"
            >
              {t("cancel")}
            </button>
            {message && <p className="mt-2 text-center">{message}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
