"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Trees,
  Menu,
  Search,
  Moon,
  Database,
  Compass,
  Layers,
  Sparkles,
  X,
  ArrowRight,
  ShieldAlert,
  MapPin
} from "lucide-react";
import { TREES, WARDS, DISEASES } from "@/lib/db";

const GithubIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
    <path d="M9 18c-4.51 2-5-2-7-2"/>
  </svg>
);

export default function Navbar() {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Quick search results
  const searchResults = searchQuery.trim()
    ? {
        trees: TREES.filter(
          (t) =>
            t.species_common.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.tag_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.ward_name.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        wards: WARDS.filter((w) => w.name.toLowerCase().includes(searchQuery.toLowerCase())),
        diseases: DISEASES.filter((d) => d.common_name.toLowerCase().includes(searchQuery.toLowerCase()))
      }
    : null;

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center transition-transform group-hover:scale-105">
              <Trees className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-gray-950">EverLeafDB</span>
          </Link>
          <span className="hidden sm:inline-flex text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
            PostgreSQL + PostGIS + pgvector
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Action Icons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-md transition-colors border border-gray-200"
              title="Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-md transition-colors border border-gray-200 flex items-center gap-2 text-xs font-mono"
              title="Quick Search (Ctrl+K)"
            >
              <Search className="w-4 h-4" />
              <span className="hidden lg:inline text-gray-400">Search DB...</span>
              <kbd className="hidden lg:inline text-[9px] bg-gray-100 border border-gray-200 px-1 py-0.5 rounded text-gray-500">⌘K</kbd>
            </button>

            <Link
              href="/console"
              className={`p-2 rounded-md transition-all border ${
                pathname === "/console"
                  ? "bg-emerald-800 text-white border-emerald-900 shadow-xs"
                  : "bg-black text-white hover:bg-gray-800 border-black"
              }`}
              title="Interactive SQL Console"
            >
              <Database className="w-4 h-4" />
            </Link>
          </div>

          <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>

          {/* Engine Direct Nav Links */}
          <div className="hidden sm:flex items-center gap-2">
            <a
              href="https://github.com/karthik5033/EverLeafDB"
              target="_blank"
              rel="noreferrer"
              className="p-2 text-gray-500 hover:text-black hover:bg-gray-50 rounded-md transition-colors"
              title="GitHub Open Source Repository"
            >
              <GithubIcon className="w-4 h-4" />
            </a>

            <Link
              href="/map"
              className={`p-2 rounded-md transition-colors flex items-center gap-1 text-xs font-medium ${
                pathname === "/map"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold"
                  : "text-gray-600 hover:text-black hover:bg-gray-50"
              }`}
              title="PostGIS Spatial Subsystem & Wards"
            >
              <Compass className="w-4 h-4" />
              <span className="hidden xl:inline">Spatial Map</span>
            </Link>

            <Link
              href="/similarity"
              className={`p-2 rounded-md transition-colors flex items-center gap-1 text-xs font-medium ${
                pathname === "/similarity"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold"
                  : "text-gray-600 hover:text-black hover:bg-gray-50"
              }`}
              title="pgvector Disease Similarity Engine"
            >
              <Layers className="w-4 h-4" />
              <span className="hidden xl:inline">Vector Engine</span>
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 ml-2">
            <Link
              href="/login"
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors border ${
                pathname === "/login"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                  : "border-gray-200 hover:bg-gray-50 text-gray-800"
              }`}
            >
              Inspector Sign In
            </Link>

            <Link
              href="/console"
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#111111] hover:bg-black rounded-md transition-all shadow-xs flex items-center gap-1.5"
            >
              Launch Console <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-gray-200 bg-white p-4 space-y-2 animate-in fade-in slide-in-from-top-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-semibold text-gray-900 rounded-md hover:bg-gray-50"
          >
            Overview &amp; Metrics
          </Link>
          <Link
            href="/console"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-semibold text-gray-900 rounded-md hover:bg-gray-50"
          >
            SQL &amp; Multi-Model Console
          </Link>
          <Link
            href="/map"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-semibold text-gray-900 rounded-md hover:bg-gray-50"
          >
            PostGIS Geospatial Map
          </Link>
          <Link
            href="/similarity"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-semibold text-gray-900 rounded-md hover:bg-gray-50"
          >
            pgvector HNSW Similarity Studio
          </Link>
          <Link
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-semibold text-emerald-800 rounded-md bg-emerald-50"
          >
            Inspector Fleet Sign In
          </Link>
        </div>
      )}

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
          <div className="bg-white border border-gray-200 rounded-xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-3.5 border-b border-gray-100 flex items-center gap-3">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search cataloged trees, municipal wards, or pathological diseases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm outline-none text-gray-900 placeholder:text-gray-400 font-sans"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1 text-gray-400 hover:text-black rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-3 text-xs space-y-3 font-mono">
              {!searchQuery.trim() ? (
                <div className="p-4 text-center text-gray-400 font-sans text-xs">
                  Type to search trees by tag (e.g. <span className="font-mono text-black font-semibold">TREE-1084</span>), species (<span className="font-mono text-black font-semibold">Banyan</span>), or ward (<span className="font-mono text-black font-semibold">Cubbon</span>).
                </div>
              ) : searchResults && (
                <>
                  {searchResults.trees.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase font-bold text-gray-400 mb-1 font-sans">Trees Found</div>
                      <div className="space-y-1">
                        {searchResults.trees.map((t) => (
                          <Link
                            key={t.tree_id}
                            href={`/map?tree_id=${t.tree_id}`}
                            onClick={() => setIsSearchOpen(false)}
                            className="p-2 rounded bg-gray-50 hover:bg-emerald-50/60 border border-gray-200/80 flex items-center justify-between text-gray-800 transition-colors"
                          >
                            <div>
                              <span className="font-bold text-gray-950 mr-2">{t.tag_number}</span>
                              <span className="text-gray-600">{t.species_common} ({t.ward_name})</span>
                            </div>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold font-mono">
                              {t.health_status}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.wards.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase font-bold text-gray-400 mb-1 font-sans">Municipal Wards</div>
                      <div className="space-y-1">
                        {searchResults.wards.map((w) => (
                          <Link
                            key={w.ward_id}
                            href={`/map?ward_id=${w.ward_id}`}
                            onClick={() => setIsSearchOpen(false)}
                            className="p-2 rounded bg-gray-50 hover:bg-emerald-50/60 border border-gray-200/80 flex items-center justify-between text-gray-800 transition-colors"
                          >
                            <span className="font-bold">{w.name} (Ward {w.ward_number})</span>
                            <span className="text-gray-500 font-mono text-[10px]">{w.tree_count.toLocaleString()} trees</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.diseases.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase font-bold text-gray-400 mb-1 font-sans">Pathologies</div>
                      <div className="space-y-1">
                        {searchResults.diseases.map((d) => (
                          <Link
                            key={d.disease_id}
                            href="/similarity"
                            onClick={() => setIsSearchOpen(false)}
                            className="p-2 rounded bg-gray-50 hover:bg-emerald-50/60 border border-gray-200/80 flex items-center justify-between text-gray-800 transition-colors"
                          >
                            <span className="font-bold">{d.common_name}</span>
                            <span className="text-emerald-800 font-semibold">{d.typical_cure_rate}% Cure</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.trees.length === 0 && searchResults.wards.length === 0 && searchResults.diseases.length === 0 && (
                    <div className="p-4 text-center text-gray-400 font-sans">
                      No records found matching &ldquo;{searchQuery}&rdquo;.
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
              <span>Quick navigation across 142,850 cataloged records</span>
              <span className="font-mono text-emerald-800 font-semibold">GiST Index Active</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

