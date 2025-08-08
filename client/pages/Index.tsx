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

type SortField = 'Rank' | 'Percentile';
type SortOrder = 'asc' | 'desc';

export default function Index() {
  const [data, setData] = useState<CutoffData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [rankFilter, setRankFilter] = useState<string>("");
  const [percentileFilter, setPercentileFilter] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>("");
  
  // Sorting states
  const [sortField, setSortField] = useState<SortField>('Rank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Fetch data from server proxy
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/cutoffs');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`);
        }
        
        const jsonData = await response.json();
        setData(jsonData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
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
      filtered = data.filter(item => {
        const userRank = rankFilter ? parseInt(rankFilter) : null;
        const userPercentile = percentileFilter ? parseFloat(percentileFilter) : null;
        
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
      filtered = filtered.filter(item => {
        const instituteName = item["Institute Name"] || "";
        const courseName = item["Course Name"] || "";
        return instituteName.toLowerCase().includes(searchLower) ||
               courseName.toLowerCase().includes(searchLower);
      });
    }

    // Sort data - only for Rank and Percentile
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
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
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
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
          <div className="w-16 h-16 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-white/70 text-lg">Loading MHT-CET cutoff data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 max-w-md text-center">
          <div className="text-red-400 text-xl font-semibold mb-4">Error Loading Data</div>
          <p className="text-white/70 mb-6">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-white text-black hover:bg-white/90 font-medium px-6 py-2 rounded-xl transition-all duration-300 hover:scale-105"
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
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white">
            MHT-CET
          </h1>
          <p className="text-lg text-gray-400">
            All India College Cutoffs
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 mb-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Filter className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-bold text-white">Filter Options</h2>
            {hasActiveFilters && (
              <Button
                onClick={clearFilters}
                variant="ghost"
                className="ml-auto text-white/60 hover:text-white hover:bg-white/10 rounded-xl px-4 py-2 transition-all duration-300"
              >
                <X className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-white/80 uppercase tracking-wider">
                All India Merit Rank
              </label>
              <Input
                type="number"
                placeholder="Enter your rank"
                value={rankFilter}
                onChange={(e) => setRankFilter(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-white/50 rounded-xl h-12 text-lg focus:border-white/40 focus:ring-white/20 transition-all duration-300"
              />
            </div>
            
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-white/80 uppercase tracking-wider">
                Percentile
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="Enter your percentile"
                value={percentileFilter}
                onChange={(e) => setPercentileFilter(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-white/50 rounded-xl h-12 text-lg focus:border-white/40 focus:ring-white/20 transition-all duration-300"
              />
            </div>
            
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-white/80 uppercase tracking-wider">
                Search College/Course
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <Input
                  placeholder="Search by college or course"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-12 bg-white/10 border-white/20 text-white placeholder-white/50 rounded-xl h-12 text-lg focus:border-white/40 focus:ring-white/20 transition-all duration-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6 text-white/60 text-lg">
          Showing <span className="text-white font-semibold">{paginatedData.length}</span> of <span className="text-white font-semibold">{filteredAndSortedData.length}</span> results
        </div>

        {/* Data Table */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/10 border-b border-white/10">
                  {/* Sortable columns */}
                  <th
                    className="text-left p-6 font-bold text-white cursor-pointer hover:bg-white/10 transition-all duration-300 group"
                    onClick={() => handleSort('Rank')}
                  >
                    <div className="flex items-center gap-2">
                      Rank
                      <div className="opacity-60 group-hover:opacity-100 transition-opacity">
                        {sortField === 'Rank' && sortOrder === 'asc' && <ChevronUp className="w-5 h-5" />}
                        {sortField === 'Rank' && sortOrder === 'desc' && <ChevronDown className="w-5 h-5" />}
                        {sortField !== 'Rank' && <ChevronUp className="w-5 h-5 opacity-30" />}
                      </div>
                    </div>
                  </th>
                  
                  <th
                    className="text-left p-6 font-bold text-white cursor-pointer hover:bg-white/10 transition-all duration-300 group"
                    onClick={() => handleSort('Percentile')}
                  >
                    <div className="flex items-center gap-2">
                      Percentile
                      <div className="opacity-60 group-hover:opacity-100 transition-opacity">
                        {sortField === 'Percentile' && sortOrder === 'asc' && <ChevronUp className="w-5 h-5" />}
                        {sortField === 'Percentile' && sortOrder === 'desc' && <ChevronDown className="w-5 h-5" />}
                        {sortField !== 'Percentile' && <ChevronUp className="w-5 h-5 opacity-30" />}
                      </div>
                    </div>
                  </th>
                  
                  {/* Non-sortable columns */}
                  <th className="text-left p-6 font-bold text-white">Choice Code</th>
                  <th className="text-left p-6 font-bold text-white">Institute Name</th>
                  <th className="text-left p-6 font-bold text-white">Course Name</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item, index) => (
                  <tr 
                    key={index}
                    className="border-b border-white/5 hover:bg-white/5 transition-all duration-300 group"
                  >
                    <td className="p-6 text-white font-semibold text-lg">{item.Rank.toLocaleString()}</td>
                    <td className="p-6 text-white font-semibold text-lg">{item.Percentile}</td>
                    <td className="p-6 text-white/80 font-mono text-sm bg-white/5 rounded-lg mx-2">{item["Choice Code"]}</td>
                    <td className="p-6 text-white group-hover:text-white transition-colors">{item["Institute Name"]}</td>
                    <td className="p-6 text-white/90">{item["Course Name"]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40 rounded-xl px-6 py-3 font-medium transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Previous
            </Button>
            
            <div className="bg-white/10 rounded-xl px-6 py-3 text-white font-medium">
              Page {currentPage} of {totalPages}
            </div>
            
            <Button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40 rounded-xl px-6 py-3 font-medium transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-white/40 py-8 mt-12">
          <p className="text-sm tracking-wider">by Volt</p>
        </div>
      </div>
    </div>
  );
}
