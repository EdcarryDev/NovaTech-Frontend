import { AlertDialog, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogContent, AlertDialogFooter, AlertDialogTrigger, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Router, Wifi, Save, Lock, Globe, Network, X, Plug, Trash2, Settings, Edit, UserCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

// Mock data for admins
const mockAdmins = [
  {
    id: '1',
    name: 'John Admin',
    lastActive: '2 minutes ago'
  },
  {
    id: '2',
    name: 'Sarah Manager',
    lastActive: '5 minutes ago'
  },
  {
    id: '3',
    name: 'Mike Supervisor',
    lastActive: '15 minutes ago'
  }
];

interface RouterConnectionParams {
  name: string;
  host: string;
  user: string;
  password: string;
  hotspotName: string;
  dnsName: string;
  currency: string;
  sessionTimeout: string;
  liveReport: boolean;
}

interface RouterData {
  id: number;
  name: string;
  username: string; // Changed from user to username
  password: string;
  host: string;
  hotspot_name: string;
  dns_name: string;
  currency: string;
  session_timeout: string;
  live_report: boolean;
  created_at?: string;
  last_connected?: string;
}

interface RouterConnectionResponse {
  success: boolean;
  connectionId?: string;
  message?: string;
}

// Custom hook for router connection
const useConnectRouter = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (params: RouterConnectionParams): Promise<RouterConnectionResponse> => {
      const response = await fetch('http://localhost:3001/api/router/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        localStorage.setItem('routerConnectionId', data.connectionId!);
        toast.success('Successfully connected to router');
        navigate('/dashboard');
      } else {
        toast.error(data.message || 'Failed to connect to router');
      }
    },
    onError: (error: Error) => {
      toast.error('Network error occurred. Please check your connection and try again.');
      console.error('Error connecting to router:', error);
    }
  });
};

export function RouterSessionPage() {
  const [activeTab, setActiveTab] = useState(() => {
    // Get the saved tab from localStorage or default to "add"
    return localStorage.getItem("routerActiveTab") || "add";
  });

  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [hotspotName, setHotspotName] = useState('');
  const [dnsName, setDnsName] = useState('');
  const [currency, setCurrency] = useState('');
  const [sessionTimeout, setSessionTimeout] = useState('');
  const [liveReport, setLiveReport] = useState(true);
  const [routers, setRouters] = useState<RouterData[]>([]);

  // Add validation state
  const [errors, setErrors] = useState({
    name: '',
    host: '',
    user: '',
    password: '',
    hotspotName: '',
    dnsName: '',
    currency: '',
    sessionTimeout: ''
  });

  // Add touched state to show errors only after field interaction
  const [touched, setTouched] = useState({
    name: false,
    host: false,
    user: false,
    password: false,
    hotspotName: false,
    dnsName: false,
    currency: false,
    sessionTimeout: false
  });

  const connectRouterMutation = useConnectRouter();

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'name':
        return value.trim() === '' ? 'Router name is required' : '';
      case 'host':
        return value.trim() === '' ? 'Host IP is required' : '';
      case 'user':
        return value.trim() === '' ? 'Username is required' : '';
      case 'password':
        return value.trim() === '' ? 'Password is required' : '';
      case 'hotspotName':
        return value.trim() === '' ? 'Hotspot name is required' : '';
      case 'dnsName':
        return value.trim() === '' ? 'DNS name is required' : '';
      case 'currency':
        return value.trim() === '' ? 'Currency is required' : '';
      case 'sessionTimeout':
        return value.trim() === '' ? 'Session timeout is required' : '';
      default:
        return '';
    }
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    let fieldValue = '';
    switch (field) {
      case 'name':
        fieldValue = name;
        break;
      case 'host':
        fieldValue = host;
        break;
      case 'user':
        fieldValue = user;
        break;
      case 'password':
        fieldValue = password;
        break;
      case 'hotspotName':
        fieldValue = hotspotName;
        break;
      case 'dnsName':
        fieldValue = dnsName;
        break;
      case 'currency':
        fieldValue = currency;
        break;
      case 'sessionTimeout':
        fieldValue = sessionTimeout;
        break;
    }
    setErrors(prev => ({ ...prev, [field]: validateField(field, fieldValue) }));
  };

  const isFormValid = () => {
    const newErrors = {
      name: validateField('name', name),
      host: validateField('host', host),
      user: validateField('user', user),
      password: validateField('password', password),
      hotspotName: validateField('hotspotName', hotspotName),
      dnsName: validateField('dnsName', dnsName),
      currency: validateField('currency', currency),
      sessionTimeout: validateField('sessionTimeout', sessionTimeout)
    };
    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (touched.name) {
      setErrors(prev => ({ ...prev, name: validateField('name', e.target.value) }));
    }
  }

  const handleHostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHost(e.target.value);
    if (touched.host) {
      setErrors(prev => ({ ...prev, host: validateField('host', e.target.value) }));
    }
  }

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUser(e.target.value);
    if (touched.user) {
      setErrors(prev => ({ ...prev, user: validateField('user', e.target.value) }));
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (touched.password) {
      setErrors(prev => ({ ...prev, password: validateField('password', e.target.value) }));
    }
  }

  const handleHotspotNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHotspotName(e.target.value);
    if (touched.hotspotName) {
      setErrors(prev => ({ ...prev, hotspotName: validateField('hotspotName', e.target.value) }));
    }
  }

  const handleDnsNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDnsName(e.target.value);
    if (touched.dnsName) {
      setErrors(prev => ({ ...prev, dnsName: validateField('dnsName', e.target.value) }));
    }
  }

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrency(e.target.value);
    if (touched.currency) {
      setErrors(prev => ({ ...prev, currency: validateField('currency', e.target.value) }));
    }
  }

  const handleSessionTimeoutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSessionTimeout(e.target.value);
    if (touched.sessionTimeout) {
      setErrors(prev => ({ ...prev, sessionTimeout: validateField('sessionTimeout', e.target.value) }));
    }
  }

  const handleLiveReportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLiveReport(e.target.value === 'enabled');
  }

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("routerActiveTab", activeTab);
  }, [activeTab]);

  const connectRouter = async ({ name, host, user, password, hotspotName, dnsName, currency, sessionTimeout, liveReport }: RouterConnectionParams) => {
    if (!isFormValid()) {
      // Set all fields as touched to show all errors
      setTouched({
        name: true,
        host: true,
        user: true,
        password: true,
        hotspotName: true,
        dnsName: true,
        currency: true,
        sessionTimeout: true
      });
      return;
    }

    connectRouterMutation.mutate({ 
      name, 
      host, 
      user, 
      password, 
      hotspotName, 
      dnsName, 
      currency, 
      sessionTimeout, 
      liveReport 
    });
  };

  const DeleteRouter = async (id: number) => {
    const response = await fetch(`http://localhost:3001/api/routers/${id}`, {
      method: 'DELETE',
    });

    // check if the router is connected and clear the connection id from local storage
    const routerConnectionId = localStorage.getItem('routerConnectionId');
    if (routerConnectionId) {
      localStorage.removeItem('routerConnectionId');
    }
    
    const data = await response.json();
    if (data.success) {
      console.log('Router deleted successfully');
      fetchRouterList();
    } else {
      console.error('Failed to delete router:', data.message);
    }
  }

  const EditRouter = async (routerData: EditRouterProps) => {
    try {
      const response = await fetch(`http://localhost:3001/api/routers/${routerData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: routerData.name,
          host: routerData.host,
          username: routerData.user,
          password: routerData.password,
          hotspot_name: routerData.hotspotName,
          dns_name: routerData.dnsName,
          currency: routerData.currency,
          session_timeout: routerData.sessionTimeout,
          live_report: routerData.liveReport
        })
      });

      const data = await response.json();
      if (data.success) {
        console.log('Router edited successfully');
        fetchRouterList(); // Refresh the router list
      } else {
        console.error('Failed to edit router:', data.message);
      }
    } catch (error) {
      console.error('Error editing router:', error);
    }
  }

  const fetchRouterList = async () => {
    const response = await fetch('http://localhost:3001/api/routers/');
    const data = await response.json();
    if (data.success) {    
      setRouters(data.routers);
    } else {
      console.error('Failed to fetch routers:', data.message);
    }
  }

  useEffect(() => {
    fetchRouterList();
  }, []);

  return (
    <div className="container mx-auto py-8 px-8 space-y-8 animate-fade-in">
      {/* Header Section with Glass Effect */}
      <div className="relative mb-12 rounded-3xl overflow-hidden backdrop-blur-sm border border-black/20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-blue-800/90" />
        <div className="absolute inset-0 bg-grid-white/[0.2] bg-grid-pattern" />
        
        {/* Animated Glow Effects */}
        <div className="absolute -left-4 -top-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute -right-4 -top-4 w-72 h-72 bg-sky-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />

        <div className="relative p-8">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="mb-4 md:mb-0">
              <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-lg">
                Router Management
              </h1>
              <p className="text-blue-50 text-xl font-light">
                Configure and manage your MikroTik routers
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="add" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-white/80 backdrop-blur-sm p-2 rounded-2xl border border-black/30 shadow-lg">
          <TabsTrigger 
            value="add" 
            className="text-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white rounded-xl transition-all duration-300 hover:bg-blue-50"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Add Router
          </TabsTrigger>
          <TabsTrigger 
            value="routers" 
            className="text-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white rounded-xl transition-all duration-300 hover:bg-blue-50"
          >
            <Router className="w-5 h-5 mr-2" />
            Router List
          </TabsTrigger>
          <TabsTrigger 
            value="admins" 
            className="text-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white rounded-xl transition-all duration-300 hover:bg-blue-50"
          >
            <UserCircle2 className="w-5 h-5 mr-2" />
            Admins
          </TabsTrigger>
        </TabsList>

        <TabsContent value="add" className="mt-0">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Router Information Card */}
            <Card 
              className={`backdrop-blur-sm bg-white/90 border border-black/30 shadow-2xl transition-all duration-300 rounded-2xl`}
              // onMouseEnter={() => setIsHovered('router')}
              // onMouseLeave={() => setIsHovered(null)}
            >
              <CardHeader className="border-b border-blue-100/50 space-y-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <Router className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Router</CardTitle>
                    <CardDescription>Configure your MikroTik router connection</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-blue-500" />
                    <Label htmlFor="routerName" className="text-sm font-medium">Session Name</Label>
                  </div>
                  <Input
                    id="routerName"
                    placeholder="Enter router name"
                    className={`bg-white/50 backdrop-blur-sm border-gray-500 focus:border-blue-500 focus:ring-blue-500 transition-all rounded-sm ${
                      errors.name && touched.name ? 'border-red-500' : ''
                    }`}
                    value={name}
                    onChange={handleNameChange}
                    onBlur={() => handleBlur('name')}
                  />
                  {errors.name && touched.name && (
                    <span className="text-red-500 text-sm mt-1">{errors.name}</span>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Network className="h-5 w-5 text-blue-500" />
                    <Label htmlFor="ipAddress" className="text-sm font-medium">MikroTik IP</Label>
                  </div>
                  <Input
                    id="ipAddress"
                    placeholder="Enter IP address"
                    className={`bg-white/50 backdrop-blur-sm border-gray-500 focus:border-blue-500 focus:ring-blue-500 transition-all rounded-sm ${
                      errors.host && touched.host ? 'border-red-500' : ''
                    }`}
                    value={host}
                    onChange={handleHostChange}
                    onBlur={() => handleBlur('host')}
                  />
                  {errors.host && touched.host && (
                    <span className="text-red-500 text-sm mt-1">{errors.host}</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Lock className="h-5 w-5 text-blue-500" />
                      <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                    </div>
                    <Input
                      id="username"
                      placeholder="Enter username"
                      className={`bg-white/50 backdrop-blur-sm border-gray-500 focus:border-blue-500 focus:ring-blue-500 transition-all rounded-sm ${
                        errors.user && touched.user ? 'border-red-500' : ''
                      }`}
                      value={user}
                      onChange={handleUserChange}
                      onBlur={() => handleBlur('user')}
                    />
                    {errors.user && touched.user && (
                      <span className="text-red-500 text-sm mt-1">{errors.user}</span>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Lock className="h-5 w-5 text-blue-500" />
                      <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      className={`bg-white/50 backdrop-blur-sm border-gray-500 focus:border-blue-500 focus:ring-blue-500 transition-all rounded-sm ${
                        errors.password && touched.password ? 'border-red-500' : ''
                      }`}
                      value={password}
                      onChange={handlePasswordChange}
                      onBlur={() => handleBlur('password')}
                    />
                    {errors.password && touched.password && (
                      <span className="text-red-500 text-sm mt-1">{errors.password}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hotspot Information Card */}
            <Card 
              className={`backdrop-blur-sm bg-white/90 border border-black/30 shadow-2xl transition-all duration-300 rounded-2xl`}
              // onMouseEnter={() => setIsHovered('hotspot')}
              // onMouseLeave={() => setIsHovered(null)}
            >
              <CardHeader className="border-b border-blue-100/50 space-y-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <Wifi className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Hotspot Info</CardTitle>
                    <CardDescription>Configure your hotspot settings</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-5 w-5 text-blue-500" />
                      <Label htmlFor="hotspotName" className="text-sm font-medium">Hotspot Name</Label>
                    </div>
                    <Input
                      id="hotspotName"
                      placeholder="Enter hotspot name"
                      className={`bg-white/50 backdrop-blur-sm border-gray-500 focus:border-blue-500 focus:ring-blue-500 transition-all rounded-sm ${
                        errors.hotspotName && touched.hotspotName ? 'border-red-500' : ''
                      }`}
                      value={hotspotName}
                      onChange={handleHotspotNameChange}
                      onBlur={() => handleBlur('hotspotName')}
                    />
                    {errors.hotspotName && touched.hotspotName && (
                      <span className="text-red-500 text-sm mt-1">{errors.hotspotName}</span>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-5 w-5 text-blue-500" />
                      <Label htmlFor="DnsName" className="text-sm font-medium">DNS Name</Label>
                    </div>
                    <Input
                      id="DnsName"
                      placeholder="Enter DNS name"
                      className={`bg-white/50 backdrop-blur-sm border-gray-500 focus:border-blue-500 focus:ring-blue-500 transition-all rounded-sm ${
                        errors.dnsName && touched.dnsName ? 'border-red-500' : ''
                      }`}
                      value={dnsName}
                      onChange={handleDnsNameChange}
                      onBlur={() => handleBlur('dnsName')}
                    />
                    {errors.dnsName && touched.dnsName && (
                      <span className="text-red-500 text-sm mt-1">{errors.dnsName}</span>
                    )}
                  </div>
                </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Network className="h-5 w-5 text-blue-500" />
                      <Label htmlFor="Currency" className="text-sm font-medium">Currency</Label>
                    </div>
                    <Input
                      id="Currency"
                      placeholder="Enter hotspot profile"
                      className={`bg-white/50 backdrop-blur-sm border-gray-500 focus:border-blue-500 focus:ring-blue-500 transition-all rounded-sm ${
                        errors.currency && touched.currency ? 'border-red-500' : ''
                      }`}
                      value={currency}
                      onChange={handleCurrencyChange}
                      onBlur={() => handleBlur('currency')}
                    />
                    {errors.currency && touched.currency && (
                      <span className="text-red-500 text-sm mt-1">{errors.currency}</span>
                    )}
                  </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Network className="h-5 w-5 text-blue-500" />
                      <Label htmlFor="sessionTimeout" className="text-sm font-medium">Session Timeout</Label>
                    </div>
                    <select 
                      name="sessionTimeout" 
                      id="sessionTimeout" 
                      className={`bg-white/50 backdrop-blur-sm border-gray-500 focus:border-blue-500 focus:ring-blue-500 transition-all rounded-sm outline outline-gray-500 p-2 w-full ${
                        errors.sessionTimeout && touched.sessionTimeout ? 'border-red-500' : ''
                      }`}
                      value={sessionTimeout}
                      onChange={(e) => handleSessionTimeoutChange(e as unknown as React.ChangeEvent<HTMLInputElement>)}
                      onBlur={() => handleBlur('sessionTimeout')}
                    >
                      <option value="">Select timeout</option>
                      <option value="5">5 minutes</option>
                      <option value="10">10 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">60 minutes</option>
                      <option value="Disable">Disable</option>
                    </select>
                    {errors.sessionTimeout && touched.sessionTimeout && (
                      <span className="text-red-500 text-sm mt-1">{errors.sessionTimeout}</span>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      {/* <Network className="h-5 w-5 text-blue-500" /> */}
                      <Label htmlFor="liveReport" className="text-sm font-medium">Live Report</Label>
                    </div>
                    <select id="liveReport" className="bg-white/50 backdrop-blur-sm border-gray-500 focus:border-blue-500 focus:ring-blue-500 transition-all rounded-sm outline outline-gray-500 p-2 w-full"
                      value={liveReport ? 'enabled' : 'disabled'} 
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        handleLiveReportChange(e as unknown as React.ChangeEvent<HTMLInputElement>);
                      }}
                    >
                      <option value="enabled">Enabled</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-8">
            <Button 
              variant="outline" 
              className="px-6 rounded-xl border-2 hover:bg-red-50 hover:border-red-500 hover:text-red-600 transition-all duration-300"
              onClick={() => setActiveTab("routers")}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              variant="outline"
              className="px-6 rounded-xl border-2 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600 transition-all duration-300"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Configuration
            </Button>
            <Button
              onClick={() => connectRouter({ name, host, user, password, hotspotName, dnsName, currency, sessionTimeout, liveReport })}
              className="px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={connectRouterMutation.isPending}
            >
              {connectRouterMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </>
              ) : (
                <>
                  <Plug className="mr-2 h-5 w-5" />
                  Connect to Router
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="routers" className="mt-0">
          <Card className="backdrop-blur-sm bg-white/90 border border-black/30 shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-blue-100/50 space-y-1">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Router List</CardTitle>
                  <CardDescription>Manage your configured routers</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full border-2 border-gray-400">
                  <thead>
                    <tr className="border-b-2 border-gray-400 bg-gray-50">
                      <th className="text-left py-4 px-4 text-sm font-medium text-gray-600 border-r border-gray-400 w-16">No</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-gray-600 border-r border-gray-400">Name</th>
                      <th className="text-center py-4 px-4 text-sm font-medium text-gray-600 w-40">Actions</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-gray-600 border-l border-gray-400">Hotspot Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(routers || []).map((router: RouterData) => (
                      <tr key={router.id} className="border-b border-gray-400 hover:bg-blue-50/50 transition-colors">
                        <td className="py-4 px-4 text-center border-r border-gray-400 font-medium">{router.id}</td>
                        <td className="py-4 px-4 border-r border-gray-400">
                          <div className="flex items-center space-x-2">
                            <Router className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">{router.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end space-x-3">
                            <DeleteAlertDialog routerId={router.id} DeleteRouter={DeleteRouter} />
                            <EditAlertDialog EditedInfoByID={router} EditRouter={EditRouter}/>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="hover:bg-blue-50 hover:text-blue-600 text-blue-600 h-8 w-8 p-0"
                              title="Connect"
                              onClick={() => connectRouterMutation.mutate({ 
                                name: router.name, 
                                host: router.host, 
                                user: router.username, // Changed from router.user to router.username to match PostgreSQL column name
                                password: router.password, 
                                hotspotName: router.hotspot_name, 
                                dnsName: router.dns_name, 
                                currency: router.currency, 
                                sessionTimeout: router.session_timeout, 
                                liveReport: router.live_report 
                              })}
                              disabled={connectRouterMutation.isPending}
                            >
                              {connectRouterMutation.isPending ? (
                                <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <Plug className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600 border-l border-gray-400 flex items-center space-x-2">
                          <Wifi className="h-4 w-4" /> 
                          <span className="font-medium">{router.hotspot_name}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins" className="mt-0">
          <Card className="backdrop-blur-sm bg-white/90 border border-black/30 shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-blue-100/50 space-y-1">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <UserCircle2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Active Admins</CardTitle>
                  <CardDescription>Currently logged in administrators</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full border-2 border-gray-400">
                  <thead>
                    <tr className="border-b-2 border-gray-400 bg-gray-50">
                      <th className="text-left py-4 px-4 text-sm font-medium text-gray-600 border-r border-gray-400 w-16">No</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-gray-600 border-r border-gray-400">Name</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-gray-600">Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockAdmins.map((admin, index) => (
                      <tr key={admin.id} className="border-b border-gray-400 hover:bg-blue-50/50 transition-colors">
                        <td className="py-4 px-4 text-center border-r border-gray-400 font-medium">{index + 1}</td>
                        <td className="py-4 px-4 border-r border-gray-400">
                          <div className="flex items-center space-x-2">
                            <UserCircle2 className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">{admin.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600">{admin.lastActive}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 


function DeleteAlertDialog({ routerId, DeleteRouter }: { routerId: number, DeleteRouter: (id: number) => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline"
          className="hover:bg-red-50 hover:text-red-600 text-red-600 h-8 w-8 p-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction style={{ backgroundColor: 'red'}} className="bg-red-500 hover:bg-red-600 text-white" onClick={() => DeleteRouter(routerId)}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

type EditRouterProps = {
  id: number;
  name: string;
  user: string;
  password: string;
  host: string;
  hotspotName: string;
  dnsName: string;
  currency: string;
  sessionTimeout: string;
  liveReport: string;
}

function EditAlertDialog({ EditedInfoByID, EditRouter }: { EditedInfoByID: RouterData | undefined, EditRouter: (EditedInfo: EditRouterProps) => void }) {
  // const { name, host, user, password, hotspotName, dnsName, currency, sessionTimeout, liveReport } = EditedInfoByID;

  const [name, setName] = useState(EditedInfoByID?.name || '');
  const [host, setHost] = useState(EditedInfoByID?.host || '');
  const [user, setUser] = useState(EditedInfoByID?.username || '');
  const [password, setPassword] = useState(EditedInfoByID?.password || '');
  const [hotspotName, setHotspotName] = useState(EditedInfoByID?.hotspot_name || '');
  const [dnsName, setDnsName] = useState(EditedInfoByID?.dns_name || '');  
  const [currency, setCurrency] = useState(EditedInfoByID?.currency || '');
  const [sessionTimeout, setSessionTimeout] = useState(EditedInfoByID?.session_timeout || '');
  const [liveReport, setLiveReport] = useState(EditedInfoByID?.live_report || false);

  const handleSaveChanges = () => {
    EditRouter({
      id: EditedInfoByID?.id || 0,
      name,
      host,
      user,
      password,
      hotspotName,
      dnsName,
      currency,
      sessionTimeout,
      liveReport: liveReport ? 'enabled' : 'disabled'
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline"
          className="hover:bg-blue-50 hover:text-blue-600 text-blue-600 h-8 w-8 p-0"
        >
          <Edit className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-3xl w-[800px] p-8">
        <AlertDialogHeader className="mb-6">
          <AlertDialogTitle className="text-2xl font-bold">Edit Router</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Router Name</Label>
              <Input id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter router name" 
                className="w-full bg-white/50 backdrop-blur-sm border-gray-500 focus:border-blue-500 focus:ring-blue-500 transition-all rounded-sm text-black" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="host" className="text-sm font-medium">Host IP</Label>
              <Input 
                id="host" 
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="Enter router host" 
                className="w-full bg-white/50 backdrop-blur-sm border-gray-500 focus:border-blue-500 focus:ring-blue-500 transition-all rounded-sm text-black" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user" className="text-sm font-medium">Username</Label>
              <Input id="user" 
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="Enter router user" 
                className="w-full bg-white/50 backdrop-blur-sm border-gray-500 focus:border-blue-500 focus:ring-blue-500 transition-all rounded-sm text-black" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter router password" 
                className="w-full bg-white/50 backdrop-blur-sm border-gray-500 focus:border-blue-500 focus:ring-blue-500 transition-all rounded-sm text-black" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hotspotName" className="text-sm font-medium">Hotspot Name</Label>
              <Input id="hotspotName" 
                value={hotspotName}
                onChange={(e) => setHotspotName(e.target.value)}
                placeholder="Enter hotspot name" 
                className="w-full bg-white/50 backdrop-blur-sm border-gray-500 focus:border-blue-500 focus:ring-blue-500 transition-all rounded-sm text-black" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="DnsName" className="text-sm font-medium">DNS Name</Label>
              <Input id="DnsName" 
                value={dnsName}
                onChange={(e) => setDnsName(e.target.value)}
                placeholder="Enter DNS name" 
                className="w-full bg-white/50 backdrop-blur-sm border-gray-500 focus:border-blue-500 focus:ring-blue-500 transition-all rounded-sm text-black" 
              /> 
            </div>
            <div className="space-y-2">
              <Label htmlFor="Currency" className="text-sm font-medium">Currency</Label>
              <Input id="Currency" 
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="Enter hotspot profile" 
                className="w-full bg-white/50 backdrop-blur-sm border-gray-500 focus:border-blue-500 focus:ring-blue-500 transition-all rounded-sm text-black" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout" className="text-sm font-medium">Session Timeout</Label>
              <select id="sessionTimeout" 
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="w-full bg-white/50 backdrop-blur-sm border-gray-500 focus:border-blue-500 focus:ring-blue-500 transition-all rounded-sm text-black p-2 outline outline-gray-500">
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">60 minutes</option>
                <option value="Disable">Disable</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="liveReport" className="text-sm font-medium">Live Report</Label>
                <select id="liveReport" 
                value={liveReport ? 'enabled' : 'disabled'} 
                onChange={(e) => setLiveReport(e.target.value === 'enabled')}
                className="w-full bg-white/50 backdrop-blur-sm border-gray-500 focus:border-blue-500 focus:ring-blue-500 transition-all rounded-sm p-2 text-black outline outline-gray-500">
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>
        </AlertDialogDescription>
        <AlertDialogFooter className="mt-8">
          <AlertDialogCancel className="mr-3">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSaveChanges} style={{ backgroundColor: 'blue'}} className="bg-blue-600 hover:bg-blue-700">Save Changes</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
