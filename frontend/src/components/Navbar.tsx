"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Trees,
  Menu,
  Search,
  Database,
  Compass,
  Layers,
  Sparkles,
  X,
  ShieldAlert,
  Wrench,
  BarChart3,
  Megaphone,
  User,
  ArrowRight
} from "lucide-react";
import { TREES, WARDS, DISEASES } from "@/lib/db";

const GithubIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
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

const NAV_LINKS = [
  { title: "Trees", href: "/trees" },
  { title: "Spatial Map", href: "/map" },
  { title: "Triage", href: "/alerts" },
  { title: "Field Kanban", href: "/work-orders" },
  { title: "Analytics", href: "/analytics" },
  { title: "Citizen Portal", href: "/report" }
];

export default function Navbar() {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Keyboard shortcut (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
      <header className="sticky top-0 z-50 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 flex items-center justify-between">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs border border-emerald-500/30">
              <img src="/icon.svg" alt="EverLeafDB" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-base tracking-tight text-slate-950">EverLeafDB</span>
          </Link>
          <span className="hidden sm:inline-flex text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold shrink-0 whitespace-nowrap">
            PostgreSQL 16
          </span>
        </div>

        {/* Center: Standard Clean Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 mx-4">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors shrink-0 whitespace-nowrap ${
                  isActive
                    ? "bg-slate-900 text-white font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
                }`}
              >
                {link.title}
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Search Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="hidden md:flex items-center gap-2 h-8 px-2.5 text-xs sm:text-sm text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shrink-0 whitespace-nowrap"
            title="Quick Search (⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search DB...</span>
            <kbd className="text-xs bg-white border border-slate-200 px-1.5 py-0.2 rounded text-slate-500 font-mono shadow-2xs">
              ⌘K
            </kbd>
          </button>

          {/* GitHub Repository */}
          <a
            href="https://github.com/karthik5033/EverLeafDB"
            target="_blank"
            rel="noreferrer"
            className="p-1.5 text-slate-500 hover:text-slate-950 hover:bg-slate-100 rounded-md transition-colors shrink-0"
            title="GitHub Open Source Repository"
          >
            <GithubIcon />
          </a>

          <div className="hidden sm:block h-4 w-px bg-slate-200 mx-1 shrink-0"></div>

          {/* Sign In */}
          <Link
            href="/login"
            className={`hidden sm:inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 whitespace-nowrap ${
              pathname === "/login"
                ? "bg-slate-100 text-slate-950 font-semibold"
                : "text-slate-700 hover:text-slate-950 hover:bg-slate-100"
            }`}
          >
            Sign In
          </Link>

          {/* Primary CTA */}
          <Link href="/console" className="shrink-0">
            <button className="h-8 px-3.5 text-xs font-semibold bg-slate-950 hover:bg-slate-900 text-white rounded-lg border border-emerald-500/40 shadow-sm shadow-emerald-500/20 hover:shadow-md hover:shadow-emerald-500/35 transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap hover:border-emerald-400">
              <span>Console</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 ml-1"
            title="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 bg-white p-4 space-y-1 animate-in fade-in slide-in-from-top-2">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  isActive ? "bg-slate-900 text-white font-semibold" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {link.title}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-100 space-y-1">
            <Link
              href="/console"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-xs font-semibold text-slate-900 rounded-lg hover:bg-slate-100 flex items-center justify-between"
            >
              <span>Multi-Model SQL Console</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-xs font-medium text-slate-600 rounded-lg hover:bg-slate-100"
            >
              Sign In (Inspector Session)
            </Link>
          </div>
        </div>
      )}

      {/* Search Modal (⌘K) */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-20 p-4"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 border-b border-slate-100 flex items-center gap-3">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search cataloged trees, municipal wards, or pathologies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm outline-none text-slate-900 placeholder:text-slate-400 font-sans"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-900 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-3 text-xs space-y-3 font-mono">
              {!searchQuery.trim() ? (
                <div className="p-4 text-center text-slate-400 font-sans text-xs">
                  Type to search trees by tag (e.g. <span className="font-mono text-slate-900 font-semibold">TREE-1084</span>), species (<span className="font-mono text-slate-900 font-semibold">Banyan</span>), or ward (<span className="font-mono text-slate-900 font-semibold">Cubbon</span>).
                </div>
              ) : searchResults && (
                <>
                  {searchResults.trees.length > 0 && (
                    <div>
                      <div className="text-xs uppercase font-bold text-slate-500 mb-1 font-sans">Trees Found</div>
                      <div className="space-y-1">
                        {searchResults.trees.map((t) => (
                          <Link
                            key={t.tree_id}
                            href={`/map?tree_id=${t.tree_id}`}
                            onClick={() => setIsSearchOpen(false)}
                            className="p-2 rounded-lg bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 flex items-center justify-between text-slate-800 transition-colors text-sm"
                          >
                            <div>
                              <span className="font-bold text-slate-950 mr-2">{t.tag_number}</span>
                              <span className="text-slate-600">{t.species_common} ({t.ward_name})</span>
                            </div>
                            <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold font-mono">
                              {t.health_status}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.wards.length > 0 && (
                    <div>
                      <div className="text-xs uppercase font-bold text-slate-500 mb-1 font-sans">Municipal Wards</div>
                      <div className="space-y-1">
                        {searchResults.wards.map((w) => (
                          <Link
                            key={w.ward_id}
                            href={`/map?ward_id=${w.ward_id}`}
                            onClick={() => setIsSearchOpen(false)}
                            className="p-2 rounded-lg bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 flex items-center justify-between text-slate-800 transition-colors text-sm"
                          >
                            <span className="font-bold text-slate-900">{w.name} (Ward {w.ward_number})</span>
                            <span className="text-slate-500 font-mono text-xs">{w.tree_count.toLocaleString()} trees</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.diseases.length > 0 && (
                    <div>
                      <div className="text-xs uppercase font-bold text-slate-500 mb-1 font-sans">Pathologies</div>
                      <div className="space-y-1">
                        {searchResults.diseases.map((d) => (
                          <Link
                            key={d.disease_id}
                            href="/similarity"
                            onClick={() => setIsSearchOpen(false)}
                            className="p-2 rounded-lg bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 flex items-center justify-between text-slate-800 transition-colors text-sm"
                          >
                            <span className="font-bold text-slate-900">{d.common_name}</span>
                            <span className="text-emerald-800 font-semibold text-xs">{d.typical_cure_rate}% Cure</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.trees.length === 0 && searchResults.wards.length === 0 && searchResults.diseases.length === 0 && (
                    <div className="p-4 text-center text-slate-400 font-sans text-xs">
                      No records found matching &ldquo;{searchQuery}&rdquo;.
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Quick navigation across 142,850 cataloged records</span>
              <span className="font-mono text-emerald-800 font-semibold">GiST Index Active</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
