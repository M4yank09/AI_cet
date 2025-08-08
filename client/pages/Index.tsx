import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, ChevronUp, ChevronDown, X } from "lucide-react";

interface CutoffData {
  Rank: number;
  Percentile: number;
  "Choice Code": string;
  "Institute Name": string;
  "Course Name": string;
  Type: string;
}

type SortField = "Rank" | "Percentile";
type SortOrder = "asc" | "desc";

export default function Index() {
  const [data, setData] = useState<CutoffData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [rankFilter, setRankFilter] = useState<string>("");
  const [percentileFilter, setPercentileFilter] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>("");

  // Sorting states
  const [sortField, setSortField] = useState<SortField>("Rank");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Fetch data with multiple fallback options
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Multiple CORS proxy options for reliability
        const corsProxies = [
          "https://api.allorigins.win/get?url=",
          "https://corsproxy.io/?",
          "https://api.codetabs.com/v1/proxy?quest="
        ];

        const dataUrl = "https://drive.google.com/uc?export=download&id=1j2VzL9OBR8rVb5DD_4wgvIlE7bCzVI-n";

        // Try server endpoint first (for local development)
        try {
          const response = await fetch("/api/cutoffs");
          if (response.ok) {
            const jsonData = await response.json();
            setData(jsonData);
            return;
          }
        } catch (e) {
          console.log("Server endpoint not available, trying proxies...");
        }

        // Try each CORS proxy
        for (const proxy of corsProxies) {
          try {
            console.log(`Trying proxy: ${proxy}`);
            let response;
            let jsonData;

            if (proxy.includes("allorigins")) {
              response = await fetch(proxy + encodeURIComponent(dataUrl));
              if (response.ok) {
                const proxyData = await response.json();
                jsonData = JSON.parse(proxyData.contents);
              }
            } else {
              response = await fetch(proxy + encodeURIComponent(dataUrl));
              if (response.ok) {
                jsonData = await response.json();
              }
            }

            if (jsonData && Array.isArray(jsonData)) {
              setData(jsonData);
              return;
            }
          } catch (e) {
            console.log(`Proxy ${proxy} failed:`, e);
            continue;
          }
        }

        // If all proxies fail, try direct fetch (might work in some browsers)
        try {
          console.log("Trying direct fetch...");
          const response = await fetch(dataUrl);
          if (response.ok) {
            const jsonData = await response.json();
            setData(jsonData);
            return;
          }
        } catch (e) {
          console.log("Direct fetch failed:", e);
        }

        throw new Error("All data sources failed. Please try again later.");

      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = [...data];

    // Apply rank and percentile filters - fix the logic
    if (rankFilter || percentileFilter) {
      filtered = data.filter((item) => {
        const userRank = rankFilter ? parseInt(rankFilter) : null;
        const userPercentile = percentileFilter
          ? parseFloat(percentileFilter)
          : null;

        let matches = false;

        // If user enters percentile, show courses where dataset percentile <= user percentile
        if (userPercentile !== null) {
          matches = matches || item.Percentile <= userPercentile;
        }

        // If user enters rank, show courses where dataset rank >= user rank
        if (userRank !== null) {
          matches = matches || item.Rank >= userRank;
        }

        return matches;
      });
    }

    // Apply search filter - fix potential crashes
    if (searchFilter.trim()) {
      const searchLower = searchFilter.toLowerCase().trim();
      filtered = filtered.filter((item) => {
        const instituteName = item["Institute Name"] || "";
        const courseName = item["Course Name"] || "";
        return (
          instituteName.toLowerCase().includes(searchLower) ||
          courseName.toLowerCase().includes(searchLower)
        );
      });
    }

    // Sort data - only for Rank and Percentile
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });

    return filtered;
  }, [data, rankFilter, percentileFilter, searchFilter, sortField, sortOrder]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedData, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setRankFilter("");
    setPercentileFilter("");
    setSearchFilter("");
    setCurrentPage(1);
  };

  const hasActiveFilters = rankFilter || percentileFilter || searchFilter;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-600 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading MHT-CET cutoff data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-md text-center">
          <div className="text-red-400 text-lg font-semibold mb-3">
            Error Loading Data
          </div>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-white text-black hover:bg-gray-200"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="p-4 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">
            MHT-CET
          </h1>
          <p className="text-lg text-gray-400">
            Cap 1 Cutoffs 2025 - All India Quota (JEE Mains)
          </p>
        </div>

        {/* Filters */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Filters</h2>
            {hasActiveFilters && (
              <Button
                onClick={clearFilters}
                variant="ghost"
                className="text-gray-400 hover:text-white text-sm"
              >
                Clear All
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                All India Merit Rank
              </label>
              <Input
                type="number"
                placeholder="Enter your rank"
                value={rankFilter}
                onChange={(e) => setRankFilter(e.target.value)}
                className="bg-black border-zinc-700 text-white placeholder-gray-500 h-10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Percentile
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="Enter your percentile"
                value={percentileFilter}
                onChange={(e) => setPercentileFilter(e.target.value)}
                className="bg-black border-zinc-700 text-white placeholder-gray-500 h-10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search College/Course
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search by college or course"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-10 bg-black border-zinc-700 text-white placeholder-gray-500 h-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-4 text-gray-400 text-sm">
          Showing {paginatedData.length} of {filteredAndSortedData.length}{" "}
          results
        </div>

        {/* Data Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-zinc-800 border-b border-zinc-700">
                  {/* Sortable columns */}
                  <th
                    className="text-left p-4 font-semibold text-white cursor-pointer hover:bg-zinc-700 transition-colors"
                    onClick={() => handleSort("Rank")}
                  >
                    <div className="flex items-center gap-1">
                      Rank
                      {sortField === "Rank" &&
                        (sortOrder === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                    </div>
                  </th>

                  <th
                    className="text-left p-4 font-semibold text-white cursor-pointer hover:bg-zinc-700 transition-colors"
                    onClick={() => handleSort("Percentile")}
                  >
                    <div className="flex items-center gap-1">
                      Percentile
                      {sortField === "Percentile" &&
                        (sortOrder === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                    </div>
                  </th>

                  {/* Non-sortable columns */}
                  <th className="text-left p-4 font-semibold text-white">
                    Choice Code
                  </th>
                  <th className="text-left p-4 font-semibold text-white">
                    Institute Name
                  </th>
                  <th className="text-left p-4 font-semibold text-white">
                    Course Name
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b border-zinc-800 hover:bg-zinc-800 transition-colors"
                  >
                    <td className="p-4 text-white font-medium">
                      {item.Rank.toLocaleString()}
                    </td>
                    <td className="p-4 text-white font-medium">
                      {item.Percentile}
                    </td>
                    <td className="p-4 text-gray-300 font-mono text-sm">
                      {item["Choice Code"]}
                    </td>
                    <td className="p-4 text-white">{item["Institute Name"]}</td>
                    <td className="p-4 text-gray-300">{item["Course Name"]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              variant="outline"
              className="bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800 px-4 py-2"
            >
              Previous
            </Button>

            <div className="px-4 py-2 text-white">
              Page {currentPage} of {totalPages}
            </div>

            <Button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              variant="outline"
              className="bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800 px-4 py-2"
            >
              Next
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 py-6 mt-8">
          <p className="text-sm">with 💖 by Volt</p>
        </div>
      </div>
    </div>
  );
}
