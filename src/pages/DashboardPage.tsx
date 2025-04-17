import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users,
  DollarSign, 
  LineChart, 
  Wifi, 
  FileText, 
  Info, 
  RefreshCw,
  Server,
  Landmark,
  AlertCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TooltipProps } from 'recharts';
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import '../styles/dashboard.css';

// Interface declarations (same as before)
interface RouterUser {
  server: string;
  user: string;
  address: string;
  macAddress: string;
  uptime: string;
  timeLeft: string;
  bytesIn: string;
  bytesOut: string;
  status: string;
  idleTime: string;
  comment: string;
}

interface RouterStatus {
  activeUsers: {
    total: number;
    users: RouterUser[];
  };
  resources: {
    cpu: {
      loadPercentage: string;
      frequencyMHz: string;
      cores: number;
      model: string;
    };
    memory: {
      total: string;
      used: string;
      free: string;
      usedPercentage: string;
    };
    disk: {
      total: string;
      used: string;
      free: string;
      usedPercentage: string;
    };
    uptime: string;
    version: string;
    boardName: string;
  };
}

interface SystemHealth {
  voltage: string;
  temperature: string;
  processorTemperature: string;
  fanSpeed: string;
}

interface SystemInfo {
  identity: string;
  model: string;
  serialNumber: string;
  routerOS: {
    version: string;
    buildTime: string;
    factory_software: string;
    updateChannel: string;
    currentFirmware: string;
  };
  uptime: string;
  architecture: string;
  cpu: {
    model: string;
    count: string;
    frequency: string;
    threads: string;
  };
  firmware: string;
  health: SystemHealth;
  license: {
    level: string;
    deadline: string;
  };
}

interface LogEntry {
  time: string;
  timestamp: string;
  type: string;
  description: string;
  details: {
    host: string;
    user: string;
    router: string;
  };
}

interface LogsResponse {
  total: number;
  returned: number;
  logs: LogEntry[];
}

interface TrafficData {
    interface: string;
    type: string;
    running: boolean;
    tx: {
        bps: number;
        formatted: string;
    };
    rx: {
        bps: number;
        formatted: string;
    };
    timestamp: string;
    time: string;
}

interface ChartDataPoint {
    time: string;
    tx: number;
    rx: number;
}

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

interface Transaction {
  id: string;
  date: string;
  amount: number;
  currency: string;
  profile: string;
  voucher: string;
  status: string;
}

interface TransactionsResponse {
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
  transactions: Transaction[];
}

// Improved Progress Bar Component
const ProgressBar = ({ 
  value, 
  label, 
  details, 
  colorClass = "bg-blue-600",
  highThreshold = 80
}: { 
  value: string | number, 
  label: string, 
  details: string, 
  colorClass?: string,
  highThreshold?: number 
}) => {
  const percentage = typeof value === 'string' ? parseFloat(value) : value;
  const isHigh = percentage > highThreshold;

  return (
    <div className="space-y-2 p-3 rounded-lg border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:shadow">
      <div className="flex justify-between items-center">
        <span className="text-sm font-bold text-gray-800 flex items-center">
          {label}
          {isHigh && (
            <span className="ml-2 text-red-500">
              <AlertCircle className="h-4 w-4" />
            </span>
          )}
        </span>
        <span className={cn("text-sm font-bold rounded-full px-2 py-0.5", {
          "bg-red-100 text-red-700": isHigh,
          "bg-blue-100 text-blue-700": !isHigh
        })}>
          {percentage}%
        </span>
      </div>
      <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
        <div 
          className={`h-full ${colorClass} rounded-full shadow-inner transition-all duration-300 ease-out`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 font-medium">{details}</p>
    </div>
  );
};

// Improved Stat Card Component
const StatCard = ({ 
  icon, 
  title, 
  value, 
  description, 
  isLoading, 
  trend, 
}: { 
  icon: React.ReactNode, 
  title: string, 
  value: React.ReactNode, 
  description?: string, 
  isLoading?: boolean, 
  trend?: { 
    value: number | string, 
    direction: 'up' | 'down' | 'neutral' 
  }, 
  accentColor?: string 
}) => {
  return (
    <div className="glass-effect p-5 rounded-xl border backdrop-blur-sm transition-all duration-200 hover:shadow-md bg-white border-gray-300/100 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        {icon}
        {trend && (
          <span className={cn(
            "text-sm font-medium",
            {
              "text-green-600": trend.direction === 'up',
              "text-red-600": trend.direction === 'down',
              "text-gray-600": trend.direction === 'neutral',
            }
          )}>
            {trend.value}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium opacity-80">{title}</p>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="text-2xl font-semibold">{value}</p>
        )}
        {description && (
          <p className="text-sm opacity-60">{description}</p>
        )}
      </div>
    </div>
  );
};

export function DashboardPage() {
    const navigate = useNavigate();
    const [selectedInterface, setSelectedInterface] = useState<string>("");
    const [trafficHistory, setTrafficHistory] = useState<ChartDataPoint[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Get router ID from localStorage
  const routerId = localStorage.getItem('routerConnectionId');

  // Fetch router status
  const { data: routerStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery<{ success: boolean; data: RouterStatus }>({
    queryKey: ['routerStatus', routerId],
    queryFn: async () => {
      if (!routerId) throw new Error('No router connected');
      const response = await fetch(`http://localhost:3001/api/router/${routerId}/status`);
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
    enabled: !!routerId
  });

  // Fetch system information
  const { data: systemInfo, isLoading: sysInfoLoading, refetch: refetchSysInfo } = useQuery<{ success: boolean; data: SystemInfo }>({
    queryKey: ['systemInfo', routerId],
    queryFn: async () => {
      if (!routerId) throw new Error('No router connected');
      const response = await fetch(`http://localhost:3001/api/router/${routerId}/system-info`);
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
    enabled: !!routerId
  });

  // Fetch logs
  const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = useQuery<{ success: boolean; data: LogsResponse }>({
    queryKey: ['logs', routerId],
    queryFn: async () => {
      if (!routerId) throw new Error('No router connected');
      const response = await fetch(`http://localhost:3001/api/router/${routerId}/logs`);
      return response.json();
    },
    refetchInterval: 5000,
    enabled: !!routerId
  });

  // Fetch traffic data
  const { data: trafficData, refetch: refetchTraffic } = useQuery<{ success: boolean; data: TrafficData[] }>({
    queryKey: ['traffic', routerId],
    queryFn: async () => {
      if (!routerId) throw new Error('No router connected');
      const response = await fetch(`http://localhost:3001/api/router/${routerId}/simple-traffic`);
      return response.json();
    },
    refetchInterval: 5000, // Refresh every second
    enabled: !!routerId
  });

  // Fetch hotspot logs
  const { data: hotspotLogs, isLoading: hotspotLogsLoading, refetch: refetchHotspotLogs } = useQuery<{ success: boolean; data: HotspotLogsResponse }>({
    queryKey: ['hotspotLogs', routerId],
    queryFn: async () => {
      if (!routerId) throw new Error('No router connected');
      const response = await fetch(`http://localhost:3001/api/router/${routerId}/hotspot-logs`);
      return response.json();
    },
    refetchInterval: 5000,
    enabled: !!routerId
  });

  // Add this query for transactions
  const { data: transactionsData, isLoading: transactionsLoading, refetch: refetchTransactions } = useQuery<{ success: boolean; data: TransactionsResponse }>({
    queryKey: ['transactions', routerId],
    queryFn: async () => {
      if (!routerId) throw new Error('No router connected');
      const response = await fetch(`http://localhost:3001/api/router/${routerId}/voucher-transactions`);
      return response.json();
    },
    refetchInterval: 5000,
    enabled: !!routerId
  });

  // Fetch hotspot users
  const { data: hotspotUsersData, isLoading: hotspotUsersLoading, refetch: refetchHotspotUsers } = useQuery<{ success: boolean; data: HotspotLogsResponse }>({
    queryKey: ['hotspotUsers', routerId],
    queryFn: async () => {
      if (!routerId) throw new Error('No router connected');
      const response = await fetch(`http://localhost:3001/api/router/${routerId}/hotspot-users`);
      return response.json();
    },
    refetchInterval: 5000,
    enabled: !!routerId
  });

  // Get the total of hotspot users
  const totalHotspotUsers = hotspotUsersData?.data.total ? hotspotUsersData.data.total - 1 : 0;

  // Update traffic history when new data comes in
  useEffect(() => {
    if (trafficData?.data) {
      const selectedData = trafficData.data.find(d => 
        d.interface === (selectedInterface || trafficData.data[0]?.interface)
      );

      if (selectedData) {
        setTrafficHistory(prev => {
          const newPoint = {
            time: selectedData.time,
            tx: selectedData.tx.bps / 1000, // Convert to Kbps
            rx: selectedData.rx.bps / 1000  // Convert to Kbps
          };

          // Keep last 30 points
          const newHistory = [...prev, newPoint].slice(-30);
          return newHistory;
        });

        // If no interface is selected, select the first one
        if (!selectedInterface) {
          setSelectedInterface(trafficData.data[0]?.interface);
        }
      }
    }
  }, [trafficData, selectedInterface]);

  useEffect(() => {
    if (!routerId) {
      navigate('/');
    }
  }, [routerId, navigate]);

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchStatus(),
      refetchSysInfo(),
      refetchLogs(),
      refetchTraffic(),
      refetchHotspotLogs(),
      refetchTransactions(),
      refetchHotspotUsers()
    ]);
    setRefreshing(false);
  };

  const formatValue = (value: number | string): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '0 Kbps';
    if (numValue >= 1000) {
      return `${(numValue / 1000).toFixed(2)} Mbps`;
    }
    return `${numValue.toFixed(2)} Kbps`;
  };

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
        return (
        <div className="rounded-lg border-2 border-gray-200 bg-white p-4 shadow-xl">
          <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
              <span className="text-xs uppercase font-bold text-gray-500">
                            TX Rate
                        </span>
              <span className="font-bold text-lg text-blue-700">
                            {formatValue(payload[0]?.value ?? 0)}
                        </span>
                    </div>
                    <div className="flex flex-col">
              <span className="text-xs uppercase font-bold text-gray-500">
                            RX Rate
                        </span>
              <span className="font-bold text-lg text-blue-500">
                            {formatValue(payload[1]?.value ?? 0)}
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
  };

  const getLogTypeColor = (type: string): string => {
    switch (type.toLowerCase()) {
        case 'success':
        return 'text-green-700 bg-green-50 border border-green-200';
        case 'error':
        return 'text-red-700 bg-red-50 border border-red-200';
        case 'warning':
        return 'text-yellow-700 bg-yellow-50 border border-yellow-200';
        default:
        return 'text-blue-700 bg-blue-50 border border-blue-200';
    }
  };

  const getStatusColor = (status: string): string => {
    if (status.includes('login-success')) return 'text-green-700 bg-green-50 border border-green-200';
    if (status.includes('login-failure')) return 'text-red-700 bg-red-50 border border-red-200';
    if (status.includes('logout')) return 'text-yellow-700 bg-yellow-50 border border-yellow-200';
    return 'text-blue-700 bg-blue-50 border border-blue-200';
  };

  // Get uptime in a nice format
  const formatUptime = (uptime: string) => {
    return uptime.replace(/w|d|h|m|s/g, match => {
      const mapping: Record<string, string> = {
        w: ' weeks ',
        d: ' days ',
        h: ' hours ',
        m: ' minutes ',
        s: ' seconds'
      };
      return mapping[match] || match;
    });
  };

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: '#e0c3fc', backgroundImage: 'linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)' }}>
      {/* Tech Grid Background */}
      <div 
        className="fixed inset-0 z-0 opacity-[0.07]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(71, 85, 105, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(71, 85, 105, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Glowing Orbs */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-blue-100/40 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] right-[25%] w-[300px] h-[300px] bg-purple-100/40 rounded-full blur-[100px]" />
                        </div>

      {/* Network Lines */}
      <div 
        className="fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 0% 0%, rgba(99, 102, 241, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 100% 100%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
            linear-gradient(45deg, rgba(59, 130, 246, 0.03) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(59, 130, 246, 0.03) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, rgba(59, 130, 246, 0.03) 75%),
            linear-gradient(-45deg, transparent 75%, rgba(59, 130, 246, 0.03) 75%)
          `,
          backgroundSize: '100% 100%, 100% 100%, 100% 100%, 40px 40px, 40px 40px, 40px 40px, 40px 40px',
          backgroundPosition: '0 0, 0 0, 0 0, 0 0, 20px 20px, 0 0, 20px 20px'
        }}
      />

      {/* Floating Particles */}
      <div className="fixed inset-0 z-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              background: 'rgba(71, 85, 105, 0.3)',
              borderRadius: '50%',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 10 + 10}s`
            }}
          />
        ))}
                            </div>

      {/* Main Content */}
      <div className="relative z-10 p-6 max-w-[1600px] mx-auto">
        {/* Header section - More spacious */}
        <div className="glass-effect flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-white/70 backdrop-blur-lg p-5 rounded-xl border border-gray-200/100 shadow-sm">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>
            <p className="text-sm text-gray-500 mt-1">Real-time monitoring and analytics</p>
                        </div>
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <div className="text-sm px-3 py-1.5 bg-gray-50/70 rounded-lg border border-gray-200/50">
              {systemInfo?.data?.identity ? (
                <span className="font-medium">{systemInfo.data.identity}</span>
              ) : (
                <Skeleton className="h-5 w-28 inline-block" />
              )}
            </div>
            <Badge variant="outline" className="text-sm bg-green-50/70 text-green-700 border-green-200/50 px-3 py-1">
              <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
              Active
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 text-sm border-blue-200/50 bg-blue-50/70 px-4"
              onClick={refreshAll}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", { "animate-spin": refreshing })} />
              {refreshing ? "Syncing..." : "Sync"}
            </Button>
                            </div>
                        </div>

        {/* Stats Grid - More spacious */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard 
            icon={<Wifi className="h-5 w-5 text-blue-600" />}
            title="Active Users"
            value={statusLoading ? "..." : routerStatus?.data.activeUsers.total || 0}
            description="Connected clients"
            isLoading={statusLoading}
            accentColor="blue"
          />
          
          <StatCard 
            icon={<Users className="h-5 w-5 text-green-600" />}
            title="Total Users"
            value={hotspotUsersLoading ? "..." : totalHotspotUsers}
            description="Registered users"
            isLoading={hotspotUsersLoading}
            accentColor="green"
          />
          
          <StatCard 
            icon={<Landmark className="h-5 w-5 text-purple-600" />}
            title="Today's Revenue"
            value={transactionsLoading ? "..." : 
              transactionsData?.data ? `${transactionsData.data.currency} ${transactionsData.data.todayRevenue}` : "$0"
            }
            description="Today's earnings"
            isLoading={transactionsLoading}
            accentColor="purple"
          />
          
          <StatCard 
            icon={<DollarSign className="h-5 w-5 text-indigo-600" />}
            title="Monthly Revenue"
            value={transactionsLoading ? "..." : 
              transactionsData?.data ? `${transactionsData.data.currency} ${transactionsData.data.thisMonthRevenue}` : "$0"
            }
            description="Monthly earnings"
            isLoading={transactionsLoading}
            accentColor="indigo"
          />
                            </div>

        {/* Main Content Grid - More spacious */}
        <div className="grid grid-cols-12 gap-6 mb-6">
          {/* Resource Metrics - Update styles */}
          <Card className="glass-effect col-span-12 md:col-span-4 border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="py-4 px-5">
              <div className="flex items-center gap-3">
                <Server className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg font-medium">System Resources</CardTitle>
                        </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {statusLoading ? (
                <>
                  <Skeleton className="h-8 w-full mb-4 rounded" />
                  <Skeleton className="h-8 w-full mb-4 rounded" />
                  <Skeleton className="h-8 w-full rounded" />
                </>
              ) : (
                <>
                  <ProgressBar 
                    value={routerStatus?.data.resources.cpu.loadPercentage || "0"} 
                    label="CPU Load" 
                    details={`${routerStatus?.data.resources.cpu.cores}x ${routerStatus?.data.resources.cpu.frequencyMHz} MHz`}
                    colorClass={parseFloat(routerStatus?.data.resources.cpu.loadPercentage || "0") > 80 ? "bg-red-500" : "bg-blue-600"}
                    highThreshold={80}
                  />
                  
                  <ProgressBar 
                    value={routerStatus?.data.resources.memory.usedPercentage || "0"} 
                    label="Memory Usage" 
                    details={`${routerStatus?.data.resources.memory.used} / ${routerStatus?.data.resources.memory.total} MiB`}
                    colorClass={parseFloat(routerStatus?.data.resources.memory.usedPercentage || "0") > 80 ? "bg-red-500" : "bg-green-600"}
                    highThreshold={80}
                  />
                  
                  <ProgressBar 
                    value={routerStatus?.data.resources.disk.usedPercentage || "0"} 
                    label="Disk Usage" 
                    details={`${routerStatus?.data.resources.disk.used} / ${routerStatus?.data.resources.disk.total} MiB`}
                    colorClass={parseFloat(routerStatus?.data.resources.disk.usedPercentage || "0") > 80 ? "bg-red-500" : "bg-indigo-600"}
                    highThreshold={80}
                  />
                </>
              )}
                </CardContent>
            </Card>

          {/* System Info - Update styles */}
          <Card className="glass-effect col-span-12 md:col-span-4 border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="py-4 px-5">
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg font-medium">System Info</CardTitle>
                    </div>
                </CardHeader>
            <CardContent className="p-5">
              {sysInfoLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-5 w-24 rounded" />
                      <Skeleton className="h-5 w-40 rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  <div className="flex justify-between items-center py-3 px-2 hover:bg-gray-50 rounded">
                    <span className="text-sm font-semibold text-gray-700">Uptime</span>
                    <span className="text-sm font-medium text-gray-800 bg-gray-50 px-2 py-1 rounded border border-gray-200">{formatUptime(systemInfo?.data.uptime || "")}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 px-2 hover:bg-gray-50 rounded">
                    <span className="text-sm font-semibold text-gray-700">Model</span>
                    <span className="text-sm font-medium text-gray-800 bg-gray-50 px-2 py-1 rounded border border-gray-200">{systemInfo?.data.model || ""}</span>
                        </div>
                  <div className="flex justify-between items-center py-3 px-2 hover:bg-gray-50 rounded">
                    <span className="text-sm font-semibold text-gray-700">Serial</span>
                    <span className="text-sm font-medium text-gray-800 bg-gray-50 px-2 py-1 rounded border border-gray-200">{systemInfo?.data.serialNumber || ""}</span>
                        </div>
                  <div className="flex justify-between items-center py-3 px-2 hover:bg-gray-50 rounded">
                    <span className="text-sm font-semibold text-gray-700">RouterOS</span>
                    <span className="text-sm font-medium text-gray-800 bg-gray-50 px-2 py-1 rounded border border-gray-200">{systemInfo?.data.routerOS?.version || ""}</span>
                        </div>
                  <div className="flex justify-between items-center py-3 px-2 hover:bg-gray-50 rounded">
                    <span className="text-sm font-semibold text-gray-700">CPU</span>
                    <span className="text-sm font-medium text-gray-800 bg-gray-50 px-2 py-1 rounded border border-gray-200">{systemInfo?.data.cpu?.model || ""}</span>
                        </div>
                    </div>
              )}
                </CardContent>
            </Card>

          {/* Logs - Update styles */}
          <Card className="glass-effect col-span-12 md:col-span-4 border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="py-4 px-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  <CardTitle className="text-lg font-medium">Recent Logs</CardTitle>
                            </div>
                <Button variant="ghost" size="sm" className="h-8 px-3 text-sm">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                    </div>
                </CardHeader>
            <CardContent className="p-0">
              <div className="h-[300px] overflow-y-auto">
                        <table className="w-full">
                  <thead className="bg-gradient-to-r from-indigo-50 to-white sticky top-0 z-10">
                    <tr className="border-b-2 border-gray-200">
                      <th className="px-4 py-2 text-xs font-bold text-gray-700 text-left">Time</th>
                      <th className="px-4 py-2 text-xs font-bold text-gray-700 text-left">Type</th>
                      <th className="px-4 py-2 text-xs font-bold text-gray-700 text-left">Message</th>
                                </tr>
                            </thead>
                  <tbody className="divide-y divide-gray-100">
                                {logsLoading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i}>
                          <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded" /></td>
                          <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded" /></td>
                          <td className="px-4 py-3"><Skeleton className="h-5 w-full rounded" /></td>
                                    </tr>
                      ))
                                ) : logsData?.data.logs.length === 0 ? (
                                    <tr>
                        <td colSpan={3} className="px-4 py-4 text-sm text-gray-500 text-center">No logs available</td>
                                    </tr>
                                ) : (
                      logsData?.data.logs.slice(0, 10).map((log, index) => (
                        <tr key={index} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="px-4 py-2 text-xs font-medium text-gray-600 whitespace-nowrap">{log.time}</td>
                          <td className="px-4 py-2">
                            <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full font-medium shadow-sm ${getLogTypeColor(log.type)}`}>
                                                    {log.type}
                                                </span>
                                            </td>
                          <td className="px-4 py-2 text-xs text-gray-700 truncate max-w-[200px] font-medium">{log.description}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

          {/* Traffic Monitor - Update styles */}
          <Card className="glass-effect col-span-12 md:col-span-8 border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="py-4 px-5">
                    <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LineChart className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg font-medium">Traffic Monitor</CardTitle>
                        </div>
                <div className="flex items-center gap-3">
                  <Select value={selectedInterface} onValueChange={setSelectedInterface}>
                    <SelectTrigger className="h-9 text-sm w-[180px]">
                                    <SelectValue placeholder="Select interface" />
                                </SelectTrigger>
                                <SelectContent>
                                    {trafficData?.data.map((iface) => (
                                        <SelectItem 
                                            key={iface.interface} 
                                            value={iface.interface}
                                        >
                                            {iface.interface} ({iface.running ? 'Up' : 'Down'})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
            <CardContent className="p-5">
              <div className="h-[400px] w-full">
                {trafficHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-4">
                    <Skeleton className="h-6 w-64 rounded" />
                    <Skeleton className="h-6 w-48 rounded" />
                  </div>
                ) : (
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-inner h-full">
                        <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                                data={trafficHistory}
                                margin={{
                          top: 10,
                          right: 30,
                          left: 0,
                                    bottom: 0,
                                }}
                            >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200/80" />
                                <XAxis
                                    dataKey="time"
                          stroke="#4b5563"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                          fontWeight="500"
                                />
                                <YAxis
                          stroke="#4b5563"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={formatValue}
                          fontWeight="500"
                                />
                                <Tooltip content={CustomTooltip} />
                        <Area
                                    type="monotone"
                                    dataKey="tx"
                                    name="TX Rate"
                          stroke="#2563eb"
                          fill="#2563eb"
                          fillOpacity={0.25}
                          strokeWidth={3}
                          activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                        />
                        <Area
                                    type="monotone"
                                    dataKey="rx"
                                    name="RX Rate"
                          stroke="#60a5fa"
                          fill="#60a5fa"
                          fillOpacity={0.25}
                          strokeWidth={3}
                          activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                        />
                      </AreaChart>
                        </ResponsiveContainer>
                  </div>
                )}
                    </div>
                </CardContent>
            </Card>

          {/* Hotspot Activity - Update styles */}
          <Card className="glass-effect col-span-12 md:col-span-4 border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="py-4 px-5">
                    <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wifi className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-lg font-medium">Hotspot Activity</CardTitle>
                        </div>
                <Button variant="ghost" size="sm" className="h-8 px-3 text-sm">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                    </div>
                </CardHeader>
            <CardContent className="p-0">
              <div className="h-[400px] overflow-y-auto">
                        <table className="w-full">
                  <thead className="bg-gradient-to-r from-purple-50 to-white sticky top-0 z-10">
                    <tr className="border-b-2 border-gray-200">
                      <th className="px-3 py-2 text-xs font-bold text-gray-700 text-left">Time</th>
                      <th className="px-3 py-2 text-xs font-bold text-gray-700 text-left">User</th>
                      <th className="px-3 py-2 text-xs font-bold text-gray-700 text-left">Status</th>
                                </tr>
                            </thead>
                  <tbody className="divide-y divide-gray-100">
                                {hotspotLogsLoading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2"><Skeleton className="h-5 w-14 rounded" /></td>
                          <td className="px-3 py-2"><Skeleton className="h-5 w-20 rounded" /></td>
                          <td className="px-3 py-2"><Skeleton className="h-5 w-16 rounded-full" /></td>
                                    </tr>
                      ))
                                ) : hotspotLogs?.data.logs.length === 0 ? (
                                    <tr>
                        <td colSpan={3} className="px-3 py-3 text-sm text-gray-500 text-center">No hotspot activity</td>
                                    </tr>
                                ) : (
                      hotspotLogs?.data.logs.slice(0, 15).map((log, index) => (
                        <tr key={index} className="hover:bg-purple-50/30 transition-colors">
                          <td className="px-3 py-2 text-xs font-medium text-gray-600 whitespace-nowrap">{log.time}</td>
                          <td className="px-3 py-2 text-xs text-gray-700">
                            <div className="font-semibold truncate max-w-[100px]">{log.user}</div>
                            <div className="text-xs text-gray-500 truncate max-w-[100px]">{log.ip}</div>
                                            </td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full font-medium shadow-sm ${getStatusColor(log.status)}`}>
                                                    {log.status.replace('login-failure: ', '').replace('login-', '')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
        </div>
    </div>
  );
} 