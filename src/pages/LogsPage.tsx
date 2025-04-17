import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, FileText, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from "@/components/ui/table";

interface HotspotLog {
    time: string;
    date: string;
    user: string;
    ip: string;
    mac: string;
    message: string;
    status: string;
}

interface HotspotLogsResponse {
    total: number;
    logs: HotspotLog[];
}

function LogsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const routerId = localStorage.getItem('routerConnectionId');

    // Fetch hotspot logs
    const { data: hotspotLogs, isLoading, refetch } = useQuery<{ success: boolean; data: HotspotLogsResponse }>({
        queryKey: ['hotspotLogs', routerId],
        queryFn: async () => {
            if (!routerId) throw new Error('No router connected');
            const response = await fetch(`http://localhost:3001/api/router/${routerId}/hotspot-logs`);
            return response.json();
        },
        refetchInterval: 5000,
        enabled: !!routerId
    });

    // Filter logs based on search term and status
    const filteredLogs = hotspotLogs?.data.logs.filter(log => {
        const matchesSearch = 
            log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.message.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (filterStatus === "all") return matchesSearch;
        return matchesSearch && log.status.toLowerCase().includes(filterStatus);
    });

    // Pagination calculations
    const totalItems = filteredLogs?.length || 0;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredLogs?.slice(startIndex, endIndex);

    // Reset to first page when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus]);

    const handlePageChange = (page: number) => {
        setCurrentPage(Math.min(Math.max(1, page), totalPages));
    };

    const getStatusColor = (status: string): string => {
        if (status.includes('login-success')) return 'text-green-700 bg-green-50 border border-green-200';
        if (status.includes('login-failure')) return 'text-red-700 bg-red-50 border border-red-200';
        if (status.includes('logout')) return 'text-yellow-700 bg-yellow-50 border border-yellow-200';
        return 'text-blue-700 bg-blue-50 border border-blue-200';
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto" style={{ backgroundColor: '#e0c3fc', backgroundImage: 'linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)' }}>
            <Card className="glass-effect border border-gray-200/50 shadow-sm">
                <CardHeader className="py-4 px-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <CardTitle className="text-lg font-medium">Hotspot Logs</CardTitle>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => refetch()}
                            className="h-9 text-sm"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-5">
                    {/* Search and Filter Section */}
                    <div className="flex gap-4 mb-6">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by user, IP, or message..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="success">Success</SelectItem>
                                <SelectItem value="failure">Failure</SelectItem>
                                <SelectItem value="logout">Logout</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Logs Table */}
                    <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table className="w-full">
                                <TableHeader className="bg-gray-50">
                                    <TableRow className="border-b border-gray-200">
                                        <TableHead className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Time</TableHead>
                                        <TableHead className="px-4 py-3 text-left text-xs font-semibold text-gray-600">User IP</TableHead>
                                        <TableHead className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Message</TableHead>
                                        <TableHead className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="bg-white divide-y divide-gray-200">
                                    {isLoading ? (
                                        [...Array(5)].map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="px-4 py-3"><Skeleton className="h-5 w-24" /></TableCell>
                                                <TableCell className="px-4 py-3"><Skeleton className="h-5 w-32" /></TableCell>
                                                <TableCell className="px-4 py-3"><Skeleton className="h-5 w-64" /></TableCell>
                                                <TableCell className="px-4 py-3"><Skeleton className="h-5 w-24" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : currentItems?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="px-4 py-4 text-sm text-gray-500 text-center">
                                                No logs found matching your criteria
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        currentItems?.map((log, index) => (
                                            <TableRow key={index} className="hover:bg-gray-50">
                                                <TableCell className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                                                    {log.time}
                                                </TableCell>
                                                <TableCell className="px-4 py-3">
                                                    <div className="text-sm font-medium text-gray-900">{log.ip}</div>
                                                    <div className="text-sm text-gray-500">{log.user}</div>
                                                </TableCell>
                                                <TableCell className="px-4 py-3 text-sm text-gray-600 max-w-md truncate">
                                                    {log.message}
                                                </TableCell>
                                                <TableCell className="px-4 py-3">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                                                        {log.status.replace('login-failure: ', '').replace('login-', '')}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination Controls */}
                        {!isLoading && totalItems > 0 && (
                            <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
                                <div className="flex items-center text-sm text-gray-500">
                                    Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} results
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(1)}
                                        disabled={currentPage === 1}
                                        className="hidden sm:flex"
                                    >
                                        <ChevronsLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }

                                            return (
                                                <Button
                                                    key={i}
                                                    variant={currentPage === pageNum ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className="hidden sm:flex w-9"
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="hidden sm:flex"
                                    >
                                        <ChevronsRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default LogsPage;