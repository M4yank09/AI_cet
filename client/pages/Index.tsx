import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, SortAsc, SortDesc } from "lucide-react";

interface CutoffData {
  Rank: number;
  Percentile: number;
  "Choice Code": string;
  "Institute Name": string;
  "Course Name": string;
  Type: string;
}

type SortField = keyof CutoffData;
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

  // Fetch data from Google Drive
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://drive.google.com/uc?export=download&id=1j2VzL9OBR8rVb5DD_4wgvIlE7bCzVI-n');
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
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
    let filtered = data;

    // Apply rank and percentile filters
    if (rankFilter || percentileFilter) {
      filtered = data.filter(item => {
        const userRank = rankFilter ? parseInt(rankFilter) : null;
        const userPercentile = percentileFilter ? parseFloat(percentileFilter) : null;
        
        // Show rows where dataset Percentile <= user's percentile OR dataset Rank >= user's rank
        const percentileMatch = userPercentile ? item.Percentile <= userPercentile : true;
        const rankMatch = userRank ? item.Rank >= userRank : true;
        
        return percentileMatch || rankMatch;
      });
    }

    // Apply search filter
    if (searchFilter) {
      const searchLower = searchFilter.toLowerCase();
      filtered = filtered.filter(item =>
        item["Institute Name"].toLowerCase().includes(searchLower) ||
        item["Course Name"].toLowerCase().includes(searchLower)
      );
    }

    // Sort data
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        return sortOrder === 'asc' 
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/70">Loading MHT-CET cutoff data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="glass-card max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/70">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4 button-glow"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-2 header-glow">
            MHT-CET
          </h1>
          <p className="text-xl md:text-2xl text-foreground/80 font-light">All India College Cutoffs</p>
        </div>

        {/* Filters */}
        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Filter className="w-5 h-5" />
              Filter Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  All India Merit Rank
                </label>
                <Input
                  type="number"
                  placeholder="Enter your rank"
                  value={rankFilter}
                  onChange={(e) => setRankFilter(e.target.value)}
                  className="input-glow bg-input/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Percentile
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter your percentile"
                  value={percentileFilter}
                  onChange={(e) => setPercentileFilter(e.target.value)}
                  className="input-glow bg-input/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Search College/Course
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/50" />
                  <Input
                    placeholder="Search by college or course"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-10 input-glow bg-input/50"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={clearFilters}
                  variant="outline"
                  className="w-full button-glow"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-4 text-foreground/70">
          Showing {paginatedData.length} of {filteredAndSortedData.length} results
        </div>

        {/* Data Table */}
        <Card className="glass-card mb-6">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    {[
                      { key: 'Rank' as SortField, label: 'Rank' },
                      { key: 'Percentile' as SortField, label: 'Percentile' },
                      { key: 'Choice Code' as SortField, label: 'Choice Code' },
                      { key: 'Institute Name' as SortField, label: 'Institute Name' },
                      { key: 'Course Name' as SortField, label: 'Course Name' },
                    ].map(({ key, label }) => (
                      <th
                        key={key}
                        className="text-left p-4 font-semibold text-foreground cursor-pointer hover:bg-primary/10 transition-all duration-200"
                        onClick={() => handleSort(key)}
                      >
                        <div className="flex items-center gap-2">
                          {label}
                          {sortField === key && (
                            sortOrder === 'asc' ? <SortAsc className="w-4 h-4 text-primary" /> : <SortDesc className="w-4 h-4 text-primary" />
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item, index) => (
                    <tr 
                      key={index}
                      className="border-b border-border/30 table-row-hover"
                    >
                      <td className="p-4 text-foreground">{item.Rank}</td>
                      <td className="p-4 text-foreground">{item.Percentile}</td>
                      <td className="p-4 text-foreground/80 font-mono text-sm">{item["Choice Code"]}</td>
                      <td className="p-4 text-foreground">{item["Institute Name"]}</td>
                      <td className="p-4 text-foreground">{item["Course Name"]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mb-8">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              variant="outline"
              className="button-glow"
            >
              Previous
            </Button>
            
            <span className="text-foreground/70 px-4">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              variant="outline"
              className="button-glow"
            >
              Next
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-foreground/50 py-4">
          by Volt
        </div>
      </div>
    </div>
  );
}
