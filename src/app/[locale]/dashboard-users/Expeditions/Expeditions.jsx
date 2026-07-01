"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  FaPlay,
  FaPlus,
  FaTimes,
  FaChevronUp,
  FaChevronDown,
} from "react-icons/fa";
import ArticleList from "../../components/Articles/ArticleList";
import QueuePlayer from "../../components/ArticleListen/QueuePlayer";
import { useCanListenGlobila } from "../../components/ArticleListen/useCanListenGlobila";

export default function Expeditions() {
  const t = useTranslations("expeditions");
  const locale = useLocale();
  const canListen = useCanListenGlobila();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  // Detalle de la expedición abierta
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  // Escucha: lista de reproducción ORDENADA de IDs + cola en reproducción.
  const [order, setOrder] = useState([]);
  const [listenIds, setListenIds] = useState(null);

  const addToPlaylist = (id) =>
    setOrder((prev) => (prev.includes(id) ? prev : [...prev, id]));

  const removeFromPlaylist = (id) =>
    setOrder((prev) => prev.filter((x) => x !== id));

  const moveItem = (index, dir) =>
    setOrder((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString(locale === "de" ? "de-DE" : "es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const loadList = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/globila/collections");
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  // Al cargar el detalle, preseleccionar todos los artículos para escuchar.
  useEffect(() => {
    if (detail?.articles) setOrder(detail.articles.map((a) => a.id));
  }, [detail]);

  const openExpedition = async (id) => {
    setOpenId(id);
    setDetail(null);
    setDetailLoading(true);
    setRenaming(false);
    try {
      const res = await fetch(`/api/globila/collections/${id}`);
      const data = await res.json();
      setDetail(data);
      setNameDraft(data?.name || "");
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  const backToList = () => {
    setOpenId(null);
    setDetail(null);
  };

  const deleteExpedition = async (id) => {
    if (!window.confirm(t("delete_confirm"))) return;
    try {
      await fetch(`/api/globila/collections/${id}`, { method: "DELETE" });
      setList((prev) => prev.filter((c) => c.id !== id));
      if (openId === id) backToList();
    } catch (e) {
      console.error(e);
    }
  };

  const saveRename = async () => {
    const name = nameDraft.trim();
    if (!name || !detail) return;
    try {
      const res = await fetch(`/api/globila/collections/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setDetail((d) => ({ ...d, name }));
        setList((prev) =>
          prev.map((c) => (c.id === detail.id ? { ...c, name } : c))
        );
        setRenaming(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ── Vista detalle ──────────────────────────────────────────────────────────
  if (openId) {
    return (
      <div>
        <button
          onClick={backToList}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#BD0E0D] transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          {t("back")}
        </button>

        {detailLoading ? (
          <div className="flex items-center gap-2 py-10 text-sm text-gray-400">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-[#BD0E0D]" />
            {t("loading")}
          </div>
        ) : !detail ? (
          <p className="text-sm text-gray-500">{t("detail_empty")}</p>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                {renaming ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename();
                        if (e.key === "Escape") setRenaming(false);
                      }}
                      maxLength={120}
                      className="border border-gray-300 px-2 py-1 text-lg font-bold text-gray-900 outline-none focus:border-[#BD0E0D] dark:bg-gray-800 dark:text-gray-100"
                    />
                    <button
                      onClick={saveRename}
                      className="bg-[#BD0E0D] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#a50c0b]"
                    >
                      {t("save")}
                    </button>
                    <button
                      onClick={() => setRenaming(false)}
                      className="px-2 py-1.5 text-xs text-gray-400 hover:text-gray-700"
                    >
                      {t("cancel")}
                    </button>
                  </div>
                ) : (
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {detail.name}
                  </h2>
                )}
                <p className="mt-0.5 text-sm text-gray-500">
                  {t("articles", { count: detail.articles?.length || 0 })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!renaming && (
                  <button
                    onClick={() => {
                      setNameDraft(detail.name);
                      setRenaming(true);
                    }}
                    className="text-sm font-semibold text-gray-500 hover:text-[#BD0E0D] transition-colors"
                  >
                    {t("rename")}
                  </button>
                )}
                <button
                  onClick={() => deleteExpedition(detail.id)}
                  className="text-sm font-semibold text-gray-500 hover:text-[#BD0E0D] transition-colors"
                >
                  {t("delete")}
                </button>
              </div>
            </div>

            {canListen && detail.articles?.length > 0 && (
              <div
                className="mb-5 border bg-gradient-to-b from-[#89B881]/5 to-transparent px-4 py-3"
                style={{ borderColor: "#89B881" }}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-700">
                    🎧 {t("listen_title")}
                  </p>
                  <button
                    onClick={() => setListenIds([...order])}
                    disabled={order.length === 0}
                    aria-label={t("listen_play_aria")}
                    title={t("listen_play_aria")}
                    className="group relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#557a4c] to-[#46663f] text-white shadow-md transition-all hover:scale-105 hover:shadow-lg disabled:scale-100 disabled:opacity-30 disabled:shadow-none"
                  >
                    <FaPlay size={16} className="ml-0.5" />
                    {order.length > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-[#46663f] shadow ring-1 ring-[#89B881]">
                        {order.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Pool: artículos disponibles para agregar (clic = +) */}
                {(() => {
                  const pool = detail.articles.filter(
                    (a) => !order.includes(a.id)
                  );
                  if (pool.length === 0) return null;
                  return (
                    <div className="mb-3">
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                        {t("listen_pool")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {pool.map((a) => {
                          const title =
                            locale === "es" && a.titleES ? a.titleES : a.title;
                          return (
                            <button
                              key={a.id}
                              onClick={() => addToPlaylist(a.id)}
                              aria-label={t("listen_add")}
                              className="inline-flex max-w-[16rem] items-center gap-1.5 truncate rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-600 transition-colors hover:border-[#89B881] hover:text-[#46663f]"
                            >
                              <FaPlus size={9} className="shrink-0 opacity-60" />
                              <span className="truncate">{title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Playlist ordenada: nº · título · ↑↓ · × */}
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  {t("listen_playlist")}
                </p>
                {order.length === 0 ? (
                  <p className="py-2 text-xs text-gray-400">
                    {t("listen_empty")}
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {order.map((id, i) => {
                      const a = detail.articles.find((x) => x.id === id);
                      if (!a) return null;
                      const title =
                        locale === "es" && a.titleES ? a.titleES : a.title;
                      return (
                        <li
                          key={id}
                          className="flex items-center gap-2 border border-[#89B881]/40 bg-white px-2 py-1.5"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#89B881] text-[11px] font-bold text-white">
                            {i + 1}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-xs font-medium text-gray-800">
                            {title}
                          </span>
                          <div className="flex shrink-0 items-center gap-0.5">
                            <button
                              onClick={() => moveItem(i, -1)}
                              disabled={i === 0}
                              aria-label={t("listen_up")}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-25"
                            >
                              <FaChevronUp size={11} />
                            </button>
                            <button
                              onClick={() => moveItem(i, 1)}
                              disabled={i === order.length - 1}
                              aria-label={t("listen_down")}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-25"
                            >
                              <FaChevronDown size={11} />
                            </button>
                            <button
                              onClick={() => removeFromPlaylist(id)}
                              aria-label={t("listen_remove")}
                              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-[#BD0E0D]"
                            >
                              <FaTimes size={11} />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {detail.articles?.length > 0 ? (
              <ArticleList articlesProp={detail.articles} view="grid" />
            ) : (
              <p className="text-sm text-gray-500">{t("detail_empty")}</p>
            )}
          </>
        )}

        {listenIds && (
          <QueuePlayer
            ids={listenIds}
            initialLang={locale}
            onClose={() => setListenIds(null)}
          />
        )}
      </div>
    );
  }

  // ── Vista lista ──────────────────────────────────────────────────────────
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {t("title")}
        </h2>
        <Link
          href={`/${locale}/map`}
          className="bg-[#BD0E0D] px-3 py-1.5 text-sm font-bold text-white hover:bg-[#a50c0b] transition-colors"
        >
          {t("empty_cta")}
        </Link>
      </div>
      <p className="mb-5 text-sm text-gray-500">{t("subtitle")}</p>

      {loading ? (
        <div className="flex items-center gap-2 py-10 text-sm text-gray-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-[#BD0E0D]" />
          {t("loading")}
        </div>
      ) : list.length === 0 ? (
        <div className="border border-dashed border-gray-300 dark:border-gray-700 px-6 py-12 text-center">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            {t("empty_title")}
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
            {t("empty_text")}
          </p>
          <Link
            href={`/${locale}/map`}
            className="mt-4 inline-block bg-[#BD0E0D] px-4 py-2 text-sm font-bold text-white hover:bg-[#a50c0b] transition-colors"
          >
            {t("empty_cta")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((c) => (
            <div
              key={c.id}
              className="group flex flex-col border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all"
            >
              <button
                onClick={() => openExpedition(c.id)}
                className="flex flex-1 flex-col text-left"
              >
                {/* Mosaico de portadas */}
                <div className="grid aspect-[16/9] grid-cols-2 grid-rows-2 gap-px bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  {(c.covers || []).slice(0, 4).map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={url}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ))}
                  {(!c.covers || c.covers.length === 0) && (
                    <div className="col-span-2 row-span-2 flex items-center justify-center text-3xl font-black text-gray-300 dark:text-gray-600">
                      <span className="font-futura">ila</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-[15px] font-bold leading-snug text-gray-900 dark:text-gray-100 line-clamp-2">
                    {c.name}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    {t("articles", { count: c.count })} · {fmtDate(c.createdAt)}
                  </p>
                </div>
              </button>
              <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 px-3 py-2">
                <button
                  onClick={() => openExpedition(c.id)}
                  className="text-xs font-bold text-[#BD0E0D] hover:underline"
                >
                  {t("open")} →
                </button>
                <button
                  onClick={() => deleteExpedition(c.id)}
                  className="text-xs font-semibold text-gray-400 hover:text-[#BD0E0D] transition-colors"
                >
                  {t("delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
