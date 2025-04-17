import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCcw, Trash2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AddUserModal } from "@/components/modals/AddUserModal";
import { AddProfileModal } from "@/components/modals/AddProfileModal"; 
import { VoucherGeneratorModal } from "@/components/modals/VoucherGeneratorModal";

export interface HotspotUser {
  Server: string;
  Name: string;
  Password: string;
  MacAddress: string;
  Profile: string;
  TimeLimit: string;
  DataLimit: string;
  Comment: string;
  LimitUpTime: string;
  LimitBytesTotal: string;
  Uptime: string;
  BytesIn: string;
  BytesOut: string;
}

interface HotspotUsersResponse {
  success: boolean;
  data: {
    total: number;
    users: HotspotUser[];
  };
}

export interface HotspotProfile {
  name: string;
  address_pool: string;
  shared_users: number;
  rate_limit: string;
  parent_queue: string;
  expire_mode: string;
  validity: string;
  price: number;
  selling_price: number;
  user_lock: "enabled" | "disabled";
  server_lock: "enabled" | "disabled";
}

interface ActiveUser {
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

interface ActiveUsersResponse {
  success: boolean;
  data: {
    users: ActiveUser[];
  };
}


export interface HotspotServer {
  name: string;
  interface: string;
  profile: string;
  addresses: string;
  disabled: boolean;
  invalidUsername: string;
  addressPool: string;
  ipOfDnsName: string;
  htmlDirectory: string;
  htmlSubdir: string;
  macFormat: string;
  macCookieTimeout: string;
  cookieLifetime: string;
}

type HotspotHost = {
  macAddress: string;
  address: string;
  toAddress: string;
  server: string;
  rxRate: string;
  txRate: string;
  keepaliveTimeout: string;
  bytesIn: string;
  bytesOut: string;
  comment: string;
}


export interface HotspotServersResponse {
  success: boolean;
  data: {
    total: number;
    servers: HotspotServer[];
  };
}



export interface HotspotProfilesResponse {
  success: boolean;
  data: {
    profiles: HotspotProfile[];
  };
};

export interface HotspotHostsResponse {
  success: boolean;
  message: string;
  data: {
    hosts: HotspotHost[];
  };
}

export function HotspotPage() {
  const [activeTab] = useState(() => {
    return localStorage.getItem("hotspotActiveTab") || "users";
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<string>("all");
  const [selectedComment] = useState<string>("all");
  const queryClient = useQueryClient();

  // Get router ID from localStorage
  const routerId = localStorage.getItem('routerConnectionId');

  // Fetch hotspot users
  const { data: hotspotUsers, isLoading: usersLoading, error: usersError } = useQuery<HotspotUsersResponse>({
    queryKey: ['hotspotUsers', routerId],
    queryFn: async () => {
      if (!routerId) throw new Error('No router connected');
      const response = await fetch(`http://localhost:3001/api/router/${routerId}/hotspot-users-structured`);
      if (!response.ok) {
        throw new Error('Failed to fetch hotspot users');
      }
      const data = await response.json();
      // Ensure each user has a Password field, even if empty
      data.data.users = data.data.users.map((user: HotspotUser) => ({
        ...user,
        Password: user.Password || ''
      }));
      return data;
    },
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Fetch hotspot profiles
  const { data: hotspotProfiles, isLoading: profilesLoading, error: profilesError, refetch: refetchProfiles } = useQuery<HotspotProfilesResponse>({
    queryKey: ['hotspotProfiles', routerId],
    queryFn: async () => {
      if (!routerId) throw new Error('No router connected');
      const response = await fetch(`http://localhost:3001/api/router/${routerId}/hotspot-profiles`);
      if (!response.ok) {
        throw new Error('Failed to fetch hotspot profiles');
      }
      return response.json();
    },
    gcTime: Infinity,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false
  });

  // Memoize profiles data
  const profiles = useMemo(() => hotspotProfiles?.data.profiles || [], [hotspotProfiles?.data.profiles]);
  const allProfiles = useMemo(() => profiles.map(profile => profile.name), [profiles]);
  
  // Filter profiles - memoized
  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile: HotspotProfile) => {
      return searchQuery === "" || 
        profile.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [profiles, searchQuery]);

  // Fetch hotspot servers
  const { data: hotspotServers, isLoading: serversLoading} = useQuery<HotspotServersResponse>({
    queryKey: ['hotspotServers', routerId],
    queryFn: async () => {
      if (!routerId) throw new Error('No router connected');
      const response = await fetch(`http://localhost:3001/api/router/${routerId}/hotspot-servers`);
      if (!response.ok) {
        throw new Error('Failed to fetch hotspot servers');
      }
      return response.json();
    },
    refetchInterval: 5000 // Refresh every 5 seconds
  });


  // Fetch hotspot profiles
  const { data: hotspotHosts, isLoading: hostsLoading, error: hostsError, refetch: refetchHosts } = useQuery<HotspotHostsResponse>({
    queryKey: ['hotspotHosts', routerId],
    queryFn: async () => {
      if (!routerId) throw new Error('No router connected');
      const response = await fetch(`http://localhost:3001/api/router/${routerId}/hotspot-hosts`);
      if (!response.ok) {
        throw new Error('Failed to fetch hotspot hosts');
      }
      return response.json();
    },
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  console.log(hotspotHosts);

  // const allComments = hotspotUsers?.data.users.map(user => user.Comment) || [];
  const allServers = hotspotServers?.data.servers.map(server => server.name);

  // Filter users based on search query, profile, and comment
  const filteredUsers = hotspotUsers?.data.users.filter(user => {
    const matchesSearch = searchQuery === "" || 
    user.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.Profile.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.Comment.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProfile = selectedProfile === "all" || user.Profile === selectedProfile;
    const matchesComment = selectedComment === "all" || user.Comment === selectedComment;

    return matchesSearch && matchesProfile && matchesComment;
  }) || [];


  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("hotspotActiveTab", activeTab);
  }, [activeTab]);

  // Add delete profile mutation
  const deleteProfile = useMutation({
    mutationFn: async (profileName: string) => {
      if (!routerId) throw new Error('No router connected');
      const response = await fetch(`http://localhost:3001/api/router/${routerId}/hotspot-profiles/${profileName}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete profile');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast.success('Profile deleted successfully');
      refetchProfiles(); // Explicitly refetch profiles after deletion
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete profile: ${error.message}`);
    },
  });

  // Add delete user mutation
  const deleteUser = useMutation({
    mutationFn: async (username: string) => {
      if (!routerId) throw new Error('No router connected');
      const response = await fetch(`http://localhost:3001/api/router/${routerId}/hotspot-users/${username}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete user');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotspotUsers'] });
    }
  });

  // Add new state for active users search
  const [activeUsersSearchQuery, setActiveUsersSearchQuery] = useState("");

  // Add query for active users
  const { data: activeUsers, isLoading: activeUsersLoading, error: activeUsersError, refetch: refetchActiveUsers } = useQuery<ActiveUsersResponse, Error>({
    queryKey: ['activeUsers', routerId],
    queryFn: async () => {
      if (!routerId) throw new Error('No router connected');
      const response = await fetch(`http://localhost:3001/api/router/${routerId}/active-users`);
      if (!response.ok) {
        throw new Error('Failed to fetch active users');
      }
      return response.json();
    },
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Add filtered active users
  const filteredActiveUsers = useMemo(() => {
    if (!activeUsers?.data.users) return [];
    return activeUsers.data.users.filter(user => {
      return activeUsersSearchQuery === "" || 
        user.user.toLowerCase().includes(activeUsersSearchQuery.toLowerCase()) ||
        user.address.toLowerCase().includes(activeUsersSearchQuery.toLowerCase()) ||
        user.macAddress.toLowerCase().includes(activeUsersSearchQuery.toLowerCase()) ||
        user.comment.toLowerCase().includes(activeUsersSearchQuery.toLowerCase());
    });
  }, [activeUsers?.data.users, activeUsersSearchQuery]);

  const filteredHosts = useMemo(() => {
    if (!hotspotHosts?.data.hosts) return [];
    return hotspotHosts.data.hosts.filter(host => {
      return searchQuery === "" || 
        host.macAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        host.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        host.toAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        host.server.toLowerCase().includes(searchQuery.toLowerCase()) ||
        host.rxRate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        host.txRate.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [hotspotHosts?.data.hosts, searchQuery]);

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
        <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-purple-100/40 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] right-[25%] w-[300px] h-[300px] bg-indigo-100/40 rounded-full blur-[100px]" />
        </div>

      {/* Main Content */}
      <div className="relative z-10 p-6 max-w-[1600px] mx-auto">
        {/* Header section */}
        <div className="glass-effect flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-white/70 backdrop-blur-lg p-5 rounded-xl border border-gray-200/100 shadow-sm">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Hotspot Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage users, profiles, and vouchers</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <Badge variant="outline" className="text-sm bg-purple-50/70 text-purple-700 border-purple-200/50 px-3 py-1">
              <div className="h-2 w-2 rounded-full bg-purple-500 mr-2"></div>
              {hotspotUsers?.data.total || 0} Users
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="glass-effect bg-white/70 border border-gray-200/50 p-1 rounded-lg mb-6">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="profiles">Profiles</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="hosts">Host</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
            <div className="glass-effect bg-white/70 rounded-xl border border-gray-200/50 shadow-sm p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      className="pl-8 bg-white/50 border-gray-200/50 focus:border-purple-500/50 transition-colors"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                    <SelectTrigger className="w-[180px] bg-white/50 border-gray-200/50">
                      <SelectValue placeholder="Filter by profile" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Profiles</SelectItem>
                      {allProfiles?.map((profile) => (
                        <SelectItem key={profile} value={profile}>
                          {profile}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <AddUserModal
                  allServers={allServers ?? []}
                  allProfiles={allProfiles ?? []}
                  profilesLoading={profilesLoading}
                  serversLoading={serversLoading}
                />
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200/50 bg-white">
                <table className="min-w-full divide-y divide-gray-200/50">
                  <thead className="bg-gradient-to-r from-purple-50/50 to-white sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Server</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Profile</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">MAC Address</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Uptime</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Bytes In</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Bytes Out</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Comment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usersLoading ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-center">Loading users...</td>
                      </tr>
                    ) : usersError ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-center text-red-600">Error loading users</td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-gray-500 bg-white/50">No users found</td>
                      </tr>
                    ) : (
                      filteredUsers.map((user, index) => (
                        <tr key={index} className="border-b hover:bg-purple-50/30 transition-colors">
                          <td className="px-6 py-4">{user.Server}</td>
                          <td className="px-6 py-4">{user.Name}</td>
                          <td className="px-6 py-4">{user.Profile}</td>
                          <td className="px-6 py-4">{user.MacAddress || '-'}</td>
                          <td className="px-6 py-4">{user.Uptime}</td>
                          <td className="px-6 py-4">{user.BytesIn}</td>
                          <td className="px-6 py-4">{user.BytesOut}</td>
                          <td className="px-6 py-4">{user.Comment}</td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <AddUserModal 
                                allServers={allServers ?? []}
                                allProfiles={allProfiles ?? []}
                                profilesLoading={profilesLoading}
                                serversLoading={serversLoading}
                                isEditing={true}
                                userToEdit={user}
                              />
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Delete User</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to delete the user "{user.Name}"? This action cannot be undone.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="flex justify-end space-x-2 mt-4">
                                    <DialogClose asChild>
                                      <Button variant="outline">Cancel</Button>
                                    </DialogClose>
                                    <Button
                                      style={{ backgroundColor: 'red', color: 'white' }}
                                      variant="destructive"
                                      onClick={async () => {
                                        try {
                                          await deleteUser.mutateAsync(user.Name);
                                          toast.success('User deleted successfully');
                                        } catch (error) {
                                          toast.error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                        }
                                      }}
                                      disabled={deleteUser.isPending}
                                    >
                                      {deleteUser.isPending ? (
                                        <>
                                          <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                                          Deleting...
                                        </>
                                      ) : (
                                        'Delete'
                                      )}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
        </TabsContent>

        {/* Profiles Tab */}
        <TabsContent value="profiles">
          <Card className="backdrop-blur-sm bg-white/90 border border-black/30 shadow-2xl transition-all duration-300 rounded-2xl">
            <CardHeader className="border-b border-blue-100/50">
              <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Search profiles..."
                      className="w-64 border border-black/30"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                <Button variant="outline">
                      <Search className="w-4 h-4" />
                </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <AddProfileModal />
                    <VoucherGeneratorModal />
                    <Button variant="outline" onClick={() => refetchProfiles()}>
                      <RefreshCcw className={cn("w-4 h-4 mr-2", profilesLoading && "animate-spin")} />
                      {profilesLoading ? "Refreshing..." : "Refresh"}
                  </Button>
                  </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto mt-6">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-gray-100">
                    <tr>
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Shared Users</th>
                      <th className="px-6 py-3">Rate Limit</th>
                        <th className="px-6 py-3">Expire Mode</th>
                      <th className="px-6 py-3">Validity</th>
                      <th className="px-6 py-3">Price</th>
                      <th className="px-6 py-3">Selling Price</th>
                      <th className="px-6 py-3">User Lock</th>
                      <th className="px-6 py-3">Server Lock</th>
                        <th className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                      {profilesLoading ? (
                        <tr>
                          <td colSpan={10} className="px-6 py-4 text-center">Loading profiles...</td>
                        </tr>
                      ) : profilesError ? (
                        <tr>
                          <td colSpan={10} className="px-6 py-4 text-center text-red-600">Error loading profiles</td>
                        </tr>
                      ) : filteredProfiles.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="px-6 py-4 text-center">No profiles found</td>
                        </tr>
                      ) : (
                        filteredProfiles.map((profile: HotspotProfile) => (
                          <tr key={profile.name} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4">{profile.name}</td>
                            <td className="px-6 py-4">{profile.shared_users}</td>
                            <td className="px-6 py-4">{profile.rate_limit}</td>
                            <td className="px-6 py-4">{profile.expire_mode}</td>
                            <td className="px-6 py-4">{profile.validity || '-'}</td>
                        <td className="px-6 py-4">{profile.price}</td>
                            <td className="px-6 py-4">{profile.selling_price}</td>
                            <td className="px-6 py-4">{profile.user_lock}</td>
                            <td className="px-6 py-4">{profile.server_lock}</td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <AddProfileModal isEditing={true} profileToEdit={profile} />
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Delete Profile</DialogTitle>
                                      <DialogDescription>
                                        Are you sure you want to delete the profile "{profile.name}"? This action cannot be undone.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="flex justify-end space-x-2 mt-4">
                                      <DialogClose asChild>
                                        <Button variant="outline">Cancel</Button>
                                      </DialogClose>
                                      <Button
                                        style={{ backgroundColor: 'red', color: 'white' }}
                                        variant="destructive"
                                        onClick={() => deleteProfile.mutate(profile.name)}
                                        disabled={deleteProfile.isPending}
                                      >
                                        {deleteProfile.isPending ? (
                                          <>
                                            <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                                            Deleting...
                                          </>
                                        ) : (
                                          'Delete'
                                        )}
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </td>
                      </tr>
                        ))
                      )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Tab */}
        <TabsContent value="active">
          <Card className="backdrop-blur-sm bg-white/90 border border-black/30 shadow-2xl transition-all duration-300 rounded-2xl">
            <CardHeader className="border-b border-blue-100/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Search active users..."
                      className="w-64 border border-black/30"
                      value={activeUsersSearchQuery}
                      onChange={(e) => setActiveUsersSearchQuery(e.target.value)}
                  />
                  <Button variant="outline">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setActiveUsersSearchQuery('');
                      refetchActiveUsers();
                    }}
                    disabled={activeUsersLoading}
                  >
                    <RefreshCcw className={cn("w-4 h-4 mr-2", {
                      "animate-spin": activeUsersLoading
                    })} />
                    {activeUsersLoading ? "Refreshing..." : "Refresh"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto mt-6">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-gray-100">
                    <tr>
                      <th className="px-6 py-3">Server</th>
                      <th className="px-6 py-3">User</th>
                      <th className="px-6 py-3">Address</th>
                      <th className="px-6 py-3">MAC Address</th>
                      <th className="px-6 py-3">Uptime</th>
                        <th className="px-6 py-3">Time Left</th>
                      <th className="px-6 py-3">Bytes In</th>
                      <th className="px-6 py-3">Bytes Out</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Idle Time</th>
                      <th className="px-6 py-3">Comment</th>
                    </tr>
                  </thead>
                  <tbody>
                      {activeUsersLoading ? (
                        <tr>
                          <td colSpan={12} className="px-6 py-4 text-center">Loading active users...</td>
                        </tr>
                      ) : activeUsersError ? (
                        <tr>
                          <td colSpan={12} className="px-6 py-4 text-center text-red-600">Error loading active users</td>
                        </tr>
                      ) : filteredActiveUsers.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="px-6 py-4 text-center">No active users found</td>
                        </tr>
                      ) : (
                        filteredActiveUsers.map((user, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4">{user.server}</td>
                        <td className="px-6 py-4">{user.user}</td>
                        <td className="px-6 py-4">{user.address}</td>
                        <td className="px-6 py-4">{user.macAddress}</td>
                        <td className="px-6 py-4">{user.uptime}</td>
                            <td className="px-6 py-4">{user.timeLeft}</td>
                        <td className="px-6 py-4">{user.bytesIn}</td>
                        <td className="px-6 py-4">{user.bytesOut}</td>
                            <td className="px-6 py-4">{user.status}</td>
                            <td className="px-6 py-4">{user.idleTime}</td>
                        <td className="px-6 py-4">{user.comment}</td>
                      </tr>
                        ))
                      )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Host Tab */}
        <TabsContent value="hosts">
          <Card className="backdrop-blur-sm bg-white/90 border border-black/30 shadow-2xl transition-all duration-300 rounded-2xl">
            <CardHeader className="border-b border-blue-100/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Search hosts..."
                      className="w-64 border border-black/30"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button variant="outline">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery('');
                      refetchHosts();
                    }}
                    disabled={hostsLoading}
                  >
                    <RefreshCcw className={cn("w-4 h-4 mr-2", {
                      "animate-spin": hostsLoading
                    })} />
                    {hostsLoading ? "Refreshing..." : "Refresh"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto mt-6">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-gray-100">
                    <tr>
                      <th className="px-6 py-3">MAC Address</th>
                      <th className="px-6 py-3">Address</th>
                      <th className="px-6 py-3">To Address</th>
                      <th className="px-6 py-3">Server</th>
                      <th className="px-6 py-3">RX Rate</th>
                      <th className="px-6 py-3">TX Rate</th>
                      <th className="px-6 py-3">Keepalive Timeout</th>
                      <th className="px-6 py-3">Bytes In</th>
                      <th className="px-6 py-3">Bytes Out</th>
                      <th className="px-6 py-3">Comment</th>
                    </tr>
                  </thead>
                  <tbody>
                      {hostsLoading ? (
                        <tr>
                          <td colSpan={12} className="px-6 py-4 text-center">Loading hosts...</td>
                        </tr>
                      ) : hostsError ? (
                        <tr>
                          <td colSpan={12} className="px-6 py-4 text-center text-red-600">Error loading hosts</td>
                        </tr>
                      ) : filteredHosts.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="px-6 py-4 text-center">No hosts found</td>
                        </tr>
                      ) : (
                        filteredHosts.map((host: HotspotHost, index: number) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4">{host.macAddress}</td>
                        <td className="px-6 py-4">{host.address}</td>
                        <td className="px-6 py-4">{host.toAddress}</td>
                        <td className="px-6 py-4">{host.server}</td>
                        <td className="px-6 py-4">{host.rxRate}</td>
                            <td className="px-6 py-4">{host.txRate}</td>
                        <td className="px-6 py-4">{host.keepaliveTimeout}</td>
                        <td className="px-6 py-4">{host.bytesIn}</td>
                        <td className="px-6 py-4">{host.bytesOut}</td>
                        <td className="px-6 py-4">{host.comment}</td>
                      </tr>
                        ))
                      )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
} 






