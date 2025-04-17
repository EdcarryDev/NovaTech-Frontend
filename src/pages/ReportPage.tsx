import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { FileSpreadsheet, FileDown, Search, CalendarIcon, DollarSign } from "lucide-react";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';

interface Transaction {
    voucherName: string;
    profile: string;
    batchName: string;
    firstLoginDate: string;
    firstLoginTime: string;
    lastLoginDate: string;
    lastLoginTime: string;
    ipAddress: string;
    macAddress: string;
    price: string;
    rawPrice: number;
    comment: string;
    limitUptime: string;
    loginCount: number;
    usageDurationSeconds: number;
    usageDurationFormatted: string;
}

interface RevenueStats {
    daily: Array<{ date: string; revenue: number }>;
    monthly: Array<{ month: string; revenue: number }>;
}

interface ReportData {
    currency: string;
    total: number;
    totalRevenue: number;
    todayRevenue: number;
    thisMonthRevenue: number;
    averageRevenue: number;
    averageLoginsPerVoucher: number;
    dateRange: {
        start: string;
        end: string;
        currentMonth: string;
    };
    revenueStats: RevenueStats;
    transactions: Transaction[];
}

function ReportPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [date, setDate] = useState<Date>();
    const [chartView, setChartView] = useState<"daily" | "monthly">("daily");
    const routerId = localStorage.getItem('routerConnectionId');

    const { data: reportData } = useQuery<{ success: boolean; data: ReportData }>({
        queryKey: ['voucherTransactions', routerId],
        queryFn: async () => {
            if (!routerId) throw new Error('No router connected');
            const response = await fetch(`http://localhost:3001/api/router/${routerId}/voucher-transactions`);
            return response.json();
        },
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    const filteredTransactions = reportData?.data.transactions.filter(transaction => {
        const matchesSearch = 
            transaction.voucherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.profile.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.batchName.toLowerCase().includes(searchTerm.toLowerCase());

        if (!date) return matchesSearch;

        const transactionDate = parseISO(transaction.firstLoginDate);
        return matchesSearch && 
               transactionDate >= startOfDay(date) && 
               transactionDate <= endOfDay(date);
    });

    const prepareExportData = (transactions: Transaction[]) => {
        return transactions.map(t => ({
            'Voucher Name': t.voucherName,
            'Profile': t.profile,
            'Batch': t.batchName,
            'First Login Date': t.firstLoginDate,
            'First Login Time': t.firstLoginTime,
            'Last Login Date': t.lastLoginDate,
            'Last Login Time': t.lastLoginTime,
            'IP Address': t.ipAddress,
            'MAC Address': t.macAddress,
            'Price': t.price,
            'Usage Duration': t.usageDurationFormatted,
            'Login Count': t.loginCount,
            'Comment': t.comment
        }));
    };

    const exportData = (exportType: 'csv' | 'xlsx') => {
        if (!filteredTransactions?.length) return;

        const exportData = prepareExportData(filteredTransactions);
        const currentDate = format(new Date(), 'yyyy-MM-dd');
        const fileName = `hotspot-transactions-${exportType === 'csv' ? 'csv' : 'excel'}-${currentDate}`;
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);

        // Add column widths
        const columnWidths = [
            { wch: 15 }, // Voucher Name
            { wch: 15 }, // Profile
            { wch: 20 }, // Batch
            { wch: 12 }, // First Login Date
            { wch: 10 }, // First Login Time
            { wch: 12 }, // Last Login Date
            { wch: 10 }, // Last Login Time
            { wch: 15 }, // IP Address
            { wch: 18 }, // MAC Address
            { wch: 10 }, // Price
            { wch: 15 }, // Usage Duration
            { wch: 10 }, // Login Count
            { wch: 30 }, // Comment
        ];
        ws['!cols'] = columnWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

        if (exportType === 'csv') {
            XLSX.writeFile(wb, `${fileName}.csv`, { bookType: 'csv' });
        } else {
            XLSX.writeFile(wb, `${fileName}.xlsx`);
        }
    };

    const formatCurrency = (amount: number) => {
        return `${amount.toLocaleString()} ${reportData?.data.currency || 'LRD'}`;
    };

    const formatChartDate = (dateStr: string, view: "daily" | "monthly") => {
        try {
            if (view === "daily") {
                return format(parseISO(dateStr), "MMMM d, yyyy");
            } else {
                // For monthly view, append day to make it a valid date
                return format(parseISO(dateStr + "-01"), "MMMM yyyy");
            }
        } catch (error) {
            console.error(error);
            return dateStr; // Fallback to original string if parsing fails
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            {/* Revenue Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="glass-effect">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Today's Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center">
                            <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                            <span className="text-2xl font-bold">
                                {formatCurrency(reportData?.data.todayRevenue || 0)}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-effect">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">This Month</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center">
                            <DollarSign className="h-5 w-5 text-blue-500 mr-2" />
                            <span className="text-2xl font-bold">
                                {formatCurrency(reportData?.data.thisMonthRevenue || 0)}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-effect">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center">
                            <DollarSign className="h-5 w-5 text-purple-500 mr-2" />
                            <span className="text-2xl font-bold">
                                {formatCurrency(reportData?.data.totalRevenue || 0)}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-effect">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Average Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center">
                            <DollarSign className="h-5 w-5 text-orange-500 mr-2" />
                            <span className="text-2xl font-bold">
                                {formatCurrency(reportData?.data.averageRevenue || 0)}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue Chart */}
            <Card className="glass-effect">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Revenue Overview</CardTitle>
                    <div className="flex items-center gap-4">
                        <Select value={chartView} onValueChange={(value: "daily" | "monthly") => setChartView(value)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select view" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">Daily View</SelectItem>
                                <SelectItem value="monthly">Monthly View</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={reportData?.data.revenueStats[chartView] || []}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey={chartView === "daily" ? "date" : "month"} 
                                    tickFormatter={(value) => {
                                        try {
                                            if (chartView === "daily") {
                                                return format(parseISO(value), "MMM dd");
                                            }
                                            return format(parseISO(value + "-01"), "MMM yyyy");
                                        } catch (error) {
                                            console.error(error);
                                            return value;
                                        }
                                    }}
                                />
                                <YAxis />
                                <Tooltip 
                                    formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                                    labelFormatter={(label) => formatChartDate(label, chartView)}
                                />
                                <Bar dataKey="revenue" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card className="glass-effect">
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <CardTitle>Transaction History</CardTitle>
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex gap-2">
                                <Button 
                                    variant="outline" 
                                    onClick={() => exportData('csv')}
                                    disabled={!filteredTransactions?.length}
                                >
                                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                                    Export CSV
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={() => exportData('xlsx')}
                                    disabled={!filteredTransactions?.length}
                                >
                                    <FileDown className="h-4 w-4 mr-2" />
                                    Export Excel
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Filters */}
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search transactions..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-[240px] justify-start text-left font-normal",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            {date && (
                                <Button 
                                    variant="ghost" 
                                    onClick={() => setDate(undefined)}
                                    className="px-2 h-9"
                                >
                                    Clear date
                                </Button>
                            )}
                        </div>

                        {/* Table */}
                        <div className="rounded-lg border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Voucher</TableHead>
                                        <TableHead>Profile</TableHead>
                                        <TableHead>First Login</TableHead>
                                        <TableHead>Last Login</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Usage</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTransactions?.map((transaction, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{transaction.voucherName}</TableCell>
                                            <TableCell>{transaction.profile}</TableCell>
                                            <TableCell>
                                                {format(parseISO(transaction.firstLoginDate), "MMM d, yyyy")}
                                                <br />
                                                <span className="text-gray-500">{transaction.firstLoginTime}</span>
                                            </TableCell>
                                            <TableCell>
                                                {format(parseISO(transaction.lastLoginDate), "MMM d, yyyy")}
                                                <br />
                                                <span className="text-gray-500">{transaction.lastLoginTime}</span>
                                            </TableCell>
                                            <TableCell>{transaction.price}</TableCell>
                                            <TableCell>
                                                <div>{transaction.usageDurationFormatted}</div>
                                                <div className="text-gray-500">
                                                    {transaction.loginCount} login{transaction.loginCount !== 1 ? 's' : ''}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default ReportPage;
