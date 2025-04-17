import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { RouterSessionPage } from './pages/RouterSessionPage';
import { DashboardPage } from './pages/DashboardPage';
import { HotspotPage } from './pages/HotspotPage';
import './App.css';
import { 
  Router as RouterIcon, 
  LayoutDashboard, 
  Bell, 
  Menu, 
  Lock, 
  Wifi, 
  FileText, 
  Wallet, 
  Settings,
  ChevronRight,
  LogOut,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import './styles/animations.css';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./components/ui/tooltip";
import { Badge } from "./components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import LogsPage from './pages/LogsPage';
import ReportPage from './pages/ReportPage';

// Mock data for router info - replace with actual API calls in production
const routerInfo = {
  name: "PrimeNova",
  status: "Connected",
  country: "Liberia",
  city: "Monrovia",
  ipAddress: "192.168.1.1"
};

function AppContent() {
  const [scrolled, setScrolled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const location = useLocation();
  const isRouterSettingsPage = location.pathname === '/';
  const [notifications] = useState([
    { id: 1, title: "New login detected", description: "Admin user logged in from 192.168.1.105", time: "2 min ago", read: false },
    { id: 2, title: "Bandwidth limit reached", description: "User JohnDoe exceeded bandwidth limit", time: "15 min ago", read: false },
    { id: 3, title: "System update available", description: "RouterOS 7.9 is now available", time: "1 hour ago", read: true }
  ])

  const [currentLocation, setCurrentLocation] = useState({
    city: '',
    country: ''
  });


  useEffect(() => {
    fetch('https://ipinfo.io/json?95cee68826216a')
    .then(response => response.json())
    .then(data => {
    const city = data.city;
    const country = data.country;
    setCurrentLocation({ city, country });
    })
    .catch(error => console.error('Error fetching location:', error));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const getNavLinkClass = (isActive: boolean) => {
    return cn(
      "flex items-center w-full rounded-lg px-3 py-2 transition-all duration-200",
      {
        "bg-blue-50 text-blue-600 font-medium": isActive,
        "text-gray-700 hover:bg-blue-50/50 hover:text-blue-600": !isActive
      }
    );
  };

  const renderNavLink = (to: string, icon: React.ReactNode, text: string) => {
    const isDisabled = isRouterSettingsPage && to !== '/';
    const isActive = location.pathname === to;
    
    if (isDisabled) {
      return (
        <div className="px-3 py-2 opacity-50 cursor-not-allowed text-gray-500 flex items-center rounded-lg">
          {icon}
          {(sidebarOpen) && (
            <div className="flex items-center justify-between w-full ml-3">
              <span>{text}</span>
              <Lock className="h-4 w-4" />
            </div>
          )}
        </div>
      );
    }
    
    return (
      <Link to={to} className={getNavLinkClass(isActive)}>
        <div className={cn("flex items-center", { 
          "justify-center": !sidebarOpen 
        })}>
          {icon}
          {(sidebarOpen) && (
            <span className="ml-3">{text}</span>
          )}
        </div>
        {isActive && (sidebarOpen) && (
          <div className="ml-auto">
            <ChevronRight className="h-4 w-4" />
          </div>
        )}
      </Link>
    );
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ backgroundColor: '#e0c3fc', backgroundImage: 'linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)' }}>
      {/* Subtle background pattern */}
      <div className="fixed inset-0 z-0 opacity-25">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-50"></div>
        <div className="absolute inset-0" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234299e1' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      <div className="relative z-10 flex h-screen">
        {/* Sidebar */}
        <aside 
          className={cn(
            "h-full bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ease-in-out flex flex-col glass-effect z-10",
            {
              "w-64": sidebarOpen,
              "w-20": !sidebarOpen
            }
          )}
        >
          {/* Logo Section */}
          <div className="h-16 flex items-center px-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-xl shadow-sm">
                <RouterIcon className="h-6 w-6 text-white" />
              </div>
              {(sidebarOpen) && (
                <Link to="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent transition-all">
                  NovaTech Connect
                </Link>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
            <div className="mb-2 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
              {(sidebarOpen) && "Main"}
            </div>
            {isRouterSettingsPage ? (
              renderNavLink('/', <RouterIcon className="h-5 w-5" />, 'Router Settings')
            ) : (
              <>
                {renderNavLink('/', <RouterIcon className="h-5 w-5" />, 'Router Settings')}
                {renderNavLink('/dashboard', <LayoutDashboard className="h-5 w-5" />, 'Dashboard')}
                {renderNavLink('/hotspot', <Wifi className="h-5 w-5" />, 'Hotspot')}
                {renderNavLink('/logs', <FileText className="h-5 w-5" />, 'Logs')}
                {renderNavLink('/report', <Wallet className="h-5 w-5" />, 'Report')}
              </>
            )}
            
            {!isRouterSettingsPage && (sidebarOpen) && (
              <>
                <div className="mt-6 mb-2 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Settings
                </div>
                {renderNavLink('/settings', <Settings className="h-5 w-5" />, 'System Settings')}
              </>
            )}
          </nav>
          
          {/* Router Info Panel (only when connected) */}
          {!isRouterSettingsPage && (
            <div className={cn(
              "p-4 border-t border-gray-100 bg-blue-50/40 transition-all duration-300",
              { "hidden": !sidebarOpen }
            )}>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <RouterIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {routerInfo.name}
                  </p>
                  <div className="flex items-center">
                    <span className="flex-shrink-0 h-2 w-2 rounded-full bg-green-500 mr-1.5"></span>
                    <p className="text-xs text-gray-500 truncate">
                      {routerInfo.ipAddress}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className={cn(
            "glass-effect bg-white border-b border-gray-200 transition-all duration-200 z-10 h-16 flex items-center",
            { "shadow-sm": scrolled }
          )}>
            <div className="px-4 flex-1 flex justify-between items-center">
              {/* Left Section */}
              <div className="flex items-center space-x-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                      >
                        <Menu className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>{sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                {!isRouterSettingsPage && (
                  <div className="hidden md:flex items-center space-x-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
                    </Badge>
                  </div>
                )}
              </div>

              {/* Right Section */}
              <div className="flex items-center space-x-4">
                {/* Location and Time */}
                {!isRouterSettingsPage && (
                  <div className="hidden lg:flex items-center text-sm text-gray-500 space-x-4">
                    <div className="flex items-center px-3 py-1 bg-gray-50 rounded-md">
                      <span>{currentLocation.country}, {currentLocation.city}</span>
                    </div>
                    <div className="flex items-center px-3 py-1 bg-gray-50 rounded-md">
                      <span>{formatTime(currentTime)}</span>
                    </div>
                    <div className="flex items-center px-3 py-1 bg-gray-50 rounded-md">
                      <span>{formatDate(currentTime)}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-4">
                  {/* Notifications dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-blue-50">
                        <Bell className="h-5 w-5 text-gray-500" />
                        {unreadNotifications > 0 && (
                          <span className="absolute top-0 right-0 h-4 w-4 bg-blue-600 rounded-full text-xs flex items-center justify-center text-white font-medium">
                            {unreadNotifications}
                          </span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                      <DropdownMenuLabel className="flex items-center justify-between">
                        <span>Notifications</span>
                        <Button variant="ghost" size="sm" className="h-8 text-xs hover:bg-blue-50">
                          Mark all as read
                        </Button>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <DropdownMenuItem key={notification.id} className={cn(
                            "flex flex-col items-start p-3 cursor-pointer",
                            !notification.read && "bg-blue-50/50"
                          )}>
                            <div className="flex items-start w-full">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{notification.title}</p>
                                <p className="text-xs text-gray-500 mt-1">{notification.description}</p>
                              </div>
                              <span className="text-xs text-gray-400">{notification.time}</span>
                            </div>
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <div className="py-4 text-center text-gray-500 text-sm">
                          No notifications
                        </div>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="justify-center text-sm text-blue-600 cursor-pointer">
                        View all notifications
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* User profile dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Avatar className='ring-2 ring-blue-500'>  
                        <AvatarImage src="https://media.licdn.com/dms/image/v2/C4E03AQFm0BvijwWbfA/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1553289402097?e=2147483647&v=beta&t=TVnvq9kC89kqTQOTigN305cqTkO3iMHqN1OgJNEOwp4" />
                        <AvatarFallback>CN</AvatarFallback>
                      </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto relative">
            <div className="max-w-full">
              <Routes>
                <Route path="/" element={<RouterSessionPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/hotspot" element={<HotspotPage />} />
                <Route path="/logs" element={<LogsPage />} />
                <Route path="/report" element={<ReportPage />} />
                {/* Add more routes as needed */}
              </Routes>
            </div>
          </main>

          {/* Footer */}
          <footer className="glass-effect bg-white border-t border-gray-200 py-4">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className="bg-blue-600 p-1.5 rounded-lg">
                    <RouterIcon className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-sm text-gray-500">
                    © {new Date().getFullYear()} MikroTik Connect. All rights reserved.
                  </p>
                </div>
                <div className="flex space-x-8 mt-4 md:mt-0">
                  <a href="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">Privacy Policy</a>
                  <a href="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">Terms of Service</a>
                  <a href="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">Contact</a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;