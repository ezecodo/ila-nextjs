"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import RedaktionTeamForm from "../components/RedaktionTeamForm/RedaktionTeamForm";
import { useTranslations } from "next-intl";
import { FaPlus, FaTimes, FaEdit, FaUsers, FaUser } from "react-icons/fa";

export default function RedaktionTeamPage() {
  const { status } = useSession();
  const router = useRouter();
  const t = useTranslations("redaktionTeam");

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [gallery, setGallery] = useState([]);
  const emptyMember = { name: "", bio: "", bioES: "", order: 0 };
  const [newMember, setNewMember] = useState(emptyMember);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    async function loadMembers() {
      try {
        const res = await fetch("/api/redaktion-team");
        const data = await res.json();
        setMembers(data);
      } catch (err) {
        console.error("Error loading redaktion team:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMembers();
  }, []);

  function resetForm() {
    setEditingMember(null);
    setNewMember(emptyMember);
    setGallery([]);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const formData = new FormData();
    if (editingMember) {
      formData.append("id", editingMember.id);
      formData.append("currentPhotoUrl", editingMember.photoUrl || "");
    }
    formData.append("name", newMember.name);
    formData.append("bio", newMember.bio || "");
    formData.append("bioES", newMember.bioES || "");
    formData.append("order", newMember.order ?? 0);
    if (gallery[0]?.file) {
      formData.append("photo", gallery[0].file);
    }

    try {
      const res = await fetch("/api/redaktion-team", {
        method: "POST",
        body: formData,
        next: { revalidate: 0 },
      });
      const data = await res.json();

      if (data.success) {
        if (editingMember) {
          setMembers((prev) =>
            prev.map((m) => (m.id === editingMember.id ? data.member : m))
          );
        } else {
          setMembers((prev) =>
            [...prev, data.member].sort((a, b) => a.order - b.order)
          );
        }
        resetForm();
        setFormVisible(false);
      } else {
        alert(`${t("errorSave")}: ${data.error}`);
      }
    } catch (err) {
      console.error("Error saving redaktion member:", err);
      alert(t("errorSave"));
    }
  }

  async function handleDelete(id) {
    if (!confirm(t("confirmDelete"))) return;

    try {
      const res = await fetch(`/api/redaktion-team?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        setMembers((prev) => prev.filter((m) => m.id !== id));
      } else {
        alert(`${t("errorDelete")}: ${data.error}`);
      }
    } catch (err) {
      console.error("Error deleting redaktion member:", err);
      alert(t("errorDelete"));
    }
  }

  function startEdit(member) {
    setEditingMember(member);
    setNewMember({
      name: member.name || "",
      bio: member.bio || "",
      bioES: member.bioES || "",
      order: member.order ?? 0,
    });
    setGallery(member.photoUrl ? [{ url: member.photoUrl }] : []);
    setFormVisible(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-5xl mx-auto p-6 lg:p-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FaUsers className="text-white text-xl" />
                </div>
                {t("title")}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {t("subtitle")}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {members.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t("totalMembers")}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (formVisible) {
                resetForm();
              }
              setFormVisible(!formVisible);
            }}
            className={`w-full md:w-auto px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl ${
              formVisible
                ? "bg-gray-600 hover:bg-gray-700 text-white"
                : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
            }`}
          >
            {formVisible ? (
              <>
                <FaTimes /> {t("cancel")}
              </>
            ) : (
              <>
                <FaPlus /> {t("addNew")}
              </>
            )}
          </button>
        </div>

        {formVisible && (
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 lg:p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                {editingMember ? (
                  <>
                    <FaEdit className="text-blue-600" /> {t("editing")}
                  </>
                ) : (
                  <>
                    <FaPlus className="text-red-600" /> {t("addNew")}
                  </>
                )}
              </h2>
              <RedaktionTeamForm
                onSubmit={handleSubmit}
                newMember={newMember}
                setNewMember={setNewMember}
                gallery={gallery}
                setGallery={setGallery}
                t={t}
                editingMember={editingMember}
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">{t("loading")}</p>
          </div>
        ) : members.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-12">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaUsers className="text-5xl text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                {t("noMembers")}
              </h3>
              <button
                onClick={() => setFormVisible(true)}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold flex items-center gap-2 mx-auto transition-all shadow-lg hover:shadow-xl"
              >
                <FaPlus /> {t("addNew")}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                  {member.photoUrl ? (
                    <img
                      src={member.photoUrl}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FaUser className="text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {member.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                    {member.bio || member.bioES}
                  </p>
                </div>
                <button
                  onClick={() => startEdit(member)}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  title={t("editing")}
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDelete(member.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  title={t("delete")}
                >
                  <FaTimes />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
