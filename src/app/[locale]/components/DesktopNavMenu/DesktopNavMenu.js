"use client";
import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import SearchBar from "../SearchBar";

export default function DesktopNavMenu() {
  const t = useTranslations("navMenu");

  return (
    <nav>
      <div className="bg-white/80 backdrop-blur-md px-6 py-2 rounded-lg">
        {/* Flex container que alinea UL y SearchBar en la misma fila */}
        <div className="flex items-center justify-center">
          {/* El menú */}
          <ul className="flex items-center gap-8 text-base font-semibold text-gray-800">
            <li>
              <Link
                href="/reiter"
                className="hover:text-red-600 transition-colors"
              >
                {t("index")}
              </Link>
            </li>
            <li className="group relative">
              <span className="cursor-pointer hover:text-red-600 transition-colors">
                {t("contents")}
              </span>
              <ul className="absolute left-0 top-full w-48 bg-white rounded shadow-lg opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-opacity overflow-hidden">
                <li>
                  <Link
                    href="/contents/current-issue"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    {t("currentIssue")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contents/online-only"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    {t("onlineOnly")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contents/archive"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    {t("archive")}
                  </Link>
                </li>
              </ul>
            </li>
            <li className="group relative">
              <span className="cursor-pointer hover:text-red-600 transition-colors">
                {t("orderSubscribe")}
              </span>
              <ul className="absolute left-0 top-full w-48 bg-white rounded shadow-lg opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-opacity overflow-hidden">
                <li>
                  <Link
                    href="/subscribe/subscription"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    {t("subscription")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/subscribe/single-issue"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    {t("singleIssue")}
                  </Link>
                </li>
              </ul>
            </li>
            <li className="group relative">
              <span className="cursor-pointer hover:text-red-600 transition-colors">
                {t("supportIla")}
              </span>
              <ul className="absolute left-0 top-full w-48 bg-white rounded shadow-lg opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-opacity overflow-hidden">
                <li>
                  <Link
                    href="/support/donate"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    {t("donate")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support/get-involved"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    {t("getInvolved")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support/advertise"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    {t("advertise")}
                  </Link>
                </li>
              </ul>
            </li>
            <li className="group relative">
              <span className="cursor-pointer hover:text-red-600 transition-colors">
                {t("newsEvents")}
              </span>
              <ul className="absolute left-0 top-full w-48 bg-white rounded shadow-lg opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-opacity overflow-hidden">
                <li>
                  <Link
                    href="/news"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    {t("news")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/events"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    {t("events")}
                  </Link>
                </li>
              </ul>
            </li>
            <li className="group relative">
              <span className="cursor-pointer hover:text-red-600 transition-colors">
                {t("aboutUs")}
              </span>
              <ul className="absolute left-0 top-full w-56 bg-white rounded shadow-lg opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-opacity overflow-hidden">
                <li>
                  <Link
                    href="/about/history"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    {t("history")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about/editorial-team"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    {t("editorialTeam")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about/speakers"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    {t("speakers")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about/network"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    {t("network")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about/contact"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    {t("contact")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about/legal-notice"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    {t("legalNotice")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about/terms"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    {t("terms")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about/privacy"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    {t("privacy")}
                  </Link>
                </li>
              </ul>
            </li>
          </ul>

          {/* aquí, justo al lado derecho del UL, pegada con un ml-8 */}
          <div className="ml-8 w-64">
            <SearchBar />
          </div>
        </div>
      </div>
    </nav>
  );
}
