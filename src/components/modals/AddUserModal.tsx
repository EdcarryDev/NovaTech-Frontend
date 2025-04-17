import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, UserPlus, RefreshCcw, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HotspotUser } from "@/pages/HotspotPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


interface AddUserModalProps {
    allServers: string[];
    allProfiles: string[];
    profilesLoading: boolean;
    serversLoading: boolean;
    isEditing?: boolean;
    userToEdit?: HotspotUser | null;
  }
  
  export const AddUserModal = ({ 
    allServers, 
    allProfiles, 
    profilesLoading, 
    serversLoading,
    isEditing = false,
    userToEdit = null 
  }: AddUserModalProps) => {
    const [open, setOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const queryClient = useQueryClient();
    const routerId = localStorage.getItem('routerConnectionId');
    
    const [formData, setFormData] = useState({
      server: 'all',
      name: '',
      password: '',
      macAddress: '',
      profile: 'default',
      timeLimit: '',
      dataLimit: '',
      comment: '',
    });
  
    // Set initial form data when editing
    useEffect(() => {
      if (isEditing && userToEdit) {
        setFormData({
          server: userToEdit.Server || 'all',
          name: userToEdit.Name || '',
          password: userToEdit.Password || '',
          macAddress: userToEdit.MacAddress || '',
          profile: userToEdit.Profile || 'default',
          timeLimit: userToEdit.TimeLimit || '',
          dataLimit: userToEdit.DataLimit || '',
          comment: userToEdit.Comment || '',
        });
      }
    }, [isEditing, userToEdit]);
  
    // Edit user mutation
    const editUser = useMutation({
      mutationFn: async (data: typeof formData) => {
        if (!routerId || !userToEdit) throw new Error('No router connected or no user to edit');
        const response = await fetch(`http://localhost:3001/api/router/${routerId}/hotspot-users/${userToEdit.Name}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            server: data.server,
            password: data.password || undefined,
            macAddress: data.macAddress,
            profile: data.profile,
            timeLimit: data.timeLimit,
            dataLimit: data.dataLimit,
            comment: data.comment,
          }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to update user');
        }
        
        return response.json();
      },
      onSuccess: () => {
        setOpen(false);
        toast.success('User updated successfully');
        queryClient.invalidateQueries({ queryKey: ['hotspotUsers'] });
      },
      onError: (error: Error) => {
        toast.error(`Failed to update user: ${error.message}`);
      },
    });
  
    // Create user mutation
    const createUser = useMutation({
      mutationFn: async (data: typeof formData) => {
        if (!routerId) throw new Error('No router connected');
        const response = await fetch(`http://localhost:3001/api/router/${routerId}/hotspot-users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create user');
        }
        
        return response.json();
      },
      onSuccess: () => {
        // Reset form
        setFormData({
          server: 'all',
          name: '',
          password: '',
          macAddress: '',
          profile: 'default',
          timeLimit: '',
          dataLimit: '',
          comment: ''
        });
        
        // Close modal
        setOpen(false);
        
        // Show success message
        toast.success('User created successfully');
        
        // Refresh users list
        queryClient.invalidateQueries({ queryKey: ['hotspotUsers'] });
      },
      onError: (error: Error) => {
        toast.error(`Failed to create user: ${error.message}`);
      },
    });
  
    const handleInputChange = (field: string, value: string | boolean) => {
      setFormData((prev: typeof formData) => ({
        ...prev,
        [field]: value
      }));
    };
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (isEditing) {
        // When editing, only password is optional
        if (!formData.profile) {
          toast.error('Please select a profile');
          return;
        }
        editUser.mutate(formData);
      } else {
        // When creating, name, password, and profile are required
        if (!formData.name || !formData.password || !formData.profile) {
          toast.error('Please fill in all required fields: Name, Password, and Profile');
          return;
        }
        createUser.mutate(formData);
      }
    };
  
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {isEditing ? (
            <Button variant="outline" className="bg-white/50 hover:bg-white/60 border border-gray-200/50 backdrop-blur-sm transition-all duration-300">
              <Pencil className="w-4 h-4 text-blue-600" />
            </Button>
          ) : (
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-blue-500/25 transition-all duration-300">
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="h-fit overflow-y-auto bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-2xl rounded-2xl">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50/50 via-white/50 to-purple-50/50 rounded-2xl" />
          
          <DialogHeader className="relative space-y-4">
            <div className="flex items-center">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                {isEditing ? 'Edit User' : 'Add User'}
              </DialogTitle>
            </div>
            
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-2 p-1 bg-gray-100/50 rounded-xl">
                <TabsTrigger 
                  className="outline-none border-none data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:bg-white/50" 
                  value="general"
                >
                  General
                </TabsTrigger>
                <TabsTrigger 
                  className="outline-none border-none data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:bg-white/50" 
                  value="details"
                >
                  Details
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="mt-6">
                <TabsContent value="general" className="space-y-6">
                  <div className="w-full space-y-6">
                    <div className="grid gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Server</label>
                        <Select
                          value={formData.server}
                          onValueChange={(value) => handleInputChange('server', value)}
                        >
                          <SelectTrigger className="w-full bg-white/50 border-gray-200/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300">
                            <SelectValue placeholder="Select server" />
                          </SelectTrigger>
                          <SelectContent>
                            {serversLoading ? (
                              <SelectItem value="loading">Loading...</SelectItem>
                            ) : (
                              <>
                                <SelectItem value="all">All</SelectItem>
                                {allServers?.map((server) => (
                                  <SelectItem key={server} value={server}>
                                    {server}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Name</label>
                        <Input 
                          placeholder="Enter username" 
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="w-full bg-white/50 border-gray-200/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Password</label>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter password" 
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            className="w-full bg-white/50 border-gray-200/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">MAC Address</label>
                        <Input 
                          placeholder="Enter MAC Address" 
                          value={formData.macAddress}
                          onChange={(e) => handleInputChange('macAddress', e.target.value)}
                          className="w-full bg-white/50 border-gray-200/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Profile</label>
                        <Select
                          value={formData.profile}
                          onValueChange={(value) => handleInputChange('profile', value)}
                        >
                          <SelectTrigger className="w-full bg-white/50 border-gray-200/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300">
                            <SelectValue placeholder="Select profile" />
                          </SelectTrigger>
                          <SelectContent>
                            {profilesLoading ? (
                              <SelectItem value="loading">Loading...</SelectItem>
                            ) : (
                              allProfiles?.map((profile) => (
                                <SelectItem key={profile} value={profile}>
                                  {profile}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Time Limit</label>
                        <Input 
                          placeholder="1h, 30m, etc." 
                          value={formData.timeLimit}
                          onChange={(e) => handleInputChange('timeLimit', e.target.value)}
                          className="w-full bg-white/50 border-gray-200/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Data Limit</label>
                        <Input 
                          placeholder="1G, 500M, etc." 
                          value={formData.dataLimit}
                          onChange={(e) => handleInputChange('dataLimit', e.target.value)}
                          className="w-full bg-white/50 border-gray-200/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Comment</label>
                        <Input 
                          placeholder="Add a comment" 
                          value={formData.comment}
                          onChange={(e) => handleInputChange('comment', e.target.value)}
                          className="w-full bg-white/50 border-gray-200/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-6">
                  <div className="w-full space-y-6">
                    <div className="grid gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Uptime</label>
                        <Input 
                          disabled={isEditing}
                          placeholder="00:11:22:33:44:55"
                          className={`w-full bg-gray-50/50 border-gray-200/50 ${isEditing ? 'bg-gray-50/50 cursor-not-allowed' : ''}`}
                          onChange={(e) => handleInputChange('uptime', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Bytes In</label>
                        <Input 
                          disabled={isEditing}  
                          type="number"
                          placeholder="1000000000"
                          className={`w-full bg-gray-50/50 border-gray-200/50 ${isEditing ? 'bg-gray-50/50 cursor-not-allowed' : ''}`}
                          onChange={(e) => handleInputChange('bytesIn', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Bytes Out</label>
                        <Input 
                          disabled={isEditing}
                          type="number"
                          placeholder="1000000000"
                          className={`w-full bg-gray-50/50 border-gray-200/50 ${isEditing ? 'bg-gray-50/50 cursor-not-allowed' : ''}`}
                          onChange={(e) => handleInputChange('bytesOut', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Limit Uptime</label>
                        <Input 
                          disabled={isEditing}
                          placeholder="1h, 30m, etc."
                          className={`w-full bg-gray-50/50 border-gray-200/50 ${isEditing ? 'bg-gray-50/50 cursor-not-allowed' : ''}`}
                          onChange={(e) => handleInputChange('limitUptime', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Limit Bytes Total</label>
                        <Input 
                          disabled={isEditing}
                          placeholder="30d, 24h, etc."
                          className={`w-full bg-gray-50/50 border-gray-200/50 ${isEditing ? 'bg-gray-50/50 cursor-not-allowed' : ''}`}
                          onChange={(e) => handleInputChange('limitBytesTotal', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">User Code</label>
                        <Input 
                          disabled={isEditing}
                          type="number"
                          placeholder="1234567890"
                          className={`w-full bg-gray-50/50 border-gray-200/50 ${isEditing ? 'bg-gray-50/50 cursor-not-allowed' : ''}`}
                          onChange={(e) => handleInputChange('userCode', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Expire Date</label>
                        <Input 
                          disabled={isEditing}
                          placeholder=""
                          className={`w-full bg-gray-50/50 border-gray-200/50 ${isEditing ? 'bg-gray-50/50 cursor-not-allowed' : ''}`}
                          onChange={(e) => handleInputChange('expireDate', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <div className="flex justify-end space-x-3 mt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    className="bg-white/50 hover:bg-white/60 border border-gray-200/50 backdrop-blur-sm transition-all duration-300"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                    disabled={isEditing ? editUser.isPending : createUser.isPending}
                  >
                    {isEditing ? (
                      editUser.isPending ? (
                        <>
                          <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Pencil className="w-4 h-4 mr-2" />
                          Update User
                        </>
                      )
                    ) : (
                      createUser.isPending ? (
                        <>
                          <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add User
                        </>
                      )
                    )}
                  </Button>
                </div>
              </form>
            </Tabs>
          </DialogHeader>
        </DialogContent>
    </Dialog>
    );
  };